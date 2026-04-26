import crypto from "node:crypto";
import { env } from "../config/env.js";
import { ApiError } from "./apiError.js";

function base64UrlEncode(input) {
  return Buffer.from(input).toString("base64url");
}

function base64UrlDecode(input) {
  return Buffer.from(input, "base64url").toString("utf-8");
}

function sign(payloadB64) {
  return crypto.createHmac("sha256", env.ADMIN_ACCESS_KEY).update(payloadB64).digest("base64url");
}

export function createAdminToken({ expiresInSeconds = 15 * 60, nowMs = Date.now() } = {}) {
  const iat = Math.floor(nowMs / 1000);
  const exp = iat + expiresInSeconds;
  const payload = {
    sub: "admin",
    iat,
    exp,
  };
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(payloadB64);

  return {
    token: `${payloadB64}.${signature}`,
    expires_at: new Date(exp * 1000).toISOString(),
  };
}

export function verifyAdminToken(token, nowMs = Date.now()) {
  const [payloadB64, signature] = String(token || "").split(".");
  if (!payloadB64 || !signature) {
    throw new ApiError(401, "ADMIN_UNAUTHORIZED", "Invalid admin token");
  }

  const expected = sign(payloadB64);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    throw new ApiError(401, "ADMIN_UNAUTHORIZED", "Invalid admin token");
  }

  let payload;
  try {
    payload = JSON.parse(base64UrlDecode(payloadB64));
  } catch {
    throw new ApiError(401, "ADMIN_UNAUTHORIZED", "Invalid admin token");
  }

  if (payload.sub !== "admin" || typeof payload.exp !== "number") {
    throw new ApiError(401, "ADMIN_UNAUTHORIZED", "Invalid admin token");
  }

  const nowSec = Math.floor(nowMs / 1000);
  if (payload.exp <= nowSec) {
    throw new ApiError(401, "ADMIN_UNAUTHORIZED", "Admin token expired");
  }

  return payload;
}

