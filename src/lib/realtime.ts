import { Redis } from "ioredis"
import { logger } from "@/lib/logger"

// Kita membuat instance publisher dan subscriber terpisah
// karena di Redis, koneksi yang sedang dalam mode "subscribe"
// tidak bisa digunakan untuk mem-publish atau mengirim perintah lain.

let publisher: Redis | null = null
let subscriber: Redis | null = null

function getRedisUrl() {
  return process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL?.replace("https://", "rediss://") || null
}

export function getPublisher(): Redis | null {
  if (publisher) return publisher

  const url = getRedisUrl()
  if (!url) return null

  try {
    publisher = new Redis(url, {
      maxRetriesPerRequest: 3,
      lazyConnect: false,
      enableOfflineQueue: true,
    })
    return publisher
  } catch (error) {
    logger.warn("Failed to initialize Redis Publisher for Real-time", { error })
    return null
  }
}

export function getSubscriber(): Redis | null {
  if (subscriber) return subscriber

  const url = getRedisUrl()
  if (!url) return null

  try {
    subscriber = new Redis(url, {
      maxRetriesPerRequest: 3,
      lazyConnect: false,
      enableOfflineQueue: true,
    })
    return subscriber
  } catch (error) {
    logger.warn("Failed to initialize Redis Subscriber for Real-time", { error })
    return null
  }
}

/**
 * Publish pesan ke channel tertentu.
 * Contoh: publishEvent("user-notif:123", { type: "POINTS", points: 20 })
 */
export async function publishEvent(channel: string, payload: any) {
  const pub = getPublisher()
  if (!pub) return

  try {
    await pub.publish(channel, JSON.stringify(payload))
  } catch (error) {
    logger.error(`Failed to publish event to channel ${channel}`, error)
  }
}
