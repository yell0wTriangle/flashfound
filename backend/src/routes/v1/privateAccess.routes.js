import { Router } from "express";
import { z } from "zod";
import { auth } from "../../middleware/auth.js";
import { onboardingRequired } from "../../middleware/onboardingRequired.js";
import { ApiError } from "../../utils/apiError.js";
import { apiSuccess } from "../../utils/apiResponse.js";
import { createPrivateAccessService } from "../../services/privateAccessService.js";
import { createRateLimit } from "../../middleware/rateLimit.js";
import { env } from "../../config/env.js";

const createRequestSchema = z.object({
  event_id: z.string().uuid(),
  target_user_id: z.string().uuid(),
});
const requestIdParamSchema = z.object({
  id: z.string().uuid(),
});

export function createPrivateAccessRoutes(service = createPrivateAccessService()) {
  const router = Router();
  const privateRequestRateLimit = createRateLimit({
    windowMs: env.RATE_LIMIT_PRIVATE_ACCESS_WINDOW_MS,
    max: env.RATE_LIMIT_PRIVATE_ACCESS_MAX,
    code: "RATE_LIMITED_PRIVATE_ACCESS",
    message: "Too many private access requests",
    keyGenerator: (req) => req.user?.id || req.ip || "unknown",
  });
  router.use("/private-access", auth, onboardingRequired);

  router.post("/private-access/requests", privateRequestRateLimit, async (req, res, next) => {
    try {
      const parsed = createRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ApiError(400, "VALIDATION_ERROR", "Invalid private access payload", parsed.error.format());
      }

      const data = await service.requestAccess({
        user: req.user,
        eventId: parsed.data.event_id,
        targetUserId: parsed.data.target_user_id,
      });
      res.status(200).json(apiSuccess(data));
    } catch (error) {
      next(error);
    }
  });

  router.post("/private-access/requests/:id/approve", async (req, res, next) => {
    try {
      const params = requestIdParamSchema.safeParse(req.params);
      if (!params.success) {
        throw new ApiError(400, "VALIDATION_ERROR", "Invalid private access request id", params.error.format());
      }
      const data = await service.approveRequest({
        user: req.user,
        requestId: params.data.id,
      });
      res.status(200).json(apiSuccess(data));
    } catch (error) {
      next(error);
    }
  });

  router.post("/private-access/requests/:id/deny", async (req, res, next) => {
    try {
      const params = requestIdParamSchema.safeParse(req.params);
      if (!params.success) {
        throw new ApiError(400, "VALIDATION_ERROR", "Invalid private access request id", params.error.format());
      }
      const data = await service.denyRequest({
        user: req.user,
        requestId: params.data.id,
      });
      res.status(200).json(apiSuccess(data));
    } catch (error) {
      next(error);
    }
  });

  return router;
}
