import { ApiError } from "../utils/apiError.js";
import { createProfileRepository } from "../repositories/profileRepository.js";

const profileRepository = createProfileRepository();

export async function onboardingRequired(req, _res, next) {
  try {
    const profile = await profileRepository.findById(req.user.id);
    if (!profile) {
      throw new ApiError(404, "PROFILE_NOT_FOUND", "Profile not found");
    }

    if (!profile.face_verification_completed) {
      throw new ApiError(403, "ONBOARDING_INCOMPLETE", "Selfie verification is required");
    }

    req.profile = profile;
    next();
  } catch (error) {
    next(error);
  }
}
