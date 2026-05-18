import { Redis, RedisOptions } from "ioredis"

const redisOptions: RedisOptions = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
}

// Keep a singleton connection to avoid exhausting Redis connections in Next.js development mode
const globalForRedis = global as unknown as { redisConnection: Redis }

export const redisConnection =
  globalForRedis.redisConnection || new Redis(redisOptions)

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redisConnection = redisConnection
}
