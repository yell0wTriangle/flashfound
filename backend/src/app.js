import cors from "cors";
import express from "express";
import pinoHttp from "pino-http";
import { env } from "./config/env.js";
import { requestId } from "./middleware/requestId.js";
import { logger } from "./utils/logger.js";
import { createRoutes } from "./routes/index.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp(options = {}) {
  const { readinessChecker, useRequestLogger = true } = options;
  const app = express();
  app.set("trust proxy", 1);

  app.use(requestId);
  if (useRequestLogger) {
    app.use(
      pinoHttp({
        logger,
        genReqId: (req) => req.id,
        customProps: (req) => ({ requestId: req.id }),
      }),
    );
  }

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true);
          return;
        }

        const allowedOrigins = [env.FRONTEND_ORIGIN];
        if (env.NODE_ENV !== "production") {
          allowedOrigins.push("http://127.0.0.1:5173", "http://localhost:5173");
        }

        if (allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error(`CORS rejected origin: ${origin}`));
      },
      credentials: true,
    }),
  );

  app.use(express.json());
  app.use(createRoutes({ readinessChecker }));
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
