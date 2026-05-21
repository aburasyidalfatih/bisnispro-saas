import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

/**
 * Enterprise Edge Rate Limiter (Fase 1 & Fase 3)
 * Priority: Upstash REST → Local Redis → In-Memory
 */

// Bypass jika env vars belum diset (misal di local dev)
const isUpstashConfigured = 
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN

// Safe In-Memory Sliding Window Fallback (Task 3.7)
class InMemoryRateLimit {
  private windowMs: number
  private max: number
  private records: Map<string, number[]> = new Map()

  constructor(max: number, windowMs: number) {
    this.max = max
    this.windowMs = windowMs
  }

  async limit(key: string) {
    const now = Date.now()
    const timestamps = this.records.get(key) || []
    
    // Filter timestamps yang sudah kadaluarsa
    const activeTimestamps = timestamps.filter(t => now - t < this.windowMs)
    
    if (activeTimestamps.length >= this.max) {
      return {
        success: false,
        pending: Promise.resolve(),
        limit: this.max,
        remaining: 0,
        reset: now + this.windowMs
      }
    }
    
    activeTimestamps.push(now)
    this.records.set(key, activeTimestamps)
    
    return {
      success: true,
      pending: Promise.resolve(),
      limit: this.max,
      remaining: this.max - activeTimestamps.length,
      reset: now + this.windowMs
    }
  }
}

/**
 * Redis-backed Rate Limiter for VPS (local Redis, shared across containers).
 * Uses simple INCR + EXPIRE (fixed window) — efficient and reliable.
 */
class RedisLocalRateLimit {
  private max: number
  private windowSec: number
  private prefix: string

  constructor(max: number, windowSec: number, prefix: string) {
    this.max = max
    this.windowSec = windowSec
    this.prefix = prefix
  }

  async limit(key: string) {
    try {
      const { getRedis } = await import("@/lib/redis")
      const redis = getRedis()
      if (!redis) throw new Error("Redis not available")

      const redisKey = `${this.prefix}:${key}`
      const current = await redis.incr(redisKey)
      if (current === 1) {
        await redis.expire(redisKey, this.windowSec)
      }

      return {
        success: current <= this.max,
        pending: Promise.resolve(),
        limit: this.max,
        remaining: Math.max(0, this.max - current),
        reset: Date.now() + this.windowSec * 1000
      }
    } catch {
      // Fallback to allow if Redis errors
      return { success: true, pending: Promise.resolve(), limit: this.max, remaining: this.max, reset: Date.now() }
    }
  }
}

// Check if local Redis is configured
const isLocalRedisConfigured = !!(process.env.REDIS_URL || process.env.REDIS_HOST)

function createLimiter(upstashMax: number, upstashWindow: string, localMax: number, localWindowSec: number, prefix: string, inMemoryMax: number, inMemoryMs: number) {
  if (isUpstashConfigured) {
    return new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(upstashMax, upstashWindow),
      analytics: true,
      prefix,
    })
  }
  if (isLocalRedisConfigured) {
    return new RedisLocalRateLimit(localMax, localWindowSec, prefix)
  }
  return new InMemoryRateLimit(inMemoryMax, inMemoryMs)
}

// Global API Rate Limiter (200 request / 10 detik per IP)
export const edgeRateLimit = createLimiter(200, "10 s", 200, 10, "rl:edge", 200, 10000)

// Aggressive Rate Limiter for Authentication (Brute Force Protection)
// Max 5 login attempts per 60 seconds per IP (lebih ketat dari sebelumnya)
export const authRateLimit = createLimiter(5, "60 s", 5, 60, "rl:auth", 5, 60000)

// Per-Tenant Rate Limiter (1000 request / 60 detik per Tenant)
export const tenantRateLimit = createLimiter(1000, "60 s", 1000, 60, "rl:tenant", 1000, 60000)

