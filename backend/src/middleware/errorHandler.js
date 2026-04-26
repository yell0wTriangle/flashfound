import { apiErrorPayload } from "../utils/apiResponse.js";

export function errorHandler(error, req, res, next) {
  void next;
  const statusCode = error.statusCode || 500;
  const code = error.code || "INTERNAL_ERROR";
  const message = error.message || "Internal server error";
  const requestId = req.id;

  if (statusCode >= 500) {
    req.log?.error({ err: error, requestId }, "Unhandled server error");
  } else {
    req.log?.warn({ code, message, requestId }, "Handled API error");
  }

  res.status(statusCode).json(
    apiErrorPayload({
      code,
      message,
      details: error.details,
      requestId,
    }),
  );
}
