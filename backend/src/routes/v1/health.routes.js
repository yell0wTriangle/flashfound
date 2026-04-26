import { Router } from "express";
import { apiSuccess } from "../../utils/apiResponse.js";
import { API_VERSION } from "../../config/constants.js";

export const healthRoutes = Router();

healthRoutes.get("/health", (_req, res) => {
  res.status(200).json(
    apiSuccess({
      status: "healthy",
      version: API_VERSION,
    }),
  );
});
