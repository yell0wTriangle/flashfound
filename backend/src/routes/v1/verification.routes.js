import { Router } from "express";
import { z } from "zod";
import { auth } from "../../middleware/auth.js";
import { ApiError } from "../../utils/apiError.js";
import { apiSuccess } from "../../utils/apiResponse.js";
import { createVerificationService } from "../../services/verificationService.js";

const sessionIdSchema = z.object({
  id: z.string().uuid(),
});

const submitSchema = z.object({
  selfie_url: z.string().url(),
});

export function createVerificationRoutes(service = createVerificationService()) {
  const router = Router();
  router.use(auth);

  router.post("/verification/session/start", async (req, res, next) => {
    try {
      const data = await service.startSession({ userId: req.user.id });
      res.status(200).json(apiSuccess(data));
    } catch (error) {
      next(error);
    }
  });

  router.get("/verification/session/:id", async (req, res, next) => {
    try {
      const parsed = sessionIdSchema.safeParse(req.params);
      if (!parsed.success) {
        throw new ApiError(400, "VALIDATION_ERROR", "Invalid verification session id", parsed.error.format());
      }
      const data = await service.getSession({
        userId: req.user.id,
        sessionId: parsed.data.id,
      });
      res.status(200).json(apiSuccess(data));
    } catch (error) {
      next(error);
    }
  });

  router.post("/verification/session/:id/submit", async (req, res, next) => {
    try {
      const params = sessionIdSchema.safeParse(req.params);
      if (!params.success) {
        throw new ApiError(400, "VALIDATION_ERROR", "Invalid verification session id", params.error.format());
      }
      const parsed = submitSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ApiError(400, "VALIDATION_ERROR", "Invalid verification submit payload", parsed.error.format());
      }
      const data = await service.submitSession({
        userId: req.user.id,
        sessionId: params.data.id,
        selfieUrl: parsed.data.selfie_url,
      });
      res.status(200).json(apiSuccess(data));
    } catch (error) {
      next(error);
    }
  });

  router.post("/verification/session/:id/finalize", async (req, res, next) => {
    try {
      const params = sessionIdSchema.safeParse(req.params);
      if (!params.success) {
        throw new ApiError(400, "VALIDATION_ERROR", "Invalid verification session id", params.error.format());
      }
      const data = await service.finalizeSession({
        userId: req.user.id,
        sessionId: params.data.id,
      });
      res.status(200).json(apiSuccess(data));
    } catch (error) {
      next(error);
    }
  });

  return router;
}
