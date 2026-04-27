import { createRequire } from "node:module";
import path from "node:path";
import util from "node:util";
import sharp from "sharp";
import { env } from "../config/env.js";

const require = createRequire(import.meta.url);
const FACE_API_MODEL_DIR = path.join(
  path.dirname(require.resolve("@vladmandic/face-api/package.json")),
  "model",
);

let faceApiModelsPromise;

function makeCodedError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function resolveDetectionBox(detection) {
  const box = detection?.box;
  if (!box) {
    return { x1: 0, y1: 0, x2: 0, y2: 0 };
  }

  const x1 = Number(box.x ?? box.left ?? 0);
  const y1 = Number(box.y ?? box.top ?? 0);
  const width = Number(box.width ?? 0);
  const height = Number(box.height ?? 0);

  return {
    x1,
    y1,
    x2: x1 + width,
    y2: y1 + height,
  };
}

function resolveConfidence(detection) {
  const score = detection?.score;
  if (typeof score === "number" && Number.isFinite(score)) {
    return score;
  }
  return 1;
}

function mapKeypoints(landmarks) {
  if (!Array.isArray(landmarks?.positions)) {
    return [];
  }
  return landmarks.positions.map((point) => ({
    x: Number(point.x || 0),
    y: Number(point.y || 0),
    name: null,
  }));
}

function normalizeDescriptor(descriptor) {
  if (!descriptor || typeof descriptor.length !== "number") {
    return null;
  }
  const values = Array.from(descriptor).map((value) => Number(Number(value).toFixed(6)));
  if (!values.length || values.some((value) => !Number.isFinite(value))) {
    return null;
  }
  return values;
}

async function getFaceApiModels() {
  if (!faceApiModelsPromise) {
    faceApiModelsPromise = (async () => {
      if (typeof util.isNullOrUndefined !== "function") {
        util.isNullOrUndefined = (value) => value == null;
      }

      const faceapi = await import("@vladmandic/face-api");
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromDisk(FACE_API_MODEL_DIR),
        faceapi.nets.faceLandmark68Net.loadFromDisk(FACE_API_MODEL_DIR),
        faceapi.nets.faceRecognitionNet.loadFromDisk(FACE_API_MODEL_DIR),
      ]);

      return {
        faceapi,
        detectorOptions: new faceapi.SsdMobilenetv1Options({
          minConfidence: env.FACE_DESCRIPTOR_MIN_CONFIDENCE,
          maxResults: 20,
        }),
      };
    })();
  }

  return faceApiModelsPromise;
}

async function createNormalizedImage(arrayBuffer) {
  const { data, info } = await sharp(Buffer.from(arrayBuffer))
    .rotate()
    .toColorspace("srgb")
    .removeAlpha()
    .jpeg({ quality: 94 })
    .toBuffer({ resolveWithObject: true });

  if (!info.width || !info.height) {
    throw makeCodedError("IMAGE_DECODE_FAILED", "Decoded image metadata unavailable");
  }

  return {
    encodedBuffer: data,
    width: info.width,
    height: info.height,
  };
}

export async function analyzeFacesFromUrl({
  imageUrl,
  timeoutMs = env.FACE_INDEX_FETCH_TIMEOUT_MS,
  maxBytes = env.FACE_INDEX_MAX_IMAGE_BYTES,
  userAgent = "FlashFound-FaceAnalysis/1.0",
}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: { "User-Agent": userAgent },
    });
  } catch (error) {
    clearTimeout(timer);
    throw makeCodedError(
      "IMAGE_FETCH_FAILED",
      error instanceof Error ? error.message : "Failed to fetch image",
    );
  } finally {
    clearTimeout(timer);
  }

  if (!response?.ok) {
    throw makeCodedError("IMAGE_FETCH_FAILED", `Image fetch failed (${response?.status || "unknown"})`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) {
    throw makeCodedError("INVALID_IMAGE_CONTENT_TYPE", `Unsupported content type: ${contentType}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  if (arrayBuffer.byteLength > maxBytes) {
    throw makeCodedError("IMAGE_TOO_LARGE", "Image payload exceeded configured size limit");
  }

  let decoded;
  try {
    decoded = await createNormalizedImage(arrayBuffer);
  } catch (error) {
    if (error?.code) throw error;
    throw makeCodedError(
      "IMAGE_DECODE_FAILED",
      error instanceof Error ? error.message : "Could not decode image",
    );
  }

  const { faceapi, detectorOptions } = await getFaceApiModels();
  let tensor;
  let detections = [];
  try {
    tensor = faceapi.tf.node.decodeImage(decoded.encodedBuffer, 3);
    detections = await faceapi
      .detectAllFaces(tensor, detectorOptions)
      .withFaceLandmarks()
      .withFaceDescriptors();
  } catch (error) {
    throw makeCodedError(
      "FACE_DESCRIPTOR_FAILED",
      error instanceof Error ? error.message : "Face descriptor model failed",
    );
  } finally {
    if (tensor) {
      faceapi.tf.dispose(tensor);
    }
  }

  const faces = [];
  for (let index = 0; index < detections.length; index += 1) {
    const result = detections[index];
    const box = resolveDetectionBox(result.detection);
    const embedding = normalizeDescriptor(result.descriptor);
    if (!embedding) {
      continue;
    }

    faces.push({
      face_index: index,
      box: {
        x1: clamp(box.x1, 0, decoded.width),
        y1: clamp(box.y1, 0, decoded.height),
        x2: clamp(box.x2, 0, decoded.width),
        y2: clamp(box.y2, 0, decoded.height),
      },
      confidence: resolveConfidence(result.detection),
      keypoints: mapKeypoints(result.landmarks),
      embedding,
      embedding_model: "face-api-ssd-128d",
    });
  }

  return {
    width: decoded.width,
    height: decoded.height,
    faces,
  };
}

export function euclideanDistance(embeddingA, embeddingB) {
  if (!Array.isArray(embeddingA) || !Array.isArray(embeddingB)) {
    return Number.POSITIVE_INFINITY;
  }

  if (embeddingA.length !== embeddingB.length || !embeddingA.length) {
    return Number.POSITIVE_INFINITY;
  }

  let sum = 0;
  for (let index = 0; index < embeddingA.length; index += 1) {
    const a = Number(embeddingA[index]);
    const b = Number(embeddingB[index]);
    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      return Number.POSITIVE_INFINITY;
    }
    const diff = a - b;
    sum += diff * diff;
  }

  return Number(Math.sqrt(sum).toFixed(6));
}
