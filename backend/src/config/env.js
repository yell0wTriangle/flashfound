import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(8080),
  FRONTEND_ORIGIN: z.string().url(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1, "SUPABASE_ANON_KEY is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
  ADMIN_ACCESS_KEY: z.string().min(1, "ADMIN_ACCESS_KEY is required"),
  RATE_LIMIT_ADMIN_AUTH_WINDOW_MS: z.coerce.number().int().min(1000).default(60_000),
  RATE_LIMIT_ADMIN_AUTH_MAX: z.coerce.number().int().min(1).default(10),
  RATE_LIMIT_PRIVATE_ACCESS_WINDOW_MS: z.coerce.number().int().min(1000).default(60_000),
  RATE_LIMIT_PRIVATE_ACCESS_MAX: z.coerce.number().int().min(1).default(20),
  VERIFICATION_SESSION_TTL_MINUTES: z.coerce.number().int().min(1).max(120).default(15),
  VERIFICATION_FETCH_TIMEOUT_MS: z.coerce.number().int().min(1000).max(60000).default(10000),
  VERIFICATION_MAX_IMAGE_BYTES: z.coerce.number().int().min(1024).default(5 * 1024 * 1024),
  VERIFICATION_MIN_FACE_RATIO: z.coerce.number().min(0.001).max(0.9).default(0.04),
  VERIFICATION_MIN_FACE_CONFIDENCE: z.coerce.number().min(0).max(1).default(0.8),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const formatted = parsed.error.issues.map((issue) => {
    const key = issue.path.join(".") || "env";
    return `- ${key}: ${issue.message}`;
  });
  throw new Error(`Invalid environment configuration:\n${formatted.join("\n")}`);
}

export const env = parsed.data;
