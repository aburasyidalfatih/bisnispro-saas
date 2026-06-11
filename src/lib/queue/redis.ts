import { Redis, RedisOptions } from "ioredis"

const isBuildPhase = process.env.npm_lifecycle_event === "build" || process.env.NEXT_PHASE?.includes("build")

const baseOptions: RedisOptions = process.env.REDIS_URL
  ? { maxRetriesPerRequest: null }
  : {
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD || undefined,
    }

const redisOptions: RedisOptions = {
  ...baseOptions,
  maxRetriesPerRequest: isBuildPhase ? 1 : baseOptions.maxRetriesPerRequest ?? null,
  retryStrategy: isBuildPhase ? () => null : undefined,
  lazyConnect: isBuildPhase ? true : undefined,
}

// Keep a singleton connection to avoid exhausting Redis connections in Next.js development mode
const globalForRedis = global as unknown as { redisConnection: Redis }

export const redisConnection =
  globalForRedis.redisConnection ||
  (process.env.REDIS_URL ? new Redis(process.env.REDIS_URL, redisOptions) : new Redis(redisOptions))

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redisConnection = redisConnection
}
