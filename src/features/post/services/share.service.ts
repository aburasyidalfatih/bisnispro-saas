import { getRedis } from "@/lib/redis"
import { db } from "@/lib/db"

const SHARE_PREFIX = "post:shares:"
const SHARE_DETAIL_PREFIX = "post:shares:detail:"

// ============================================================
// Poin per platform
// ============================================================
const SHARE_POINTS: Record<string, number> = {
  whatsapp: 5,
  facebook: 5,
  twitter: 5,
  copy: 2,
}

// ============================================================
// Track share ke Redis (INCR total + ZINCRBY leaderboard)
// ============================================================
export async function trackShare(postId: string, tenantId: string, platform: string, ip: string = "unknown"): Promise<{ success: boolean, totalShares: number }> {
  const redis = getRedis()
  const points = SHARE_POINTS[platform] || 2

  try {
    let totalShares = 0

    if (redis) {
      if (ip !== "unknown") {
        const dedupKey = `rate:share:${postId}:${ip}`
        const isSpam = await redis.setnx(dedupKey, "1")
        if (isSpam === 0) {
          const count = await redis.get(`${SHARE_PREFIX}${postId}`)
          return { success: false, totalShares: count ? parseInt(count, 10) : 0 }
        }
        await redis.expire(dedupKey, 86400)

        const tenantKey = `rate:share_tenant:${tenantId}`
        const currentPoints = await redis.incrby(tenantKey, points)
        if (currentPoints === points) await redis.expire(tenantKey, 86400)
        
        if (currentPoints > 100) {
           totalShares = await redis.incr(`${SHARE_PREFIX}${postId}`)
           await redis.hincrby(`${SHARE_DETAIL_PREFIX}${postId}`, platform, 1)
           return { success: true, totalShares }
        }
      }

      // 1. Increment total share count
      totalShares = await redis.incr(`${SHARE_PREFIX}${postId}`)

      // 2. Increment per-platform detail (untuk analytics)
      await redis.hincrby(`${SHARE_DETAIL_PREFIX}${postId}`, platform, 1)

      // 3. Langsung tambah poin ke leaderboard Redis ZSET
      await redis.zincrby("leaderboard:global", points, tenantId)

      // 4. Tambah poin ke trafficScore di DB (async, non-blocking)
      db.tenantScore.upsert({
        where: { tenantId },
        update: { trafficScore: { increment: points }, totalScore: { increment: points } },
        create: { tenantId, contentScore: 0, trafficScore: points, activityScore: 0, totalScore: points, rank: 0 },
      }).catch(err => console.error("[SHARE] Failed to update tenantScore", err))
    }

    return { success: true, totalShares }
  } catch (error) {
    console.error(`[SHARE] Failed to track share for post ${postId}`, error)
    return { success: false, totalShares: 0 }
  }
}

// ============================================================
// Get share count dari Redis
// ============================================================
export async function getShareCount(postId: string): Promise<number> {
  const redis = getRedis()
  if (!redis) return 0

  try {
    const count = await redis.get(`${SHARE_PREFIX}${postId}`)
    return count ? parseInt(count, 10) : 0
  } catch {
    return 0
  }
}

// ============================================================
// Sync share counts ke PostgreSQL (CRON)
// ============================================================
export async function syncShareCountsToDatabase(): Promise<number> {
  const redis = getRedis()
  if (!redis) return 0

  try {
    const keys = await redis.keys(`${SHARE_PREFIX}*`)
    // Filter out detail keys (hash maps)
    const countKeys = keys.filter((k: string) => !k.includes(":detail:"))
    if (countKeys.length === 0) return 0

    let synced = 0
    for (const key of countKeys) {
      const postId = key.replace(SHARE_PREFIX, "")
      const shares = await redis.get(key)

      if (shares && parseInt(shares, 10) > 0) {
        await db.post.update({
          where: { id: postId },
          data: { shareCount: { increment: parseInt(shares, 10) } },
        }).catch(() => {})

        await redis.del(key)
        synced++
      }
    }

    return synced
  } catch (error) {
    console.error("[SHARE] Failed to sync share counts", error)
    return 0
  }
}
