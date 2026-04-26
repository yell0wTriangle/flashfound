import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const baseEnv = {
  NODE_ENV: "test",
  PORT: "8080",
  FRONTEND_ORIGIN: "http://127.0.0.1:5173",
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_ANON_KEY: "anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "service-key",
  ADMIN_ACCESS_KEY: "admin-key",
};

describe("Environment validation", () => {
  it("fails when SUPABASE_URL is missing", () => {
    const env = { ...process.env, ...baseEnv };
    env.SUPABASE_URL = "";

    const result = spawnSync(
      process.execPath,
      ["--input-type=module", "-e", 'import("./src/config/env.js")'],
      { cwd: process.cwd(), env, encoding: "utf-8" },
    );

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("SUPABASE_URL");
  });

  it("fails when PORT is invalid", () => {
    const env = { ...process.env, ...baseEnv, PORT: "not-a-number" };

    const result = spawnSync(
      process.execPath,
      ["--input-type=module", "-e", 'import("./src/config/env.js")'],
      { cwd: process.cwd(), env, encoding: "utf-8" },
    );

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("PORT");
  });
});
