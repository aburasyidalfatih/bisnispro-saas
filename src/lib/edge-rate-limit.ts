import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

/**
 * Enterprise Edge Rate Limiter (Fase 1 & Fase 3)
 * Berjalan di Edge Runtime (Vercel/Cloudflare) via HTTP REST.
 * Sangat efisien untuk memblokir DDOS sebelum menyentuh Node Server.
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

// Global API Rate Limiter (200 request / 10 detik per IP)
export const edgeRateLimit = isUpstashConfigured
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(200, "10 s"),
      analytics: true,
      prefix: "@upstash/edge-ratelimit",
    })
  : new InMemoryRateLimit(200, 10000)

// Aggressive Rate Limiter for Authentication (Brute Force Protection)
export const authRateLimit = isUpstashConfigured
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, "10 s"), // Max 5 requests per 10 seconds per IP
      analytics: true,
      prefix: "@upstash/auth-ratelimit",
    })
  : new InMemoryRateLimit(5, 10000)

// Per-Tenant Rate Limiter (1000 request / 60 detik per Tenant - Task 3.4)
export const tenantRateLimit = isUpstashConfigured
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(1000, "60 s"),
      analytics: true,
      prefix: "@upstash/tenant-ratelimit",
    })
  : new InMemoryRateLimit(1000, 60000)

