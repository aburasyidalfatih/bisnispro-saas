/**
 * Rate limiter — sliding window algorithm.
 *
 * Otomatis memilih backend:
 * 1. Upstash Redis  → set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 * 2. Redis lokal    → set REDIS_URL (redis://localhost:6379)
 * 3. In-memory      → fallback otomatis (tidak cocok untuk multi-instance)
 */

import { getRedisClient } from "@/lib/redis"
import { logger } from "@/lib/logger"

/**
 * Sliding window rate limiter.
 *
 * @param key      - Identifier unik (contoh: "api:127.0.0.1")
 * @param limit    - Maksimum request per window
 * @param windowMs - Durasi window dalam milidetik
 */
export async function rateLimit(
  key: string,
  limit: number = 10,
  windowMs: number = 60_000
): Promise<{ success: boolean; remaining: number }> {
  const redis = await getRedisClient()
  const windowSec = Math.ceil(windowMs / 1000)
  const redisKey = `smp:rl:${key}`

  try {
    const count = await redis.incr(redisKey)

    // Set expiry hanya pada increment pertama
    if (count === 1) {
      await redis.expire(redisKey, windowSec)
    }

    if (count > limit) {
      return { success: false, remaining: 0 }
    }

    return { success: true, remaining: limit - count }
  } catch (error) {
    logger.error("Rate limiter backend failed", error, { key })

    if (process.env.NODE_ENV === "production") {
      return { success: false, remaining: 0 }
    }

    return { success: true, remaining: limit }
  }
}
