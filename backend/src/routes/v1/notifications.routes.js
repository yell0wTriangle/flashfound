import { Router } from "express";
import { z } from "zod";
import { auth } from "../../middleware/auth.js";
import { onboardingRequired } from "../../middleware/onboardingRequired.js";
import { apiSuccess } from "../../utils/apiResponse.js";
import { createNotificationsService } from "../../services/notificationsService.js";
import { ApiError } from "../../utils/apiError.js";

const notificationIdParamSchema = z.object({
  id: z.string().uuid(),
});

export function createNotificationsRoutes(service = createNotificationsService()) {
  const router = Router();
  router.use(auth, onboardingRequired);

  router.get("/notifications", async (req, res, next) => {
    try {
      const data = await service.list({ user: req.user });
      res.status(200).json(apiSuccess(data));
    } catch (error) {
      next(error);
    }
  });

  router.post("/notifications/:id/read", async (req, res, next) => {
    try {
      const params = notificationIdParamSchema.safeParse(req.params);
      if (!params.success) {
        throw new ApiError(400, "VALIDATION_ERROR", "Invalid notification id", params.error.format());
      }
      const data = await service.markRead({
        user: req.user,
        notificationId: params.data.id,
      });
      res.status(200).json(apiSuccess(data));
    } catch (error) {
      next(error);
    }
  });

  router.post("/notifications/read-all", async (req, res, next) => {
    try {
      const data = await service.markAllRead({ user: req.user });
      res.status(200).json(apiSuccess(data));
    } catch (error) {
      next(error);
    }
  });

  return router;
}
