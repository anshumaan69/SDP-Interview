import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { requestIdMiddleware } from "./middleware/requestId";
import { errorHandler } from "./middleware/errorHandler";
import healthRouter from "./routes/health";
import metaRouter from "./routes/meta";
import swaggerRouter from "./docs/swagger";
import { NotFoundError } from "./lib/errors";

export function createApp() {
  const app = express();

  // Security & utility middlewares
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allows swagger UI and frontend access
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(
    cors({
      origin: [env.CORS_ORIGIN, "http://localhost:3000", "http://127.0.0.1:3000"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization", "x-request-id", "Idempotency-Key"],
      exposedHeaders: ["x-request-id"],
    })
  );

  app.use(cookieParser());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(requestIdMiddleware);

  // Swagger Documentation
  app.use(swaggerRouter);

  // Base Health Check
  app.use(healthRouter);

  // API v1 Router
  const apiV1 = express.Router();
  apiV1.use(healthRouter);
  apiV1.use(metaRouter);

  app.use("/api/v1", apiV1);

  // 404 Handler
  app.use((req: Request, res: Response, next: NextFunction) => {
    next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
  });

  // Central Error Handler
  app.use(errorHandler);

  return { app, apiV1 };
}

export const { app, apiV1 } = createApp();
