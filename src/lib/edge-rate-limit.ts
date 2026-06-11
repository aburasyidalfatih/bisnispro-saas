import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis/cloudflare"

/**
 * Enterprise Edge Rate Limiter (Fase 1 & Fase 3)
 * Priority: Upstash REST -> In-Memory
 *
 * Middleware runs on the Edge runtime, so it must not import TCP Redis clients
 * such as ioredis. Node.js route handlers use src/lib/rate-limit.ts for local
 * Redis-backed limits.
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

function createLimiter(upstashMax: number, upstashWindow: string, prefix: string, inMemoryMax: number, inMemoryMs: number) {
  if (isUpstashConfigured) {
    return new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(upstashMax, upstashWindow as any),
      analytics: true,
      prefix,
    })
  }
  return new InMemoryRateLimit(inMemoryMax, inMemoryMs)
}

// Global API Rate Limiter (200 request / 10 detik per IP)
export const edgeRateLimit = createLimiter(200, "10 s", "rl:edge", 200, 10000)

// Aggressive Rate Limiter for Authentication (Brute Force Protection)
// Max 5 login attempts per 60 seconds per IP (lebih ketat dari sebelumnya)
export const authRateLimit = createLimiter(5, "60 s", "rl:auth", 5, 60000)

// Per-Tenant Rate Limiter (1000 request / 60 detik per Tenant)
export const tenantRateLimit = createLimiter(1000, "60 s", "rl:tenant", 1000, 60000)

