import { Redis } from "ioredis"
import { Job, Queue } from "bullmq"
import * as Sentry from "@sentry/nextjs"
import { db } from "@/lib/db"
import { validateProductionEnv } from "@/lib/env"

validateProductionEnv()

const redisOptions = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
}

export const connection = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null })
  : new Redis(redisOptions)

// Reusable queue instances (module-scope to prevent connection leaks)
export const emailQueue = new Queue("email-queue", { connection })
export const waQueue = new Queue("wa-queue", { connection })

// Helper: Report failed jobs to Sentry
export async function reportToSentry(workerName: string, job: Job | undefined, err: Error) {
  try {
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

export function applyEnterpriseHandling(worker: any) {
  // Log + Sentry on every failure
  worker.on("failed", (job: any, err: any) => {
    console.error(`❌ Job ${job?.id} in ${worker.name} failed (attempt ${job?.attemptsMade}):`, err.message)
    reportToSentry(worker.name, job, err)

    // Dead-Letter: log permanently failed jobs (exhausted all retries)
    if (job && job.attemptsMade >= (job.opts?.attempts || 3)) {
      console.error(`💀 [DLQ] Job ${job.id} in ${worker.name} permanently failed after ${job.attemptsMade} attempts`)
      const tenantId = job.data?.tenantId
      if (tenantId) {
        db.auditLog.create({
          data: {
            tenantId,
            action: `QUEUE_JOB_PERMANENTLY_FAILED`,
            entity: worker.name,
            userId: "SYSTEM",
            newData: `Job ${job.id}: ${err.message}`.substring(0, 500),
          },
        }).catch(() => {})
      }
    }
  })

  // Log completions for monitoring
  worker.on("completed", (job: any) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`✅ Job ${job.id} in ${worker.name} completed`)
    }
  })
}

// Helper: Run cron interval with lock
export async function runWithLock(jobName: string, intervalMs: number, fn: () => Promise<void>) {
  setInterval(async () => {
    const lockKey = `cron:lock:${jobName}`
    // Expire lock slightly before next run
    const acquired = await connection.set(lockKey, "1", "PX", Math.max(intervalMs - 5000, 1000), "NX")
    if (acquired) {
      try {
        await fn()
      } catch (err) {
        console.error(`[cron] Error in ${jobName}`, err)
      }
    }
  }, intervalMs)
}
