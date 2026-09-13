import { redis, isRedisConfigured } from "../config/redis.js";

const DASHBOARD_CACHE_KEY = "dashboard:summary";
const DASHBOARD_CACHE_TTL = 60; // 60 seconds TTL

export const getDashboardCache = async <T = unknown>(): Promise<T | null> => {
  if (!isRedisConfigured) {
    return null;
  }

  try {
    const cached = await redis.get<T>(DASHBOARD_CACHE_KEY);

    if (!cached) {
      return null;
    }

    if (typeof cached === "string") {
      try {
        return JSON.parse(cached) as T;
      } catch {
        return cached as unknown as T;
      }
    }

    return cached;
  } catch (error) {
    console.error("Failed to read dashboard cache from Upstash Redis:", error);
    return null;
  }
};

export const setDashboardCache = async (dashboard: unknown): Promise<void> => {
  if (!isRedisConfigured) {
    return;
  }

  try {
    await redis.set(DASHBOARD_CACHE_KEY, dashboard, {
      ex: DASHBOARD_CACHE_TTL,
    });
  } catch (error) {
    console.error("Failed to write dashboard cache to Upstash Redis:", error);
  }
};

export const invalidateDashboardCache = async (): Promise<void> => {
  if (!isRedisConfigured) {
    return;
  }

  try {
    await redis.del(DASHBOARD_CACHE_KEY);
  } catch (error) {
    console.error("Failed to invalidate dashboard cache in Upstash Redis:", error);
  }
};
