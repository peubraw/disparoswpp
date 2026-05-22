import Redis from "ioredis";

declare global {
  var redis: Redis | undefined;
}

function createRedisClient() {
  return new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: null,
    lazyConnect: true,
  });
}

export const redis =
  global.redis ??
  createRedisClient();

if (process.env.NODE_ENV !== "production") {
  global.redis = redis;
}
