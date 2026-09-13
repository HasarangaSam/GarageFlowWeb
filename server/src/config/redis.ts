import { Redis } from "@upstash/redis";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

export const isRedisConfigured = Boolean(redisUrl && redisToken);

if (!isRedisConfigured) {
  console.warn(
    "⚠️ Warning: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is missing. Redis cache, blacklist, and distributed rate limiting will run in fallback mode.",
  );
}

export const redis = new Redis({
  url: redisUrl || "https://placeholder.upstash.io",
  token: redisToken || "placeholder",
});
