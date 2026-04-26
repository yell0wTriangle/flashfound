import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { analyzeFacesFromUrl } from "./faceAnalysis.js";

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

export function createFaceVerifier() {
  return {
    async verifySelfieFromUrl(selfieUrl) {
      let analyzed;
      try {
        analyzed = await analyzeFacesFromUrl({
          imageUrl: selfieUrl,
          timeoutMs: env.VERIFICATION_FETCH_TIMEOUT_MS,
          maxBytes: env.VERIFICATION_MAX_IMAGE_BYTES,
          userAgent: "FlashFound-Verification/1.0",
        });
      } catch (error) {
        const code = error?.code || "MEDIAPIPE_DETECTOR_FAILED";
        logger.warn(
          {
            selfieUrl,
            code,
            err: error instanceof Error ? error.message : String(error),
          },
          "Selfie verification image analysis failed",
        );
        return {
          passed: false,
          failure_code: code,
          face_count: 0,
          quality_score: 0,
          face_embedding: null,
          face_box: null,
        };
      }

      const faceCount = analyzed.faces.length;
      if (faceCount === 0) {
        return {
          passed: false,
          failure_code: "NO_FACE_DETECTED",
          face_count: 0,
          quality_score: 0,
          face_embedding: null,
          face_box: null,
        };
      }

      if (faceCount > 1) {
        return {
          passed: false,
          failure_code: "MULTIPLE_FACES_DETECTED",
          face_count: faceCount,
          quality_score: 0,
          face_embedding: null,
          face_box: null,
        };
      }

      const face = analyzed.faces[0];
      const quality = computeQuality({
        x1: face.box.x1,
        y1: face.box.y1,
        x2: face.box.x2,
        y2: face.box.y2,
        width: analyzed.width,
        height: analyzed.height,
        confidence: face.confidence,
      });

      if (quality.faceRatio < env.VERIFICATION_MIN_FACE_RATIO) {
        return {
          passed: false,
          failure_code: "FACE_TOO_SMALL",
          face_count: 1,
          quality_score: quality.qualityScore,
          face_embedding: null,
          face_box: face.box,
        };
      }

      if (face.confidence < env.VERIFICATION_MIN_FACE_CONFIDENCE) {
        return {
          passed: false,
          failure_code: "LOW_FACE_CONFIDENCE",
          face_count: 1,
          quality_score: quality.qualityScore,
          face_embedding: null,
          face_box: face.box,
        };
      }

      return {
        passed: true,
        failure_code: null,
        face_count: 1,
        quality_score: quality.qualityScore,
        face_embedding: face.embedding,
        face_box: face.box,
      };
    },
  };
}
