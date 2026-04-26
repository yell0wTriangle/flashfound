import { Router } from "express";
import { z } from "zod";
import { auth } from "../../middleware/auth.js";
import { onboardingRequired } from "../../middleware/onboardingRequired.js";
import { adminAuth } from "../../middleware/adminAuth.js";
import { ApiError } from "../../utils/apiError.js";
import { apiSuccess } from "../../utils/apiResponse.js";
import { createOrganiserAccessService } from "../../services/organiserAccessService.js";
import { createRateLimit } from "../../middleware/rateLimit.js";
import { env } from "../../config/env.js";

const adminAuthSchema = z.object({
  access_key: z.string().min(1),
});

const listRequestsQuerySchema = z.object({
  q: z.string().optional(),
  status: z.enum(["pending", "approved", "denied"]).optional(),
});
const requestIdParamSchema = z.object({
  id: z.string().uuid(),
});

export function createOrganiserAccessRoutes(service = createOrganiserAccessService()) {
  const router = Router();
  const adminAuthRateLimit = createRateLimit({
    windowMs: env.RATE_LIMIT_ADMIN_AUTH_WINDOW_MS,
    max: env.RATE_LIMIT_ADMIN_AUTH_MAX,
    code: "RATE_LIMITED_ADMIN_AUTH",
    message: "Too many admin auth attempts",
  });

  router.post("/organiser-access/request", auth, onboardingRequired, async (req, res, next) => {
    try {
      const data = await service.requestAccess(req.user.id);
      res.status(200).json(apiSuccess(data));
    } catch (error) {
      next(error);
    }
  });

  router.post("/admin/auth", adminAuthRateLimit, async (req, res, next) => {
    try {
      const parsed = adminAuthSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ApiError(400, "VALIDATION_ERROR", "Invalid admin auth payload", parsed.error.format());
      }

      const data = await service.adminLogin(parsed.data.access_key);
      res.status(200).json(apiSuccess(data));
    } catch (error) {
      next(error);
    }
  });

  router.get("/admin/organiser-requests", adminAuth, async (req, res, next) => {
    try {
      const parsed = listRequestsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        throw new ApiError(400, "VALIDATION_ERROR", "Invalid list query", parsed.error.format());
      }

      const data = await service.listRequests({
        q: parsed.data.q || "",
        status: parsed.data.status,
      });
      res.status(200).json(apiSuccess(data));
    } catch (error) {
      next(error);
    }
  });

  router.post("/admin/organiser-requests/:id/approve", adminAuth, async (req, res, next) => {
    try {
      const params = requestIdParamSchema.safeParse(req.params);
      if (!params.success) {
        throw new ApiError(400, "VALIDATION_ERROR", "Invalid organiser request id", params.error.format());
      }
      const data = await service.approveRequest({
        requestId: params.data.id,
        actor: req.admin?.sub || "admin_key",
      });
      res.status(200).json(apiSuccess(data));
    } catch (error) {
      next(error);
    }
  });

  router.post("/admin/organiser-requests/:id/deny", adminAuth, async (req, res, next) => {
    try {
      const params = requestIdParamSchema.safeParse(req.params);
      if (!params.success) {
        throw new ApiError(400, "VALIDATION_ERROR", "Invalid organiser request id", params.error.format());
      }
      const data = await service.denyRequest({
        requestId: params.data.id,
        actor: req.admin?.sub || "admin_key",
      });
      res.status(200).json(apiSuccess(data));
    } catch (error) {
      next(error);
    }
  });

  return router;
}
