import { redis, isRedisConfigured } from "../config/redis.js";

const BLACKLIST_PREFIX = "blacklist:token:";

/**
 * Stores a revoked JWT access token in Upstash Redis with a TTL
 * equal to the token's remaining valid duration. Once expired,
 * Redis automatically purges the key, preventing unbounded memory growth.
 */
export const blacklistToken = async (
  token: string,
  ttlSeconds: number,
): Promise<void> => {
  if (!isRedisConfigured || ttlSeconds <= 0) {
    return;
  }

  try {
    await redis.set(`${BLACKLIST_PREFIX}${token}`, "revoked", {
      ex: ttlSeconds,
    });
  } catch (error) {
    console.error("Failed to blacklist token in Upstash Redis:", error);
  }
};

/**
 * Checks if an access token has been revoked / blacklisted.
 * Fails open (returns false) if Redis is temporarily unreachable
 * to maintain service availability.
 */
export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  if (!isRedisConfigured) {
    return false;
  }

  try {
    const status = await redis.get(`${BLACKLIST_PREFIX}${token}`);
    return Boolean(status);
  } catch (error) {
    console.error("Failed to check token blacklist in Upstash Redis:", error);
    return false;
  }
};
