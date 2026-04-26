import { describe, expect, it } from "vitest";
import { createAdminToken, verifyAdminToken } from "../src/utils/adminToken.js";
import { ApiError } from "../src/utils/apiError.js";

describe("admin token utility", () => {
  it("creates and verifies valid token", () => {
    const now = Date.parse("2026-01-01T00:00:00.000Z");
    const { token } = createAdminToken({ expiresInSeconds: 60, nowMs: now });
    const payload = verifyAdminToken(token, now);

    expect(payload.sub).toBe("admin");
    expect(payload.exp).toBeGreaterThan(payload.iat);
  });

  it("rejects expired token", () => {
    const now = Date.parse("2026-01-01T00:00:00.000Z");
    const { token } = createAdminToken({ expiresInSeconds: 1, nowMs: now });

    expect(() => verifyAdminToken(token, now + 2000)).toThrow(ApiError);
  });

  it("rejects invalid token signature", () => {
    const now = Date.parse("2026-01-01T00:00:00.000Z");
    const { token } = createAdminToken({ expiresInSeconds: 60, nowMs: now });
    const tampered = `${token}x`;

    expect(() => verifyAdminToken(tampered, now)).toThrow(ApiError);
  });
});

