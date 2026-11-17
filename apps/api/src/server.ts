import { app } from "./app";
import { env } from "./config/env";
import { logger } from "./lib/logger";

const server = app.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  logger.info(`Swagger API docs available at http://localhost:${env.PORT}/docs`);
  logger.info(`Health check at http://localhost:${env.PORT}/health`);
});

const gracefulShutdown = () => {
  logger.info("Received termination signal, shutting down gracefully...");
  server.close(() => {
    logger.info("HTTP server closed.");
    process.exit(0);
  });
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
