import { logger } from "@/lib/logger"
import { waQueue } from "@/lib/queue"
import { db } from "@/lib/db"

import { TemplateData } from "./notification.service"

export type WaQueueResultDTO = {
  success: boolean
  logId?: string
  error?: string
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

    // 2. Masukkan ke BullMQ
    await waQueue.add(
      'send-wa',
      { tenantId: tenantId || null, number: phone, message, waQueueLogId: log.id, templateData },
      { jobId: log.id }
    );

    logger.info(`Message to ${phone} queued to BullMQ with log ID: ${log.id}`);
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
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000)

  const pendingMessages = await db.waQueueLog.findMany({
    where: {
      status: "PENDING",
      createdAt: { lt: oneMinuteAgo }
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
