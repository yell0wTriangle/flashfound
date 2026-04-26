import { Router } from "express";
import { apiSuccess } from "../utils/apiResponse.js";
import { SERVICE_NAME } from "../config/constants.js";
import { v1Routes } from "./v1/index.js";
import { checkReadiness } from "../services/readiness.js";
import { ApiError } from "../utils/apiError.js";

export function createRoutes({ readinessChecker = checkReadiness } = {}) {
  const router = Router();

  router.get("/health", (_req, res) => {
    res.status(200).json(
      apiSuccess({
        status: "healthy",
        service: SERVICE_NAME,
      }),
    );
  });

  router.get("/ready", async (req, res, next) => {
    try {
      const readiness = await readinessChecker();
      res.status(200).json(apiSuccess(readiness));
    } catch (error) {
      req.log?.error({ err: error, requestId: req.id }, "Readiness check failed");
      next(new ApiError(503, "NOT_READY", "Service dependencies are not ready"));
    }
  });

  router.use("/api/v1", v1Routes);

  return router;
}
