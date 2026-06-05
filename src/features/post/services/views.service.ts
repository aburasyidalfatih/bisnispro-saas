import { getRedis } from "@/lib/redis"
import { db } from "@/lib/db"

const VIEWS_PREFIX = "post:views:"
const EVENT_VIEWS_PREFIX = "event:views:"

// ============================================================
// Redis Functions
// ============================================================

export async function incrementPostView(postId: string, ip: string = "unknown"): Promise<number> {
  const redis = getRedis()
  if (!redis) return 0
  
  try {
    if (ip !== "unknown") {
      const dedupKey = `rate:view_post:${postId}:${ip}`
      const isSpam = await redis.setnx(dedupKey, "1")
      if (isSpam === 0) return await getPostViews(postId)
      await redis.expire(dedupKey, 86400)
    }

    const key = `${VIEWS_PREFIX}${postId}`
    const views = await redis.incr(key)
    return views
  } catch (error) {
    console.error(`Failed to increment views for post ${postId}`, error)
    return 0
  }
}

export async function getPostViews(postId: string): Promise<number> {
  const redis = getRedis()
  if (!redis) return 0
  
  try {
    const key = `${VIEWS_PREFIX}${postId}`
    const views = await redis.get(key)
    return views ? parseInt(views, 10) : 0
  } catch (error) {
    return 0
  }
}

export async function incrementEventView(eventId: string, ip: string = "unknown"): Promise<number> {
  const redis = getRedis()
  if (!redis) return 0
  
  try {
    if (ip !== "unknown") {
      const dedupKey = `rate:view_event:${eventId}:${ip}`
      const isSpam = await redis.setnx(dedupKey, "1")
      if (isSpam === 0) return await getEventViews(eventId)
      await redis.expire(dedupKey, 86400)
    }

    const key = `${EVENT_VIEWS_PREFIX}${eventId}`
    const views = await redis.incr(key)
    return views
  } catch (error) {
    console.error(`Failed to increment views for event ${eventId}`, error)
    return 0
  }
}

export async function getEventViews(eventId: string): Promise<number> {
  const redis = getRedis()
  if (!redis) return 0
  
  try {
    const key = `${EVENT_VIEWS_PREFIX}${eventId}`
    const views = await redis.get(key)
    return views ? parseInt(views, 10) : 0
  } catch (error) {
    return 0
  }
}

// ============================================================
// Sync Functions (For CRON)
// ============================================================

export async function syncPostViewsToDatabase() {
  const redis = getRedis()
  if (!redis) return 0
  
  try {
    // Cari semua key yang berawalan post:views:
    const keys = await redis.keys(`${VIEWS_PREFIX}*`)
    if (keys.length === 0) return 0
    
    let synced = 0
    for (const key of keys) {
      const postId = key.replace(VIEWS_PREFIX, "")
      const views = await redis.get(key)
      
      if (views && parseInt(views, 10) > 0) {
        // Tambahkan ke postgres
        await db.post.update({
          where: { id: postId },
          data: { viewCount: { increment: parseInt(views, 10) } }
        }).catch(() => {})
        
        // Reset di redis (kita gunakan GETDEL atau hapus)
        await redis.del(key)
        synced++
      }
    }
    
    return synced
  } catch (error) {
    console.error("Failed to sync post views", error)
    return 0
  }
}

export async function syncEventViewsToDatabase() {
  const redis = getRedis()
  if (!redis) return 0
  
  try {
    const keys = await redis.keys(`${EVENT_VIEWS_PREFIX}*`)
    if (keys.length === 0) return 0
    
    let synced = 0
    for (const key of keys) {
      const eventId = key.replace(EVENT_VIEWS_PREFIX, "")
      const views = await redis.get(key)
      
      if (views && parseInt(views, 10) > 0) {
        await db.event.update({
          where: { id: eventId },
          data: { viewCount: { increment: parseInt(views, 10) } }
        }).catch(() => {})
        
        await redis.del(key)
        synced++
      }
    }
    
    return synced
  } catch (error) {
    console.error("Failed to sync event views", error)
    return 0
  }
}
