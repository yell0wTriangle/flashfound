import { EventEmitter } from "node:events";
import express from "express";
import httpMocks from "node-mocks-http";
import { describe, expect, it } from "vitest";
import { errorHandler } from "../src/middleware/errorHandler.js";
import { createRateLimit } from "../src/middleware/rateLimit.js";
import { requestId } from "../src/middleware/requestId.js";

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
  };
}

describe("rateLimit middleware", () => {
  it("blocks requests above limit", async () => {
    const app = express();
    app.use(requestId);
    app.use(
      createRateLimit({
        windowMs: 60_000,
        max: 2,
      }),
    );
    app.get("/limited", (_req, res) => {
      res.status(200).json({ ok: true });
    });
    app.use(errorHandler);

    const first = await callApp(app, { url: "/limited" });
    const second = await callApp(app, { url: "/limited" });
    const third = await callApp(app, { url: "/limited" });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(third.status).toBe(429);
    expect(third.body.ok).toBe(false);
    expect(third.body.error.code).toBe("RATE_LIMITED");
  });
});
