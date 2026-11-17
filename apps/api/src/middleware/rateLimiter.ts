import { Request, Response, NextFunction } from "express";
import { redis } from "../lib/redis";
import { RateLimitError } from "../lib/errors";

export function rateLimiter(options: {
  windowSeconds: number;
  maxRequests: number;
  keyPrefix: string;
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // In test environment, skip rate limits
    if (process.env.NODE_ENV === "test") {
      return next();
    }

    const identifier = req.user?.id || req.ip || "unknown_client";
    const redisKey = `ratelimit:${options.keyPrefix}:${identifier}`;

    try {
      const current = await redis.incr(redisKey);
      if (current === 1) {
        await redis.expire(redisKey, options.windowSeconds);
      }

      if (current > options.maxRequests) {
        return next(
          new RateLimitError(
            `Rate limit exceeded: max ${options.maxRequests} requests per ${options.windowSeconds}s`,
            options.windowSeconds
          )
        );
      }

      next();
    } catch (e) {
      // If redis errors, allow request to proceed
      next();
    }
  };
}
