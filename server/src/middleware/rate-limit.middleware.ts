import type { NextFunction, Request, Response } from "express";

import { redis, isRedisConfigured } from "../config/redis.js";
import { AppError } from "../utils/errors.js";

interface RateLimitOptions {
  keyPrefix: string;
  limit: number;
  windowSeconds: number;
}

export const redisRateLimit = ({
  keyPrefix,
  limit,
  windowSeconds,
}: RateLimitOptions) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!isRedisConfigured) {
      return next();
    }

    try {
      const forwarded = req.headers["x-forwarded-for"];
      const ip =
        (typeof forwarded === "string" ? forwarded.split(",")[0]?.trim() : null) ||
        req.ip ||
        "unknown";

      const key = `rate-limit:${keyPrefix}:${ip}`;

      const count = await redis.incr(key);

      if (count === 1) {
        await redis.expire(key, windowSeconds);
      }

      if (count > limit) {
        next(
          new AppError(
            `Too many requests. Limit of ${limit} requests per minute exceeded.`,
            429,
          ),
        );
        return;
      }

      next();
    } catch (error) {
      console.error("Redis rate limit error:", error);
      // Fail-open to avoid locking out legitimate users during transient Redis errors
      next();
    }
  };
};
