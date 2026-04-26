import * as blazeface from "@tensorflow-models/blazeface";
import * as tf from "@tensorflow/tfjs-node";
import { env } from "../config/env.js";

let modelPromise;

function getModel() {
  if (!modelPromise) {
    modelPromise = blazeface.load();
  }
  return modelPromise;
}

function computeQuality({ x1, y1, x2, y2, width, height, confidence }) {
  const faceWidth = Math.max(0, x2 - x1);
  const faceHeight = Math.max(0, y2 - y1);
  const faceRatio = (faceWidth * faceHeight) / (width * height);
  const centeredX = x1 >= 0 && x2 <= width;
  const centeredY = y1 >= 0 && y2 <= height;
  const centered = centeredX && centeredY;

  const ratioComponent = Math.min(1, faceRatio / env.VERIFICATION_MIN_FACE_RATIO);
  const confidenceComponent = Math.min(1, confidence / env.VERIFICATION_MIN_FACE_CONFIDENCE);
  const centerComponent = centered ? 1 : 0.6;
  const qualityScore = Number(((ratioComponent + confidenceComponent + centerComponent) / 3).toFixed(4));

  return { faceRatio, qualityScore };
}

function parsePrediction(prediction) {
  const topLeft = prediction.topLeft || [0, 0];
  const bottomRight = prediction.bottomRight || [0, 0];
  const probability = Array.isArray(prediction.probability)
    ? Number(prediction.probability[0] || 0)
    : Number(prediction.probability || 0);

  return {
    x1: Number(topLeft[0]),
    y1: Number(topLeft[1]),
    x2: Number(bottomRight[0]),
    y2: Number(bottomRight[1]),
    confidence: Number.isFinite(probability) ? probability : 0,
  };
}

export function createFaceVerifier() {
  return {
    async verifySelfieFromUrl(selfieUrl) {
      const timeout = env.VERIFICATION_FETCH_TIMEOUT_MS;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);

      let response;
      try {
        response = await fetch(selfieUrl, { signal: controller.signal });
      } finally {
        clearTimeout(timer);
      }

      if (!response?.ok) {
        return {
          passed: false,
          failure_code: "IMAGE_FETCH_FAILED",
          face_count: 0,
          quality_score: 0,
        };
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.startsWith("image/")) {
        return {
          passed: false,
          failure_code: "INVALID_IMAGE_CONTENT_TYPE",
          face_count: 0,
          quality_score: 0,
        };
      }

      const arrayBuffer = await response.arrayBuffer();
      if (arrayBuffer.byteLength > env.VERIFICATION_MAX_IMAGE_BYTES) {
        return {
          passed: false,
          failure_code: "IMAGE_TOO_LARGE",
          face_count: 0,
          quality_score: 0,
        };
      }

      let imageTensor;
      try {
        const imageBuffer = Buffer.from(arrayBuffer);
        imageTensor = tf.node.decodeImage(imageBuffer, 3);
      } catch {
        return {
          passed: false,
          failure_code: "IMAGE_DECODE_FAILED",
          face_count: 0,
          quality_score: 0,
        };
      }

      try {
        const model = await getModel();
        const predictions = await model.estimateFaces(imageTensor, false);
        const faceCount = predictions.length;

        if (faceCount === 0) {
          return {
            passed: false,
            failure_code: "NO_FACE_DETECTED",
            face_count: 0,
            quality_score: 0,
          };
        }

        if (faceCount > 1) {
          return {
            passed: false,
            failure_code: "MULTIPLE_FACES_DETECTED",
            face_count: faceCount,
            quality_score: 0,
          };
        }

        const parsed = parsePrediction(predictions[0]);
        const [height, width] = imageTensor.shape;
        const quality = computeQuality({
          ...parsed,
          width,
          height,
        });

        if (quality.faceRatio < env.VERIFICATION_MIN_FACE_RATIO) {
          return {
            passed: false,
            failure_code: "FACE_TOO_SMALL",
            face_count: 1,
            quality_score: quality.qualityScore,
          };
        }

        if (parsed.confidence < env.VERIFICATION_MIN_FACE_CONFIDENCE) {
          return {
            passed: false,
            failure_code: "LOW_FACE_CONFIDENCE",
            face_count: 1,
            quality_score: quality.qualityScore,
          };
        }

        return {
          passed: true,
          failure_code: null,
          face_count: 1,
          quality_score: quality.qualityScore,
        };
      } finally {
        imageTensor.dispose();
      }
    },
  };
}
