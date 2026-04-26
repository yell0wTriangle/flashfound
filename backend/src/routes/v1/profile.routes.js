import { Router } from "express";
import { z } from "zod";
import { auth } from "../../middleware/auth.js";
import { apiSuccess } from "../../utils/apiResponse.js";
import { createProfileService } from "../../services/profileService.js";
import { ApiError } from "../../utils/apiError.js";
import { createProfileRepository } from "../../repositories/profileRepository.js";
import { createVerificationRepository } from "../../repositories/verificationRepository.js";

const profilePatchSchema = z
  .object({
    display_name: z.string().trim().min(1).max(100).optional(),
    display_avatar_url: z.string().url().nullable().optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field is required",
  });

const verificationPatchSchema = z.object({
  verification_selfie_url: z.string().url(),
});

export function createProfileRoutes(
  service = createProfileService(createProfileRepository(), createVerificationRepository()),
) {
  const router = Router();

  router.post("/profile/bootstrap", auth, async (req, res, next) => {
    try {
      const result = await service.bootstrapProfile(req.user);
      res.status(200).json(apiSuccess(result));
    } catch (error) {
      next(error);
    }
  });

  router.get("/profile/me", auth, async (req, res, next) => {
    try {
      const profile = await service.getProfile(req.user.id);
      res.status(200).json(apiSuccess({ profile }));
    } catch (error) {
      next(error);
    }
  });

  router.patch("/profile/me", auth, async (req, res, next) => {
    try {
      const parsed = profilePatchSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ApiError(400, "VALIDATION_ERROR", "Invalid profile payload", parsed.error.format());
      }

      const profile = await service.patchProfile(req.user.id, parsed.data);
      res.status(200).json(apiSuccess({ profile }));
    } catch (error) {
      next(error);
    }
  });

  router.patch("/profile/verification-selfie", auth, async (req, res, next) => {
    try {
      const parsed = verificationPatchSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ApiError(
          400,
          "VALIDATION_ERROR",
          "Invalid verification selfie payload",
          parsed.error.format(),
        );
      }

      const profile = await service.patchVerificationSelfie(req.user.id, parsed.data);
      res.status(200).json(apiSuccess({ profile }));
    } catch (error) {
      next(error);
    }
  });

  router.get("/profile/onboarding-status", auth, async (req, res, next) => {
    try {
      const result = await service.getOnboardingStatus(req.user.id);
      res.status(200).json(apiSuccess(result));
    } catch (error) {
      next(error);
    }
  });

  return router;
}
