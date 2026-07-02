import { logger } from "@/lib/logger"
import { waQueue } from "@/lib/queue"
import { db } from "@/lib/db"
import { getRedisClient, getRedis } from "@/lib/redis"

import { TemplateData } from "./notification.service"

export type WaQueueResultDTO = {
  success: boolean
  logId?: string
  error?: string
}

/**
 * Mendapatkan delay antrean WhatsApp yang aman dan berurutan untuk single message.
 */
export async function getWaQueueDelay(tenantId: string | null | undefined): Promise<number> {
  const { getWaConfig } = await import("./notification.service")
  const config = await getWaConfig(tenantId || undefined)
  const safeMin = config.delayMin && config.delayMin > 0 ? config.delayMin : 1
  const safeMax = config.delayMax && config.delayMax > 0 ? config.delayMax : 3
  
  const minMs = safeMin * 60 * 1000
  const maxMs = Math.max(minMs, safeMax * 60 * 1000)
  const randomDelay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs

  const scheduleKey = `wa:next_send_time:${(tenantId && config.isCustom) ? tenantId : 'platform'}`
  const rawRedis = getRedis()
  const now = Date.now()

  if (rawRedis) {
    const luaScript = `
      local current = redis.call('get', KEYS[1])
      local now = tonumber(ARGV[1])
      local delay = tonumber(ARGV[2])
      local nextSend = now + delay
      if current then
        local currentVal = tonumber(current)
        if currentVal > now then
          nextSend = currentVal + delay
        end
      end
      redis.call('set', KEYS[1], tostring(nextSend), 'EX', 86400)
      return tostring(nextSend)
    `
    try {
      const nextSendAt = await rawRedis.eval(luaScript, 1, scheduleKey, now.toString(), randomDelay.toString())
      const delay = parseInt(nextSendAt as string, 10) - now
      return Math.max(0, delay)
    } catch (err) {
      logger.error("Failed to calculate WA delay via Lua script, falling back", err)
    }
  }

  // Fallback
  const redis = await getRedisClient()
  const val = await redis.get(scheduleKey)
  let nextSend = now + randomDelay
  if (val) {
    const storedVal = parseInt(val, 10)
    if (storedVal > now) {
      nextSend = storedVal + randomDelay
    }
  }
  await redis.set(scheduleKey, nextSend.toString(), 86400)
  const delay = nextSend - now
  return Math.max(0, delay)
}

/**
 * Mendapatkan kumpulan delay antrean WhatsApp berurutan untuk bulk messaging (broadcast).
 */
export async function getWaQueueDelays(tenantId: string | null | undefined, count: number): Promise<number[]> {
  const { getWaConfig } = await import("./notification.service")
  const config = await getWaConfig(tenantId || undefined)
  const safeMin = config.delayMin && config.delayMin > 0 ? config.delayMin : 1
  const safeMax = config.delayMax && config.delayMax > 0 ? config.delayMax : 3
  
  const minMs = safeMin * 60 * 1000
  const maxMs = Math.max(minMs, safeMax * 60 * 1000)

  const scheduleKey = `wa:next_send_time:${(tenantId && config.isCustom) ? tenantId : 'platform'}`
  const rawRedis = getRedis()
  const now = Date.now()

  if (rawRedis) {
    const luaScript = `
      local current = redis.call('get', KEYS[1])
      local now = tonumber(ARGV[1])
      local count = tonumber(ARGV[2])
      local minMs = tonumber(ARGV[3])
      local maxMs = tonumber(ARGV[4])
      local seed = tonumber(ARGV[5])
      
      local nextSend = now
      if current then
        local currentVal = tonumber(current)
        if currentVal > now then
          nextSend = currentVal
        end
      end
      
      local function random_in_range(min, max, s)
        local next_seed = (s * 1103515245 + 12345) % 2147483648
        local val = min + (next_seed % (max - min + 1))
        return val, next_seed
      end
      
      local seed_val = seed
      local delays = {}
      for i = 1, count do
        local delay_val
        delay_val, seed_val = random_in_range(minMs, maxMs, seed_val)
        nextSend = nextSend + delay_val
        table.insert(delays, tostring(nextSend))
      end
      
      redis.call('set', KEYS[1], tostring(nextSend), 'EX', 86400)
      return delays
    `
    try {
      const seed = Math.floor(Math.random() * 1000000)
      const nextSendTimes = await rawRedis.eval(
        luaScript, 
        1, 
        scheduleKey, 
        now.toString(), 
        count.toString(), 
        minMs.toString(), 
        maxMs.toString(), 
        seed.toString()
      ) as string[]
      
      return nextSendTimes.map(timeStr => Math.max(0, parseInt(timeStr, 10) - now))
    } catch (err) {
      logger.error("Failed to calculate bulk WA delays via Lua script, falling back", err)
    }
  }

  // Fallback
  const redis = await getRedisClient()
  const val = await redis.get(scheduleKey)
  let nextSend = now
  if (val) {
    const storedVal = parseInt(val, 10)
    if (storedVal > now) {
      nextSend = storedVal
    }
  }

  const delays: number[] = []
  for (let i = 0; i < count; i++) {
    const randomDelay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs
    nextSend += randomDelay
    delays.push(Math.max(0, nextSend - now))
  }
  
  await redis.set(scheduleKey, nextSend.toString(), 86400)
  return delays
}

/**
 * Memasukkan pesan WA ke database sebagai PENDING, lalu mendorongnya ke BullMQ.
 * Worker terpisah (src/worker.ts) akan mengeksekusi pesan ini secara background.
 */
export const enqueueWhatsApp = async (phone: string, message: string, tenantId?: string | null, templateData?: TemplateData): Promise<WaQueueResultDTO> => {
  try {
    // 1. Tulis ke DB sebagai PENDING
    const log = await db.waQueueLog.create({
      data: {
        targetNumber: phone,
        message,
        tenantId,
        status: "PENDING"
      }
    });

    // 2. Hitung delay antrean (sequential queue delay)
    const delay = await getWaQueueDelay(tenantId);

    // 3. Masukkan ke BullMQ dengan opsi delay
    await waQueue.add(
      'send-wa',
      { tenantId: tenantId || null, number: phone, message, waQueueLogId: log.id, templateData },
      { jobId: log.id, delay }
    );

    logger.info(`Message to ${phone} queued to BullMQ with log ID: ${log.id} and delay: ${delay}ms`);
    return { success: true, logId: log.id };
  } catch (error: any) {
    logger.error("Failed to enqueue WA message to BullMQ", error);
    return { success: false, error: error.message };
  }
};

// Legacy stub
export function startWaWorker() {
  logger.info("WA Worker: Direct processing mode (no Inngest dependency). Skipping startWaWorker.");
  return null;
}

export async function processWaQueueCron() {
  // Pesan WA bisa tertunda lama jika antreannya panjang (delay broadcast bisa berjam-jam).
  // Jangan tandai PENDING sebagai FAILED terlalu cepat. Tunggu 6 jam.
  const timeoutDate = new Date(Date.now() - 6 * 60 * 60 * 1000)

  const pendingMessages = await db.waQueueLog.findMany({
    where: {
      status: "PENDING",
      createdAt: { lt: timeoutDate }
    },
    orderBy: { createdAt: "asc" },
    take: 10,
  })

  if (pendingMessages.length === 0) {
    return { processed: 0, message: "No stuck messages" }
  }

  logger.info(`WA Queue Cron: Processing ${pendingMessages.length} stuck messages`)

  let failedCount = 0

  for (const msg of pendingMessages) {
    try {
      await db.waQueueLog.update({
        where: { id: msg.id },
        data: {
          status: "FAILED",
          error: "Mesin pengirim terputus di tengah proses (server restart/mati). Silakan klik tombol Kirim Ulang."
        }
      })
      failedCount++
    } catch (err: any) {
      logger.error(`WA Cron: Failed to update log status to FAILED ${msg.id}`, err)
    }
  }

  logger.info(`WA Queue Cron: Done. Marked as FAILED=${failedCount}`)

  // Cleanup logs older than 3 days
  const threeDaysAgo = new Date()
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
  const cleanupRes = await db.waQueueLog.deleteMany({
    where: { createdAt: { lt: threeDaysAgo } }
  })
  
  return { processed: pendingMessages.length, failedCount, cleanedUp: cleanupRes.count }
}
