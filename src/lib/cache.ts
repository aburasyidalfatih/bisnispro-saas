import { getRedisClient } from "./redis"
import { logger } from "./logger"

const CACHE_PREFIX = "sp:cache:"

/**
 * Unified Cache Layer — Enterprise Caching System
 * 
 * Automatically wraps values with prefix, handles JSON serialization/deserialization,
 * and handles failures gracefully by falling back to null/noop.
 */

/**
 * Get value from cache with type safety
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const redis = await getRedisClient()
    const raw = await redis.get(CACHE_PREFIX + key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch (error) {
    logger.warn("Cache read failed", { key, error: String(error) })
    return null
  }
}

/**
 * Set value in cache with TTL (Default: 1 hour / 3600 seconds)
 */
export async function cacheSet<T>(key: string, value: T, ttlSeconds = 3600): Promise<void> {
  try {
    const redis = await getRedisClient()
    const serialized = JSON.stringify(value)
    await redis.set(CACHE_PREFIX + key, serialized, ttlSeconds)
  } catch (error) {
    logger.warn("Cache write failed", { key, error: String(error) })
  }
}

/**
 * Invalidate a specific cache key
 */
export async function cacheInvalidate(key: string): Promise<void> {
  try {
    const redis = await getRedisClient()
    await redis.del(CACHE_PREFIX + key)
  } catch (error) {
    logger.warn("Cache invalidation failed", { key, error: String(error) })
  }
}

/**
 * Convention helper to generate consistent cache keys
 */
export const cacheKeys = {
  /** Public website configuration & metadata */
  tenantSite: (slug: string) => `tenant:site:${slug}`,
  /** Public blog/news list for a tenant */
  postList: (tenantId: string, page = 1) => `posts:${tenantId}:p${page}`,
  /** Specific news article */
  postDetail: (slug: string, postId: string) => `post:${slug}:${postId}`,
  /** Event/activity announcements for a school */
  eventList: (tenantId: string) => `events:${tenantId}`,
  /** Publicly displayed school staff/teachers */
  staffList: (tenantId: string) => `staff:${tenantId}`,
  /** Gallery items */
  galleryList: (tenantId: string) => `gallery:${tenantId}`,
  /** Dashboard statistics (cached briefly) */
  dashboardStats: (tenantId: string) => `dbstats:${tenantId}`,
}
