import * as faceDetection from "@tensorflow-models/face-detection";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-cpu";
import util from "node:util";
import sharp from "sharp";
import { env } from "../config/env.js";

let detectorPromise;

function makeCodedError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function resolveDetectionBox(detection) {
  const box = detection?.box;
  if (!box) {
    return { x1: 0, y1: 0, x2: 0, y2: 0 };
  }
  const x1 = Number(box.xMin || 0);
  const y1 = Number(box.yMin || 0);
  const width = Number(box.width || 0);
  const height = Number(box.height || 0);
  return {
    x1,
    y1,
    x2: x1 + width,
    y2: y1 + height,
  };
}

function resolveConfidence(detection) {
  const score = Array.isArray(detection?.score) ? detection.score[0] : detection?.score;
  if (typeof score === "number" && Number.isFinite(score)) {
    return score;
  }
  return 1;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeEmbedding(values) {
  const norm = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
  if (!norm) {
    return values.map(() => 0);
  }
  return values.map((value) => Number((value / norm).toFixed(6)));
}

function mapKeypoints(detection) {
  if (!Array.isArray(detection?.keypoints)) {
    return [];
  }
  return detection.keypoints.map((point) => ({
    x: Number(point.x || 0),
    y: Number(point.y || 0),
    name: point.name || null,
  }));
}

async function getFaceDetector() {
  if (!detectorPromise) {
    detectorPromise = (async () => {
      if (typeof util.isNullOrUndefined !== "function") {
        util.isNullOrUndefined = (value) => value === null || value === undefined;
      }
      await tf.setBackend("cpu");
      await tf.ready();
      const model = faceDetection.SupportedModels.MediaPipeFaceDetector;
      return faceDetection.createDetector(model, {
        runtime: "tfjs",
        modelType: "short",
        maxFaces: 20,
      });
    })();
  }
  return detectorPromise;
}

async function createDecodedImage(arrayBuffer) {
  const normalized = sharp(Buffer.from(arrayBuffer)).rotate().toColorspace("srgb").removeAlpha();
  const { data, info } = await normalized.raw().toBuffer({ resolveWithObject: true });
  if (!info.width || !info.height || !info.channels) {
    throw makeCodedError("IMAGE_DECODE_FAILED", "Decoded image metadata unavailable");
  }

  const encodedBuffer = await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: info.channels,
    },
  })
    .jpeg({ quality: 94 })
    .toBuffer();

  return {
    tensor: tf.tensor3d(new Uint8Array(data), [info.height, info.width, info.channels], "int32"),
    width: info.width,
    height: info.height,
    encodedBuffer,
  };
}

async function extractFaceEmbedding({ encodedBuffer, width, height, box }) {
  const left = clamp(Math.floor(box.x1), 0, Math.max(0, width - 1));
  const top = clamp(Math.floor(box.y1), 0, Math.max(0, height - 1));
  const faceWidth = clamp(Math.ceil(box.x2 - box.x1), 1, Math.max(1, width - left));
  const faceHeight = clamp(Math.ceil(box.y2 - box.y1), 1, Math.max(1, height - top));

  const extracted = await sharp(encodedBuffer)
    .extract({
      left,
      top,
      width: faceWidth,
      height: faceHeight,
    })
    .resize(16, 16, { fit: "fill" })
    .grayscale()
    .raw()
    .toBuffer();

  const values = Array.from(extracted).map((value) => value / 255);
  return normalizeEmbedding(values);
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
    decoded = await createDecodedImage(arrayBuffer);
  } catch (error) {
    if (error?.code) throw error;
    throw makeCodedError(
      "IMAGE_DECODE_FAILED",
      error instanceof Error ? error.message : "Could not decode image",
    );
  }

  let detections = [];
  try {
    const detector = await getFaceDetector();
    detections = await detector.estimateFaces(decoded.tensor);
  } catch (error) {
    throw makeCodedError(
      "MEDIAPIPE_DETECTOR_FAILED",
      error instanceof Error ? error.message : "Face detector failed",
    );
  } finally {
    decoded.tensor.dispose();
  }

  const faces = [];
  for (let index = 0; index < detections.length; index += 1) {
    const detection = detections[index];
    const box = resolveDetectionBox(detection);
    const embedding = await extractFaceEmbedding({
      encodedBuffer: decoded.encodedBuffer,
      width: decoded.width,
      height: decoded.height,
      box,
    });

    faces.push({
      face_index: index,
      box,
      confidence: resolveConfidence(detection),
      keypoints: mapKeypoints(detection),
      embedding,
    });
  }

  return {
    width: decoded.width,
    height: decoded.height,
    faces,
  };
}

export function cosineSimilarity(embeddingA, embeddingB) {
  if (!Array.isArray(embeddingA) || !Array.isArray(embeddingB)) {
    return 0;
  }

  const length = Math.min(embeddingA.length, embeddingB.length);
  if (!length) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let index = 0; index < length; index += 1) {
    const a = Number(embeddingA[index] || 0);
    const b = Number(embeddingB[index] || 0);
    dot += a * b;
    normA += a * a;
    normB += b * b;
  }

  if (!normA || !normB) return 0;
  return Number((dot / (Math.sqrt(normA) * Math.sqrt(normB))).toFixed(6));
}
