import { Router } from "express";
import { z } from "zod";
import { auth } from "../../middleware/auth.js";
import { onboardingRequired } from "../../middleware/onboardingRequired.js";
import { organiserAuth } from "../../middleware/organiserAuth.js";
import { ApiError } from "../../utils/apiError.js";
import { apiSuccess } from "../../utils/apiResponse.js";
import { createOrganiserEventsService } from "../../services/organiserEventsService.js";

const eventStatus = z.enum(["draft", "upcoming", "completed"]);
const eventType = z.enum(["public", "private"]);

const createEventSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  date: z.string().date().optional(),
  location: z.string().trim().min(1).max(200).optional(),
  organizing_company: z.string().trim().max(200).nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  type: eventType.optional(),
  status: eventStatus.optional(),
});

const patchEventSchema = createEventSchema.refine((payload) => Object.keys(payload).length > 0, {
  message: "At least one field is required",
});

const attendeesSchema = z.object({
  emails: z.array(z.string().email()).min(1),
});

const photosSchema = z.object({
  photos: z
    .array(
      z.object({
        storage_path: z.string().min(1),
        image_url: z.string().url().nullable().optional(),
      }),
    )
    .min(1),
});

const deletePhotosSchema = z.object({
  photo_ids: z.array(z.string().uuid()).min(1),
});
const eventIdParamSchema = z.object({
  eventId: z.string().uuid(),
});
const attendeeParamSchema = z.object({
  eventId: z.string().uuid(),
  attendeeId: z.string().uuid(),
});

export function createOrganiserEventsRoutes(service = createOrganiserEventsService()) {
  const router = Router();

  router.use("/organiser", auth, onboardingRequired, organiserAuth);

  router.post("/organiser/events", async (req, res, next) => {
    try {
      const parsed = createEventSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ApiError(400, "VALIDATION_ERROR", "Invalid create event payload", parsed.error.format());
      }
      const data = await service.createEvent({ user: req.user, profile: req.profile, payload: parsed.data });
      res.status(200).json(apiSuccess(data));
    } catch (error) {
      next(error);
    }
  });

  router.patch("/organiser/events/:eventId", async (req, res, next) => {
    try {
      const params = eventIdParamSchema.safeParse(req.params);
      if (!params.success) {
        throw new ApiError(400, "VALIDATION_ERROR", "Invalid event id", params.error.format());
      }
      const parsed = patchEventSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ApiError(400, "VALIDATION_ERROR", "Invalid update event payload", parsed.error.format());
      }
      const data = await service.updateEvent({
        user: req.user,
        eventId: params.data.eventId,
        payload: parsed.data,
      });
      res.status(200).json(apiSuccess(data));
    } catch (error) {
      next(error);
    }
  });

  router.get("/organiser/events", async (req, res, next) => {
    try {
      const data = await service.listEvents({ user: req.user });
      res.status(200).json(apiSuccess(data));
    } catch (error) {
      next(error);
    }
  });

  router.post("/organiser/events/:eventId/attendees", async (req, res, next) => {
    try {
      const params = eventIdParamSchema.safeParse(req.params);
      if (!params.success) {
        throw new ApiError(400, "VALIDATION_ERROR", "Invalid event id", params.error.format());
      }
      const parsed = attendeesSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ApiError(400, "VALIDATION_ERROR", "Invalid attendees payload", parsed.error.format());
      }
      const data = await service.addAttendees({
        user: req.user,
        eventId: params.data.eventId,
        emails: parsed.data.emails,
      });
      res.status(200).json(apiSuccess(data));
    } catch (error) {
      next(error);
    }
  });

  router.delete("/organiser/events/:eventId/attendees/:attendeeId", async (req, res, next) => {
    try {
      const params = attendeeParamSchema.safeParse(req.params);
      if (!params.success) {
        throw new ApiError(400, "VALIDATION_ERROR", "Invalid attendee path params", params.error.format());
      }
      const data = await service.removeAttendee({
        user: req.user,
        eventId: params.data.eventId,
        attendeeId: params.data.attendeeId,
      });
      res.status(200).json(apiSuccess(data));
    } catch (error) {
      next(error);
    }
  });

  router.post("/organiser/events/:eventId/photos", async (req, res, next) => {
    try {
      const params = eventIdParamSchema.safeParse(req.params);
      if (!params.success) {
        throw new ApiError(400, "VALIDATION_ERROR", "Invalid event id", params.error.format());
      }
      const parsed = photosSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ApiError(400, "VALIDATION_ERROR", "Invalid photos payload", parsed.error.format());
      }
      const data = await service.addPhotos({
        user: req.user,
        eventId: params.data.eventId,
        photos: parsed.data.photos,
      });
      res.status(200).json(apiSuccess(data));
    } catch (error) {
      next(error);
    }
  });

  router.delete("/organiser/events/:eventId/photos", async (req, res, next) => {
    try {
      const params = eventIdParamSchema.safeParse(req.params);
      if (!params.success) {
        throw new ApiError(400, "VALIDATION_ERROR", "Invalid event id", params.error.format());
      }
      const parsed = deletePhotosSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ApiError(400, "VALIDATION_ERROR", "Invalid delete photos payload", parsed.error.format());
      }
      const data = await service.removePhotos({
        user: req.user,
        eventId: params.data.eventId,
        photoIds: parsed.data.photo_ids,
      });
      res.status(200).json(apiSuccess(data));
    } catch (error) {
      next(error);
    }
  });

  router.get("/organiser/dashboard", async (req, res, next) => {
    try {
      const data = await service.dashboard({ user: req.user });
      res.status(200).json(apiSuccess(data));
    } catch (error) {
      next(error);
    }
  });

  return router;
}
