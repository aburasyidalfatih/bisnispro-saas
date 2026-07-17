import { Worker, Job } from "bullmq"
import { connection, applyEnterpriseHandling } from "./shared"
import { db } from "@/lib/db"
import { sendWhatsAppDirect } from "@/features/notification/services/notification.service"

const WA_THROTTLE_SECONDS = 3

async function throttlePerTenant(tenantId: string | null): Promise<void> {
  if (!tenantId) return
  
  const throttleKey = `wa:throttle:${tenantId}`
  try {
    const lastSent = await connection.get(throttleKey)
    if (lastSent) {
      const elapsed = Date.now() - parseInt(lastSent, 10)
      const waitMs = WA_THROTTLE_SECONDS * 1000 - elapsed
      if (waitMs > 0) {
        await new Promise(resolve => setTimeout(resolve, waitMs))
      }
    }
    // Mark timestamp
    await connection.set(throttleKey, Date.now().toString(), "EX", WA_THROTTLE_SECONDS * 2)
  } catch {
    // If Redis fails, just add a safety delay
    await new Promise(resolve => setTimeout(resolve, 1500))
  }
}

export const waWorker = new Worker(
  "wa-queue",
  async (job: Job) => {
    const { tenantId, number, message, waQueueLogId, broadcastId, templateData } = job.data
    console.log(`[wa-queue] Processing job ${job.id} for ${number}...`)

    // [REDIS THROTTLE] Wait for tenant-specific rate limit
    await throttlePerTenant(tenantId)

    try {
      // Pass skipDelay = true because the delay was already processed at queue level
      const result = await sendWhatsAppDirect(number, message, tenantId, templateData, true)

      if (!result.success) {
        throw new Error(result.error || "Failed to send WhatsApp message")
      }

      // Update WA queue log with retry mechanism for race conditions
      if (waQueueLogId) {
        let retries = 3;
        while (retries > 0) {
          const updateRes = await db.waQueueLog.updateMany({
            where: { id: waQueueLogId },
            data: { status: "SENT", sentAt: new Date(), error: null },
          });
          if (updateRes.count > 0) break;
          // If 0 rows updated, wait and retry (row might not be fully visible yet)
          await new Promise(r => setTimeout(r, 500));
          retries--;
        }
      }

      // Create individual delivery log for broadcast tracking
      if (broadcastId) {
        await db.waMessage.create({
          data: {
            tenantId,
            to: number,
            content: message.substring(0, 500),
            status: "SENT",
          },
        }).catch(() => {})
      }

      return { success: true }
    } catch (error: any) {
      if (waQueueLogId) {
        let retries = 3;
        while (retries > 0) {
          const updateRes = await db.waQueueLog.updateMany({
            where: { id: waQueueLogId },
            data: { status: "FAILED", error: error.message },
          });
          if (updateRes.count > 0) break;
          await new Promise(r => setTimeout(r, 500));
          retries--;
        }
      }

      // On final attempt failure, log for broadcast
      if (broadcastId && job.attemptsMade >= (job.opts?.attempts || 3) - 1) {
        await db.waMessage.create({
          data: {
            tenantId,
            to: number,
            content: message.substring(0, 500),
            status: "FAILED",
            error: error.message,
          },
        }).catch(() => {})
      }

      throw error // BullMQ retry mechanism handles this
    }
  },
  {
    connection,
    concurrency: 3, // Concurrency 3: memungkinkan tenant berbeda berjalan paralel, throttle per-tenant menjaga keamanan masing-masing
  }
)

applyEnterpriseHandling(waWorker)
