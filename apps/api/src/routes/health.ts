import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { redis } from "../lib/redis";
import { logger } from "../lib/logger";

const router = Router();

router.get("/health", async (req: Request, res: Response) => {
  let dbStatus = "down";
  let redisStatus = "down";

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "up";
  } catch (err) {
    logger.error({ err }, "Database health check failed");
  }

  try {
    const pong = await redis.ping();
    if (pong === "PONG") {
      redisStatus = "up";
    }
  } catch (err) {
    logger.warn({ err }, "Redis health check failed");
  }

  return res.status(200).json({
    data: {
      status: "ok",
      db: dbStatus,
      redis: redisStatus,
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
