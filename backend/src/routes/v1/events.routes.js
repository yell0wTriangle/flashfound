import { Router } from "express";
import { z } from "zod";
import { auth } from "../../middleware/auth.js";
import { onboardingRequired } from "../../middleware/onboardingRequired.js";
import { apiSuccess } from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/apiError.js";
import { createEventsService } from "../../services/eventsService.js";

const discoveryQuerySchema = z.object({
  q: z.string().trim().optional(),
  privacy: z.enum(["all", "public", "private"]).optional(),
});

const resultsQuerySchema = z.object({
  person_ids: z.string().optional(),
});
const eventIdParamSchema = z.object({
  eventId: z.string().uuid(),
});

export function createEventsRoutes(service = createEventsService()) {
  const router = Router();
  router.use("/events", auth, onboardingRequired);

  router.get("/events/discovery", async (req, res, next) => {
    try {
      const parsed = discoveryQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        throw new ApiError(400, "VALIDATION_ERROR", "Invalid discovery query", parsed.error.format());
      }

      const data = await service.discovery({
        user: req.user,
        search: parsed.data.q || "",
        privacyType: parsed.data.privacy || "all",
      });
      res.status(200).json(apiSuccess(data));
    } catch (error) {
      next(error);
    }
  });

  router.get("/events/:eventId/people", async (req, res, next) => {
    try {
      const params = eventIdParamSchema.safeParse(req.params);
      if (!params.success) {
        throw new ApiError(400, "VALIDATION_ERROR", "Invalid event id", params.error.format());
      }
      const data = await service.eventPeople({
        user: req.user,
        eventId: params.data.eventId,
      });
      res.status(200).json(apiSuccess(data));
    } catch (error) {
      next(error);
    }
  });

  router.get("/events/:eventId/results", async (req, res, next) => {
    try {
      const params = eventIdParamSchema.safeParse(req.params);
      if (!params.success) {
        throw new ApiError(400, "VALIDATION_ERROR", "Invalid event id", params.error.format());
      }
      const parsed = resultsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        throw new ApiError(400, "VALIDATION_ERROR", "Invalid results query", parsed.error.format());
      }

      const data = await service.eventResults({
        user: req.user,
        eventId: params.data.eventId,
        personIdsCsv: parsed.data.person_ids || "",
      });
      res.status(200).json(apiSuccess(data));
    } catch (error) {
      next(error);
    }
  });

  return router;
}
