import { EventEmitter } from "node:events";
import { describe, expect, it } from "vitest";
import httpMocks from "node-mocks-http";
import { createApp } from "../src/app.js";

async function callApp(app, { method = "GET", url = "/", headers = {} } = {}) {
  const req = httpMocks.createRequest({
    method,
    url,
    headers,
  });
  const res = httpMocks.createResponse({
    eventEmitter: EventEmitter,
  });

  await new Promise((resolve, reject) => {
    res.on("end", resolve);
    app.handle(req, res, reject);
  });

  return {
    status: res.statusCode,
    body: res._getJSONData(),
    headers: res._getHeaders(),
  };
}

describe("Phase 0 route contracts", () => {
  it("returns liveness response on /health", async () => {
    const app = createApp({
      readinessChecker: async () => ({ status: "ready", dependencies: { supabase: "up" } }),
      useRequestLogger: false,
    });
    const response = await callApp(app, { url: "/health" });

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.data.status).toBe("healthy");
    expect(response.body.data.service).toBe("flashfound-backend");
  });

  it("returns versioned health response on /api/v1/health", async () => {
    const app = createApp({
      readinessChecker: async () => ({ status: "ready", dependencies: { supabase: "up" } }),
      useRequestLogger: false,
    });
    const response = await callApp(app, { url: "/api/v1/health" });

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.data.version).toBe("v1");
  });

  it("returns structured 404 contract for unknown routes", async () => {
    const app = createApp({
      readinessChecker: async () => ({ status: "ready", dependencies: { supabase: "up" } }),
      useRequestLogger: false,
    });
    const response = await callApp(app, { url: "/missing-route" });

    expect(response.status).toBe(404);
    expect(response.body.ok).toBe(false);
    expect(response.body.error.code).toBe("NOT_FOUND");
    expect(typeof response.body.error.requestId).toBe("string");
    expect(response.body.error.requestId.length).toBeGreaterThan(0);
  });

  it("returns ready payload when readiness check succeeds", async () => {
    const app = createApp({
      readinessChecker: async () => ({ status: "ready", dependencies: { supabase: "up" } }),
      useRequestLogger: false,
    });
    const response = await callApp(app, { url: "/ready" });

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.data.dependencies.supabase).toBe("up");
  });

  it("returns 503 NOT_READY when readiness check fails", async () => {
    const app = createApp({
      readinessChecker: async () => {
        throw new Error("down");
      },
      useRequestLogger: false,
    });
    const response = await callApp(app, { url: "/ready" });

    expect(response.status).toBe(503);
    expect(response.body.ok).toBe(false);
    expect(response.body.error.code).toBe("NOT_READY");
    expect(typeof response.body.error.requestId).toBe("string");
  });
});
