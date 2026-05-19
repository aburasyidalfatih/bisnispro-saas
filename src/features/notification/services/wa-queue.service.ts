import { logger } from "@/lib/logger"
import { waQueue } from "@/lib/queue"
import { db } from "@/lib/db"

export type WaQueueResultDTO = {
  success: boolean
  logId?: string
  error?: string
}

/**
 * Memasukkan pesan WA ke database sebagai PENDING, lalu mendorongnya ke BullMQ.
 * Worker terpisah (src/worker.ts) akan mengeksekusi pesan ini secara background.
 */
export const enqueueWhatsApp = async (phone: string, message: string, tenantId?: string | null): Promise<WaQueueResultDTO> => {
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
      { tenantId: tenantId || null, number: phone, message, waQueueLogId: log.id },
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
