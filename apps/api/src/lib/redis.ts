import Redis from "ioredis";
import { env } from "../config/env";
import { logger } from "./logger";

class MemoryRedisFallback {
  private store = new Map<string, { value: string; expiresAt?: number }>();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, ...args: (string | number)[]): Promise<string> {
    let expiresAt: number | undefined;
    for (let i = 0; i < args.length; i++) {
      if (typeof args[i] === "string" && (args[i] as string).toUpperCase() === "EX") {
        const ttl = Number(args[i + 1]);
        if (!isNaN(ttl)) {
          expiresAt = Date.now() + ttl * 1000;
        }
      }
    }
    this.store.set(key, { value, expiresAt });
    return "OK";
  }

  async del(...keys: string[]): Promise<number> {
    let count = 0;
    for (const key of keys) {
      if (this.store.delete(key)) count++;
    }
    return count;
  }

  async incr(key: string): Promise<number> {
    const current = await this.get(key);
    const next = (Number(current) || 0) + 1;
    const item = this.store.get(key);
    this.store.set(key, { value: String(next), expiresAt: item?.expiresAt });
    return next;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const item = this.store.get(key);
    if (!item) return 0;
    item.expiresAt = Date.now() + seconds * 1000;
    return 1;
  }

  async ping(): Promise<string> {
    return "PONG";
  }
}

let redisInstance: Redis | MemoryRedisFallback;

try {
  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => {
      if (times > 3) return null;
      return Math.min(times * 100, 1000);
    },
    lazyConnect: true,
  });

  client.on("error", (err) => {
    logger.warn({ err: err.message }, "Redis connection warning; fallback available");
  });

  redisInstance = client;
} catch (e) {
  logger.warn("Using memory Redis fallback");
  redisInstance = new MemoryRedisFallback() as unknown as Redis;
}

export const redis = redisInstance;
export { MemoryRedisFallback };
