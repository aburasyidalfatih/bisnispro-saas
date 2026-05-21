import { Worker, Job } from "bullmq"
import { Redis } from "ioredis"
import { db } from "./lib/db"

import { sendWhatsAppDirect, sendEmail } from "@/features/notification/services/notification.service"
import { ImportService } from "@/features/import/services/import.service"
import { processGamificationPoints } from "@/features/gamification/services/gamification.service"
import { FinanceService } from "@/features/finance/services/finance.service"
import { syncPostViewsToDatabase, syncEventViewsToDatabase } from "@/features/post/services/views.service"
import { syncShareCountsToDatabase } from "@/features/post/services/share.service"

const redisOptions = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
}

const connection = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null })
  : new Redis(redisOptions)

console.log("🛠️  Starting BullMQ Enterprise Workers...")

// ============================================================
// Helper: Report failed jobs to Sentry
// ============================================================
async function reportToSentry(workerName: string, job: Job | undefined, err: Error) {
  try {
    const Sentry = require("@sentry/nextjs")
    Sentry.withScope((scope: any) => {
      scope.setTag("worker", workerName)
      scope.setTag("jobId", job?.id || "unknown")
      if (job?.data?.tenantId) scope.setTag("tenantId", job.data.tenantId)
      scope.setExtras({
        jobName: job?.name,
        attemptsMade: job?.attemptsMade,
        data: JSON.stringify(job?.data || {}).substring(0, 500),
      })
      Sentry.captureException(err)
    })
  } catch {
    // Sentry not available — fail silently
  }
}

// ============================================================
// 1. WhatsApp Notification Worker (handles both single + broadcast)
// ============================================================

// Per-tenant throttle: Max 1 message per 3 seconds per tenant
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

const waWorker = new Worker(
  "wa-queue",
  async (job: Job) => {
    const { tenantId, number, message, waQueueLogId, broadcastId, recipientName } = job.data
    console.log(`[wa-queue] Processing job ${job.id} for ${number}...`)

    // [REDIS THROTTLE] Wait for tenant-specific rate limit
    await throttlePerTenant(tenantId)

    try {
      const result = await sendWhatsAppDirect(number, message, tenantId)

      if (!result.success) {
        throw new Error(result.error || "Failed to send WhatsApp message")
      }

      // Update WA queue log if exists (for queued messages via admin)
      if (waQueueLogId) {
        await db.waQueueLog.update({
          where: { id: waQueueLogId },
          data: { status: "SENT", sentAt: new Date() },
        })
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
        await db.waQueueLog.update({
          where: { id: waQueueLogId },
          data: { status: "FAILED", error: error.message },
        })
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

// ============================================================
// 2. CSV Import Worker
// ============================================================
const importWorker = new Worker(
  "import-queue",
  async (job: Job) => {
    const { tenantId, type, data, userId } = job.data
    console.log(`[import-queue] Processing import ${type} for tenant ${tenantId}...`)

    try {
      if (type === "students") {
        const result = await ImportService.importStudents({ tenantId, students: data })
        if (!result.success) throw new Error(result.error)
      } else if (type === "users") {
        const result = await ImportService.importUsers({ tenantId, users: data })
        if (!result.success) throw new Error(result.error)
      }

      await db.auditLog.create({
        data: {
          tenantId,
          action: `IMPORT_${type.toUpperCase()}_COMPLETED`,
          entity: "System",
          userId: userId || "SYSTEM",
        },
      }).catch(() => {})

      return { success: true }
    } catch (error: any) {
      console.error(`[import-queue] Failed to import ${type}`, error)
      await db.auditLog.create({
        data: {
          tenantId,
          action: `IMPORT_${type.toUpperCase()}_FAILED`,
          entity: "System",
          userId: userId || "SYSTEM",
          newData: error.message,
        },
      }).catch(() => {})
      throw error
    }
  },
  { connection, concurrency: 5 }
)

// ============================================================
// 3. Billing / Invoice Worker
// ============================================================
const billingWorker = new Worker(
  "billing-queue",
  async (job: Job) => {
    console.log(`[billing-queue] Processing invoice generation for tenant ${job.data.tenantId}...`)
    try {
      const result = await FinanceService.createBulkInvoices(job.data)

      if (!result.success || !result.data) {
        throw new Error(result.error || "Gagal memproses bulk invoice")
      }

      console.log(`[billing-queue] Successfully generated ${result.data.count} invoices.`)

      await db.auditLog.create({
        data: {
          tenantId: job.data.tenantId,
          action: "BULK_INVOICE_GENERATION_COMPLETED",
          entity: "Finance",
          userId: job.data.userId || "SYSTEM",
          newData: `Dibuat ${result.data.count} tagihan`,
        },
      }).catch(() => {})

      return { success: true, count: result.data.count }
    } catch (error: any) {
      console.error(`[billing-queue] Failed to generate bulk invoices:`, error)
      await db.auditLog.create({
        data: {
          tenantId: job.data.tenantId,
          action: "BULK_INVOICE_GENERATION_FAILED",
          entity: "Finance",
          userId: job.data.userId || "SYSTEM",
          newData: error.message,
        },
      }).catch(() => {})
      throw error
    }
  },
  { connection, concurrency: 5 }
)

// ============================================================
// 4. Gamification Worker
// ============================================================
const gamificationWorker = new Worker(
  "gamification-queue",
  async (job: Job) => {
    console.log(`[gamification-queue] Adding points to user ${job.data.userId}...`)
    await processGamificationPoints(job.data)
    return { success: true }
  },
  { connection, concurrency: 50 }
)

// ============================================================
// 5. Automated Emails Worker
// ============================================================
const emailWorker = new Worker(
  "email-queue",
  async (job: Job) => {
    const { to, subject, htmlContent, logId, tenantId, campaignId } = job.data
    console.log(`[email-queue] Sending email to ${to} for campaign ${campaignId}...`)

    try {
      await sendEmail(to, subject, htmlContent)
      return { success: true }
    } catch (error: any) {
      console.error(`[email-queue] Failed to send email to ${to}:`, error.message)

      // Hapus log jika gagal kirim, agar besok bisa dicoba lagi
      if (logId) {
        await db.dripLog.delete({ where: { id: logId } }).catch(() => {})
      }
      throw error
    }
  },
  { connection, concurrency: 10 }
)

// ============================================================
// ENTERPRISE: Global Error & Dead-Letter Handling
// ============================================================
const workers = [waWorker, importWorker, billingWorker, gamificationWorker, emailWorker]

workers.forEach((w) => {
  // Log + Sentry on every failure
  w.on("failed", (job, err) => {
    console.error(`❌ Job ${job?.id} in ${w.name} failed (attempt ${job?.attemptsMade}):`, err.message)
    reportToSentry(w.name, job, err)
  })

  // Dead-Letter: log permanently failed jobs (exhausted all retries)
  w.on("failed", (job, err) => {
    if (job && job.attemptsMade >= (job.opts?.attempts || 3)) {
      console.error(`💀 [DLQ] Job ${job.id} in ${w.name} permanently failed after ${job.attemptsMade} attempts`)

      // Log to audit for visibility
      const tenantId = job.data?.tenantId
      if (tenantId) {
        db.auditLog.create({
          data: {
            tenantId,
            action: `QUEUE_JOB_PERMANENTLY_FAILED`,
            entity: w.name,
            userId: "SYSTEM",
            newData: `Job ${job.id}: ${err.message}`.substring(0, 500),
          },
        }).catch(() => {})
      }
    }
  })

  // Log completions for monitoring
  w.on("completed", (job) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`✅ Job ${job.id} in ${w.name} completed`)
    }
  })
})

console.log("✅ All BullMQ Workers are running and listening to queues!")
console.log("   Queues: wa-queue, import-queue, billing-queue, gamification-queue, email-queue")
console.log("   Features: retry (3x exponential), dead-letter logging, Sentry reporting")

// ============================================================
// CRON / INTERVAL JOBS
// ============================================================
setInterval(async () => {
  try {
    const p = await syncPostViewsToDatabase()
    const e = await syncEventViewsToDatabase()
    const s = await syncShareCountsToDatabase()
    if (p > 0 || e > 0 || s > 0) {
      console.log(`[cron] Synced ${p} post views, ${e} event views, ${s} share counts to DB`)
    }
  } catch (error) {
    console.error("[cron] Failed to sync", error)
  }
}, 10 * 60 * 1000) // 10 minutes

