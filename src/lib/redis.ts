/**
 * Redis abstraction layer — support 3 mode otomatis:
 *
 * 1. Upstash Redis (cloud)  → set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 * 2. Redis lokal/VPS        → set REDIS_URL (contoh: redis://localhost:6379)
 * 3. In-memory fallback     → tidak perlu env apapun (development)
 *
 * Prioritas: Upstash → Redis lokal → In-memory
 *
 * Semua consumer (rate-limit, domain cache) cukup import dari sini.
 */

import { logger } from "@/lib/logger"

// ==================== INTERFACE ====================

export interface RedisClient {
  get(key: string): Promise<string | null>
  set(key: string, value: string, exSeconds?: number): Promise<void>
  del(key: string): Promise<void>
  /** Increment counter, return new value */
  incr(key: string): Promise<number>
  /** Set expiry on existing key */
  expire(key: string, seconds: number): Promise<void>
  /** Get TTL in seconds (-1 = no expiry, -2 = not exists) */
  ttl(key: string): Promise<number>
  /** Clear all keys in current database */
  flush(): Promise<void>
}

// ==================== UPSTASH ADAPTER ====================

async function createUpstashClient(): Promise<RedisClient | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null

  try {
    const { Redis } = await import("@upstash/redis")
    const client = new Redis({ url, token })

    return {
      async get(key) {
        const val = await client.get<string>(key)
        return val ?? null
      },
      async set(key, value, exSeconds) {
        if (exSeconds) await client.set(key, value, { ex: exSeconds })
        else await client.set(key, value)
      },
      async del(key) { await client.del(key) },
      async incr(key) { return client.incr(key) },
      async expire(key, seconds) { await client.expire(key, seconds) },
      async ttl(key) { return client.ttl(key) },
      async flush() { await client.flushdb() },
    }
  } catch (err) {
    logger.warn("Upstash Redis init failed, falling back", { error: String(err) })
    return null
  }
}

// ==================== IOREDIS ADAPTER (Redis lokal/VPS) ====================

async function createIoRedisClient(): Promise<RedisClient | null> {
  const url = process.env.REDIS_URL
  if (!url) return null

  try {
    const { Redis } = await import("ioredis")
    const client = new Redis(url, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      enableOfflineQueue: false,
    })

    // Test koneksi
    await client.connect()
    await client.ping()

    logger.info("Connected to local Redis", { url: url.replace(/:\/\/.*@/, "://***@") })

    return {
      async get(key) { return client.get(key) },
      async set(key, value, exSeconds) {
        if (exSeconds) await client.set(key, value, "EX", exSeconds)
        else await client.set(key, value)
      },
      async del(key) { await client.del(key) },
      async incr(key) { return client.incr(key) },
      async expire(key, seconds) { await client.expire(key, seconds) },
      async ttl(key) { return client.ttl(key) },
      async flush() { await client.flushdb() },
    }
  } catch (err) {
    logger.warn("Local Redis connection failed, falling back to in-memory", { error: String(err) })
    return null
  }
}

// ==================== IN-MEMORY ADAPTER (fallback) ====================

interface MemEntry {
  value: string
  expiresAt: number | null // null = no expiry
}

const memStore = new Map<string, MemEntry>()
const MAX_MEM_SIZE = 10000

// Cleanup expired entries setiap 60 detik
if (typeof setInterval !== "undefined") {
  const timer = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of memStore) {
      if (entry.expiresAt !== null && now > entry.expiresAt) memStore.delete(key)
    }
    if (memStore.size > MAX_MEM_SIZE) memStore.clear()
  }, 60_000)
  if (typeof timer === "object" && "unref" in timer) (timer as any).unref()
}

const inMemoryClient: RedisClient = {
  async get(key) {
    const entry = memStore.get(key)
    if (!entry) return null
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      memStore.delete(key)
      return null
    }
    return entry.value
  },
  async set(key, value, exSeconds) {
    memStore.set(key, {
      value,
      expiresAt: exSeconds ? Date.now() + exSeconds * 1000 : null,
    })
  },
  async del(key) { memStore.delete(key) },
  async incr(key) {
    const entry = memStore.get(key)
    const current = entry ? parseInt(entry.value, 10) || 0 : 0
    const next = current + 1
    memStore.set(key, { value: String(next), expiresAt: entry?.expiresAt ?? null })
    return next
  },
  async expire(key, seconds) {
    const entry = memStore.get(key)
    if (entry) memStore.set(key, { ...entry, expiresAt: Date.now() + seconds * 1000 })
  },
  async ttl(key) {
    const entry = memStore.get(key)
    if (!entry) return -2
    if (entry.expiresAt === null) return -1
    const remaining = Math.ceil((entry.expiresAt - Date.now()) / 1000)
    return remaining > 0 ? remaining : -2
  },
  async flush() { memStore.clear() },
}

// ==================== SINGLETON ====================

let _client: RedisClient | null = null
let _initialized = false

export async function getRedisClient(): Promise<RedisClient> {
  if (_initialized) return _client ?? inMemoryClient

  _initialized = true

  // 1. Coba Upstash
  const upstash = await createUpstashClient()
  if (upstash) { _client = upstash; return _client }

  // 2. Coba Redis lokal
  const local = await createIoRedisClient()
  if (local) { _client = local; return _client }

  // 3. Fallback in-memory
  logger.info("Redis not configured — using in-memory store (not suitable for multi-instance)")
  _client = inMemoryClient
  return _client
}

// ==================== IOREDIS DIRECT ACCESS (for ZSET, pipeline, etc.) ====================

import IORedis from "ioredis"

let _ioredis: IORedis | null = null
let _ioredisInit = false

/**
 * getRedis() — returns raw ioredis instance for advanced ops (ZSET, MGET, pipeline, etc.)
 * Returns null if REDIS_URL is not set (cloud/dev environments without local Redis).
 */
export function getRedis(): IORedis | null {
  if (_ioredisInit) return _ioredis

  _ioredisInit = true
  const url = process.env.REDIS_URL
  if (!url) return null

  try {
    _ioredis = new IORedis(url, {
      maxRetriesPerRequest: 3,
      lazyConnect: false,
      enableOfflineQueue: true,
    })

    _ioredis.on("error", (err) => {
      console.error("[Redis Direct] Connection error:", err.message)
    })

    return _ioredis
  } catch (err) {
    console.error("[Redis Direct] Failed to create ioredis instance:", err)
    return null
  }
}
