import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { logger } from '../logger';
import { sendWhatsAppDirect } from './notification';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Mencegah koneksi redis berulang di mode dev (Hot Reload)
const globalForRedis = globalThis as unknown as {
  redisConnection: IORedis;
};

export const redisConnection = globalForRedis.redisConnection || new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
});

if (process.env.NODE_ENV !== "production") globalForRedis.redisConnection = redisConnection;

// 1. Buat Instance Queue
export const waQueue = new Queue('whatsapp-messages', { 
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: true, // Jangan penuhi memori redis dengan job sukses
    removeOnFail: false
  }
});

// 2. Fungsi untuk memasukkan pesan ke dalam antrean
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

    const job = await waQueue.add('send-message', { phone, message, tenantId, logId: log.id });
    logger.info(`Message to ${phone} queued with job ID: ${job.id}`);
    return { success: true, jobId: job.id };
  } catch (error: any) {
    logger.error("Failed to enqueue WA message", error);
    return { success: false, error: error.message };
  }
};

// 3. Fungsi untuk menyalakan Worker
export function startWaWorker() {
  logger.info("Starting WhatsApp BullMQ Worker...");
  
  const worker = new Worker('whatsapp-messages', async (job: Job) => {
    const { phone, message, tenantId, logId } = job.data;
    logger.info(`Processing WA Job ${job.id} for phone ${phone}`);
    const { db } = await import('@/lib/db');
    
    try {
      // Panggil fungsi pengiriman aslinya (yang memiliki delay di dalamnya)
      // Karena concurrency = 1, delay akan dipatuhi dengan sempurna secara sekuensial.
      const result = await sendWhatsAppDirect(phone, message, tenantId);
      
      if (!result.success) {
        throw new Error(result.error || "Failed to send message");
      }
      
      if (logId) {
        await db.waQueueLog.update({
          where: { id: logId },
          data: { status: "SENT", sentAt: new Date() }
        });
      }

      return result;
    } catch (err: any) {
      if (logId) {
        await db.waQueueLog.update({
          where: { id: logId },
          data: { status: "FAILED", error: err.message, sentAt: new Date() }
        }).catch(e => logger.error("Failed to update WA log", e));
      }
      throw err;
    }
  }, {
    connection: redisConnection,
    concurrency: 1, // SANGAT PENTING: Paksa berjalan sekuensial 1 per 1 agar delay efektif
  });

  worker.on('completed', job => {
    logger.info(`WA Job ${job.id} completed successfully!`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`WA Job ${job?.id} failed with ${err.message}`);
  });

  return worker;
}
