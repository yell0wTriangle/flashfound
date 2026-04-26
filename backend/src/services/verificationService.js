import { ApiError } from "../utils/apiError.js";
import { env } from "../config/env.js";
import { createVerificationRepository } from "../repositories/verificationRepository.js";
import { createProfileRepository } from "../repositories/profileRepository.js";
import { createFaceVerifier } from "./faceVerifier.js";

function ensureSessionOwner(session, userId) {
  if (!session || session.user_id !== userId) {
    throw new ApiError(404, "SESSION_NOT_FOUND", "Verification session not found");
  }
}

function ensureNotExpired(session) {
  if (new Date(session.expires_at).getTime() <= Date.now()) {
    throw new ApiError(410, "SESSION_EXPIRED", "Verification session expired");
  }
}

export function createVerificationService({
  verificationRepository = createVerificationRepository(),
  profileRepository = createProfileRepository(),
  faceVerifier = createFaceVerifier(),
} = {}) {
  return {
    async startSession({ userId }) {
      const profile = await profileRepository.findById(userId);
      if (!profile) {
        throw new ApiError(404, "PROFILE_NOT_FOUND", "Profile not found");
      }

      await verificationRepository.expireActiveSessions(userId);

      const expiresAt = new Date(
        Date.now() + env.VERIFICATION_SESSION_TTL_MINUTES * 60 * 1000,
      ).toISOString();

      const session = await verificationRepository.createSession({
        userId,
        expiresAt,
      });

      return { session };
    },

    async submitSession({ userId, sessionId, selfieUrl }) {
      const session = await verificationRepository.findSessionById(sessionId);
      ensureSessionOwner(session, userId);

      if (session.status === "finalized") {
        throw new ApiError(409, "SESSION_FINALIZED", "Verification session already finalized");
      }

      ensureNotExpired(session);

      const result = await faceVerifier.verifySelfieFromUrl(selfieUrl);

      await verificationRepository.createAttempt({
        session_id: session.id,
        user_id: userId,
        submitted_selfie_url: selfieUrl,
        passed: result.passed,
        face_count: result.face_count,
        quality_score: result.quality_score,
        failure_code: result.failure_code,
      });

      const updates = {
        selfie_url: selfieUrl,
        face_count: result.face_count,
        quality_score: result.quality_score,
        failure_code: result.failure_code,
        status: result.passed ? "submitted" : "pending",
        submitted_at: result.passed ? new Date().toISOString() : null,
      };
      const updatedSession = await verificationRepository.updateSession(session.id, updates);

      return {
        session: updatedSession,
        result,
      };
    },

    async finalizeSession({ userId, sessionId }) {
      const session = await verificationRepository.findSessionById(sessionId);
      ensureSessionOwner(session, userId);
      ensureNotExpired(session);

      if (session.status !== "submitted") {
        throw new ApiError(
          409,
          "SESSION_NOT_SUBMITTED",
          "Successful selfie submission is required before finalize",
        );
      }

      const profile = await profileRepository.findById(userId);
      if (!profile) {
        throw new ApiError(404, "PROFILE_NOT_FOUND", "Profile not found");
      }

      const updatedProfile = await profileRepository.updateById(userId, {
        verification_selfie_url: session.selfie_url,
        face_verification_completed: true,
      });

      const finalizedSession = await verificationRepository.updateSession(session.id, {
        status: "finalized",
        finalized_at: new Date().toISOString(),
        failure_code: null,
      });

      return {
        session: finalizedSession,
        profile: updatedProfile,
      };
    },

    async getSession({ userId, sessionId }) {
      const session = await verificationRepository.findSessionById(sessionId);
      ensureSessionOwner(session, userId);
      return { session };
    },
  };
}
