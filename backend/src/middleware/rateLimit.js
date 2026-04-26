import { ApiError } from "../utils/apiError.js";

function cleanupExpired(store, now) {
  for (const [key, value] of store.entries()) {
    if (value.resetAt <= now) {
      store.delete(key);
    }
  }
}

export function createRateLimit({
  windowMs,
  max,
  code = "RATE_LIMITED",
  message = "Too many requests",
  keyGenerator,
} = {}) {
  if (!windowMs || !max) {
    throw new Error("createRateLimit requires windowMs and max");
  }

  const store = new Map();

  return function rateLimit(req, _res, next) {
    const now = Date.now();
    cleanupExpired(store, now);

    const key = keyGenerator ? keyGenerator(req) : req.ip || "unknown";
    const existing = store.get(key);

    if (!existing || existing.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    existing.count += 1;
    if (existing.count > max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
      next(
        new ApiError(429, code, message, {
          retry_after_seconds: retryAfterSeconds,
        }),
      );
      return;
    }

    next();
  };
}
