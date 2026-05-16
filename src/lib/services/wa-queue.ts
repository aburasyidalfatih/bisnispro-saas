import { logger } from '../logger';
import { inngest } from '../inngest/client';

// 2. Fungsi untuk memasukkan pesan ke dalam antrean Inngest
export const enqueueWhatsApp = async (phone: string, message: string, tenantId?: string | null) => {
  try {
    const { db } = await import('@/lib/db');
    
    // Tulis ke DB sebagai PENDING
    const log = await db.waQueueLog.create({
      data: {
        targetNumber: phone,
        message,
        tenantId,
        status: "PENDING"
      }
    });

    // Kirim ke Inngest Queue
    await inngest.send({
      name: "system/whatsapp.send",
      data: { 
        phone, 
        message, 
        tenantId: tenantId || "superadmin", // fallback key for concurrency
        logId: log.id 
      }
    });

    logger.info(`Message to ${phone} queued in Inngest with log ID: ${log.id}`);
    return { success: true, logId: log.id };
  } catch (error: any) {
    logger.error("Failed to enqueue WA message to Inngest", error);
    return { success: false, error: error.message };
  }
};

// Worker function is removed. Inngest handles it via Next.js API Route.
export function startWaWorker() {
  logger.info("BullMQ Worker for WhatsApp has been replaced by Inngest. Skipping startWaWorker.");
  return null;
}
