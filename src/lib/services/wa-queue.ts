import { logger } from '../logger';

/**
 * Memasukkan pesan WA ke database sebagai PENDING, lalu langsung memproses pengiriman.
 * Sebelumnya menggunakan Inngest queue, tapi karena Inngest tidak dikonfigurasi di Docker,
 * kita bypass langsung ke sendWhatsAppDirect().
 */
export const enqueueWhatsApp = async (phone: string, message: string, tenantId?: string | null) => {
  try {
    const { db } = await import('@/lib/db');
    
    // 1. Tulis ke DB sebagai PENDING
    const log = await db.waQueueLog.create({
      data: {
        targetNumber: phone,
        message,
        tenantId,
        status: "PENDING"
      }
    });

    // 2. Langsung kirim via sendWhatsAppDirect (bypass Inngest)
    //    Jalankan async tanpa blocking response
    processWaQueue(phone, message, tenantId || null, log.id).catch(err => {
      logger.error(`Background WA send failed for log ${log.id}`, err);
    });

    logger.info(`Message to ${phone} queued with log ID: ${log.id}`);
    return { success: true, logId: log.id };
  } catch (error: any) {
    logger.error("Failed to enqueue WA message", error);
    return { success: false, error: error.message };
  }
};

/**
 * Background processor — mengirim WA dan update status di database.
 * Menggantikan Inngest whatsappSendJob.
 */
async function processWaQueue(phone: string, message: string, tenantId: string | null, logId: string) {
  const { db } = await import('@/lib/db');
  const { sendWhatsAppDirect } = await import('@/lib/services/notification');

  try {
    const res = await sendWhatsAppDirect(phone, message, tenantId);

    if (!res.success) {
      await db.waQueueLog.update({
        where: { id: logId },
        data: { status: "FAILED", error: res.error || "Unknown error", sentAt: new Date() }
      });
      return;
    }

    await db.waQueueLog.update({
      where: { id: logId },
      data: { status: "SENT", sentAt: new Date() }
    });

    logger.info(`WA message sent successfully to ${phone} (log: ${logId})`);
  } catch (err: any) {
    logger.error(`WA send exception for ${phone}`, err);
    await db.waQueueLog.update({
      where: { id: logId },
      data: { status: "FAILED", error: err.message, sentAt: new Date() }
    }).catch(e => logger.error("Failed to update WA log", e));
  }
}

// Legacy stub
export function startWaWorker() {
  logger.info("WA Worker: Direct processing mode (no Inngest dependency). Skipping startWaWorker.");
  return null;
}
