import { ApiError } from "../utils/apiError.js";

export function notFound(req, _res, next) {
  next(new ApiError(404, "NOT_FOUND", `Route not found: ${req.method} ${req.originalUrl}`));
}
