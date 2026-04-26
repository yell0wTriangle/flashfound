import { ApiError } from "../utils/apiError.js";
import { createProfileRepository } from "../repositories/profileRepository.js";

function normalizeDisplayName(user) {
  if (user.user_metadata?.display_name) return String(user.user_metadata.display_name).trim();
  if (user.user_metadata?.full_name) return String(user.user_metadata.full_name).trim();
  if (user.email) return String(user.email).split("@")[0];
  return "FlashFound User";
}

function onboardingStatus(profile) {
  if (!profile) return "new";
  if (!profile.face_verification_completed) return "needs_selfie";
  return "ready";
}

export function createProfileService(
  repository = createProfileRepository(),
  verificationRepository = {
    async findLatestNonFinalizedSessionByUserId() {
      return null;
    },
  },
) {
  return {
    async bootstrapProfile(authUser) {
      const existing = await repository.findById(authUser.id);
      if (existing) {
        return {
          profile: existing,
          created: false,
          onboarding_status: onboardingStatus(existing),
        };
      }

      const profileInput = {
        id: authUser.id,
        email: authUser.email || "",
        display_name: normalizeDisplayName(authUser),
        role: "attendee",
        face_verification_completed: false,
      };

      const createdProfile = await repository.create(profileInput);
      return {
        profile: createdProfile,
        created: true,
        onboarding_status: "new",
      };
    },

    async getProfile(userId) {
      const profile = await repository.findById(userId);
      if (!profile) {
        throw new ApiError(404, "PROFILE_NOT_FOUND", "Profile not found");
      }
      return profile;
    },

    async patchProfile(userId, updates) {
      const profile = await repository.findById(userId);
      if (!profile) {
        throw new ApiError(404, "PROFILE_NOT_FOUND", "Profile not found");
      }
      return repository.updateById(userId, updates);
    },

    async patchVerificationSelfie(userId, input) {
      const profile = await repository.findById(userId);
      if (!profile) {
        throw new ApiError(404, "PROFILE_NOT_FOUND", "Profile not found");
      }

      const updates = {
        verification_selfie_url: input.verification_selfie_url,
        face_verification_completed: false,
      };

      return repository.updateById(userId, updates);
    },

    async getOnboardingStatus(userId) {
      const profile = await repository.findById(userId);
      const activeSession = await verificationRepository.findLatestNonFinalizedSessionByUserId(userId);
      return {
        status: onboardingStatus(profile),
        role: profile?.role || "attendee",
        profile_exists: Boolean(profile),
        verification_session: activeSession
          ? {
              id: activeSession.id,
              status: activeSession.status,
              expires_at: activeSession.expires_at,
            }
          : null,
      };
    },
  };
}
