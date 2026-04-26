import { Router } from "express";
import { z } from "zod";
import { auth } from "../../middleware/auth.js";
import { onboardingRequired } from "../../middleware/onboardingRequired.js";
import { apiSuccess } from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/apiError.js";
import { createMyPhotosService } from "../../services/myPhotosService.js";

const addMyPhotosSchema = z.object({
  photo_ids: z.array(z.string().uuid()).min(1),
});

const listMyPhotosQuerySchema = z.object({
  event_ids: z.string().optional(),
  person_ids: z.string().optional(),
});

export function createMyPhotosRoutes(service = createMyPhotosService()) {
  const router = Router();
  router.use("/my-photos", auth, onboardingRequired);

  router.post("/my-photos", async (req, res, next) => {
    try {
      const parsed = addMyPhotosSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ApiError(400, "VALIDATION_ERROR", "Invalid my-photos payload", parsed.error.format());
      }

      const data = await service.addToMyPhotos({
        user: req.user,
        photoIds: parsed.data.photo_ids,
      });
      res.status(200).json(apiSuccess(data));
    } catch (error) {
      next(error);
    }
  });

  router.get("/my-photos", async (req, res, next) => {
    try {
      const parsed = listMyPhotosQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        throw new ApiError(400, "VALIDATION_ERROR", "Invalid my-photos query", parsed.error.format());
      }

      const data = await service.listMyPhotos({
        user: req.user,
        eventIdsCsv: parsed.data.event_ids || "",
        personIdsCsv: parsed.data.person_ids || "",
      });
      res.status(200).json(apiSuccess(data));
    } catch (error) {
      next(error);
    }
  });

  return router;
}
