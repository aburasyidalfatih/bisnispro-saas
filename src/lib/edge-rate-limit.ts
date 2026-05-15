import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

/**
 * Enterprise Edge Rate Limiter (Fase 1)
 * Berjalan di Edge Runtime (Vercel/Cloudflare) via HTTP REST.
 * Sangat efisien untuk memblokir DDOS sebelum menyentuh Node Server.
 */

// Bypass jika env vars belum diset (misal di local dev)
const isUpstashConfigured = 
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN

// Fallback Mock jika tidak ada Upstash
const mockRatelimit = {
  limit: async () => ({ success: true, pending: Promise.resolve(), limit: 10, remaining: 9, reset: Date.now() + 10000 })
}

// Global API Rate Limiter (200 request / 10 detik per IP)
export const edgeRateLimit = isUpstashConfigured
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(200, "10 s"),
      analytics: true,
      prefix: "@upstash/edge-ratelimit",
    })
  : mockRatelimit

// Aggressive Rate Limiter for Authentication (Brute Force Protection)
export const authRateLimit = isUpstashConfigured
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, "10 s"), // Max 5 requests per 10 seconds per IP
      analytics: true,
      prefix: "@upstash/auth-ratelimit",
    })
  : mockRatelimit
