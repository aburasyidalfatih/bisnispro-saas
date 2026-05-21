import { getRedis } from "./index"

/**
 * Basic Sliding Window / Fixed Window Rate Limiter using Redis.
 * @param ip IP address of the user
 * @param action Name of the action (e.g. "login")
 * @param limit Maximum allowed requests
 * @param windowInSeconds Time window in seconds
 * @returns { success: boolean, remaining: number }
 */
export async function rateLimit(ip: string, action: string, limit: number, windowInSeconds: number) {
  const redis = getRedis()
  if (!redis) {
    // If Redis is down, fail-open (allow the request)
    return { success: true, remaining: limit }
  }

  const key = `ratelimit:${action}:${ip}`
  
  try {
    const current = await redis.incr(key)
    
    // Set expiry only on the first request
    if (current === 1) {
      await redis.expire(key, windowInSeconds)
    }

    const success = current <= limit
    return {
      success,
      remaining: Math.max(0, limit - current)
    }
  } catch (error) {
    console.error("[RATE_LIMIT]", error)
    return { success: true, remaining: limit }
  }
}
