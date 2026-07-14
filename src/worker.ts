import { Worker, Job } from "bullmq"
import { Redis } from "ioredis"
import { db } from "./lib/db"

import { sendWhatsAppDirect, sendEmail } from "@/features/notification/services/notification.service"
import { getWaQueueDelay } from "@/features/notification/services/wa-queue.service"
import { ImportService } from "@/features/import/services/import.service"
import { processGamificationPoints } from "@/features/gamification/services/gamification.service"
import { FinanceService } from "@/features/finance/services/finance.service"
import { syncPostViewsToDatabase, syncEventViewsToDatabase } from "@/features/post/services/views.service"
import { syncShareCountsToDatabase } from "@/features/post/services/share.service"
import { processLeaderboardSync } from "@/features/gamification/services/leaderboard.service"
import { approveApplication } from "@/features/tenant/services/application.service"
import { SocialShareService } from "@/features/social/services/social-share.service"
import * as Sentry from "@sentry/nextjs"
import { Queue } from "bullmq"
import { validateProductionEnv } from "./lib/env"

validateProductionEnv()

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
    const { tenantId, number, message, waQueueLogId, broadcastId, recipientName, templateData } = job.data
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
// 6. CBT Scoring Worker
// ============================================================
const cbtWorker = new Worker(
  "cbt-queue",
  async (job: Job) => {
    const { sessionId, examId } = job.data
    console.log(`[cbt-queue] Processing scoring for session ${sessionId}...`)

    try {
      // 1. Fetch exam questions and points
      const exam = await db.cbtExam.findUnique({
        where: { id: examId },
        include: { questionBank: { include: { questions: true } } }
      })
      if (!exam) throw new Error("Exam not found")

      // 2. Fetch session and answers
      const session = await db.cbtSession.findUnique({
        where: { id: sessionId },
        include: { answers: true }
      })
      if (!session) throw new Error("Session not found")

      const questions = exam.questionBank.questions
      const totalPoints = questions.reduce((sum, q) => sum + q.points, 0) || 1
      let earned = 0

      // 3. Score the answers
      const updatePromises = []
      for (const studentAns of session.answers) {
        const q = questions.find(q => q.id === studentAns.questionId)
        if (!q) continue

        let isCorrect = false
        if (q.type === "MULTIPLE_CHOICE" && q.options) {
          const options = q.options as any[]
          const correctOpt = options.find(o => o.isCorrect)
          if (correctOpt && studentAns.answer === correctOpt.id) {
            isCorrect = true
            earned += q.points
          }
        }

        // Push update to transaction batch
        updatePromises.push(
          db.cbtAnswer.update({
            where: { id: studentAns.id },
            data: { isCorrect, points: isCorrect ? q.points : 0 }
          })
        )
      }

      await db.$transaction(updatePromises)

      const finalScore = (earned / totalPoints) * 100

      // 4. Update session score
      await db.cbtSession.update({
        where: { id: sessionId },
        data: { score: Math.round(finalScore * 100) / 100 }
      })

      return { success: true, score: finalScore }
    } catch (error: any) {
      console.error(`[cbt-queue] Failed to score session ${sessionId}:`, error.message)
      throw error
    }
  },
  { connection, concurrency: 10 }
)

// ============================================================
// 7. Social Share Worker
// ============================================================
const socialShareWorker = new Worker(
  "social-share-queue",
  async (job: Job) => {
    const { tenantId, postId } = job.data
    console.log(`[social-share-queue] Processing share for post ${postId} (tenant ${tenantId})...`)

    try {
      const post = await db.post.findUnique({
        where: { id: postId },
        include: { tenant: true }
      })
      if (!post) throw new Error("Post not found")

      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "schoolpro.id"
      const host = post.tenant.domain || `${post.tenant.slug}.${rootDomain}`
      const isPengumuman = post.type?.includes("PENGUMUMAN")
      const postUrl = `https://${host}/${isPengumuman ? 'pengumuman' : 'berita'}/${post.slug}`
      const imageUrl = post.featuredImage || ""
      const message = `${post.title}\n\nBaca selengkapnya:\n${postUrl}`

      const credentials = await db.socialMediaCredential.findMany({
        where: { tenantId, isActive: true }
      })

      const results = await Promise.allSettled(
        credentials.map(async (cred) => {
          if (cred.platform === "TELEGRAM") {
            if (!cred.externalId) throw new Error("Missing Telegram Chat ID")
            return SocialShareService.shareToTelegram(cred.accessToken, cred.externalId, message)
          } else if (cred.platform === "FACEBOOK") {
            if (!cred.externalId) throw new Error("Missing Facebook Page ID")
            return SocialShareService.shareToFacebook(cred.externalId, cred.accessToken, post.title, postUrl)
          } else if (cred.platform === "TWITTER") {
            if (!cred.refreshToken) throw new Error("Missing Twitter Token Secret")
            // Re-using columns: accessToken = User Token, refreshToken = User Secret, externalId = API Key, etc.
            // For simplicity, we assume accessToken = user token, refreshToken = user secret, and we need App Keys.
            // App keys should be from tenant settings or platform settings.
            // Actually, we can store JSON in externalId if needed. For now, assuming platform settings has keys.
            const settings = await db.platformSetting.findMany({
              where: { key: { in: ['TWITTER_API_KEY', 'TWITTER_API_SECRET'] } }
            })
            const apiKey = settings.find(s => s.key === 'TWITTER_API_KEY')?.value || ""
            const apiSecret = settings.find(s => s.key === 'TWITTER_API_SECRET')?.value || ""
            return SocialShareService.shareToTwitter(cred.accessToken, cred.refreshToken || "", message, apiKey, apiSecret)
          } else if (cred.platform === "INSTAGRAM") {
            if (!cred.externalId) throw new Error("Missing Instagram User ID")
            return SocialShareService.shareToInstagram(cred.externalId, cred.accessToken, imageUrl, message)
          } else if (cred.platform === "THREADS") {
            if (!cred.externalId) throw new Error("Missing Threads User ID")
            return SocialShareService.shareToThreads(cred.externalId, cred.accessToken, message)
          }
        })
      )

      const failures = results.filter(r => r.status === "rejected")
      if (failures.length > 0) {
        console.error(`[social-share-queue] Failed shares:`, failures)
        await db.errorLog.create({
          data: {
            tenantId,
            category: "SOCIAL_SHARE_FAILED",
            message: `Failed to share post ${postId} to ${failures.length} platforms`,
            metadata: failures.map((f: any) => f.reason?.message || f.reason),
          }
        })
      }

      return { success: true, processed: credentials.length, failed: failures.length }
    } catch (error: any) {
      console.error(`[social-share-queue] Critical error:`, error.message)
      throw error
    }
  },
  { connection, concurrency: 5 }
)

// ============================================================
// ENTERPRISE: Global Error & Dead-Letter Handling
// ============================================================
const workers = [waWorker, importWorker, billingWorker, gamificationWorker, emailWorker, cbtWorker, socialShareWorker]

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
console.log("   Queues: wa-queue, import-queue, billing-queue, gamification-queue, email-queue, social-share-queue")
console.log("   Features: retry (3x exponential), dead-letter logging, Sentry reporting")

// ============================================================
// CRON / INTERVAL JOBS (WITH REDIS LOCK)
// ============================================================
async function runWithLock(jobName: string, intervalMs: number, fn: () => Promise<void>) {
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

runWithLock("syncViews", 10 * 60 * 1000, async () => {
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
}) // 10 minutes

// ============================================================
// AUTO CLEANUP ERROR LOGS (older than 30 days)
// ============================================================
runWithLock("errorLogCleanup", 24 * 60 * 60 * 1000, async () => {
  console.log("[cron] Running Error Log Cleanup...")
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const result = await db.errorLog.deleteMany({
      where: {
        createdAt: { lt: thirtyDaysAgo }
      }
    })
    if (result.count > 0) {
      console.log(`[cron] Cleaned up ${result.count} old error logs.`)
    }
  } catch (error) {
    console.error("[cron] Failed Error Log Cleanup", error)
  }
}) // Runs every 24 hours

// ============================================================
// AUTO APPROVE APPLICATIONS (24H)
// ============================================================
runWithLock("autoApproveApps", 30 * 60 * 1000, async () => {
  try {
    const setting = await db.platformSetting.findUnique({
      where: { key: 'AUTO_APPROVE_APPLICATIONS_24H' }
    })
    
    if (setting?.value === "true") {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      
      const pendingApps = await db.tenantApplication.findMany({
        where: {
          status: "PENDING",
          createdAt: {
            lte: twentyFourHoursAgo
          }
        },
        take: 10 // process in small batches to avoid overload
      })
      
      if (pendingApps.length > 0) {
        console.log(`[cron] Auto-approving ${pendingApps.length} pending applications (older than 24h)...`)
        
        for (const app of pendingApps) {
          try {
            await approveApplication(app.id)
            console.log(`[cron] Successfully auto-approved application ${app.id}`)
          } catch (err) {
            console.error(`[cron] Failed to auto-approve application ${app.id}:`, err)
          }
        }
      }
    }
  } catch (error) {
    console.error("[cron] Failed Auto-Approve Application check", error)
  }
}) // Runs every 30 minutes

// ============================================================
// LEADERBOARD RECALCULATION & SYNC
// ============================================================
runWithLock("leaderboardSync", 3 * 60 * 60 * 1000, async () => {
  console.log("[cron] Running Leaderboard Sync...")
  try {
    const result = await processLeaderboardSync()
    console.log(`[cron] Leaderboard sync success: ${result.message} (${result.processedCount} tenants)`)
  } catch (error) {
    console.error("[cron] Failed to sync leaderboard", error)
  }
}) // 3 hours


// ============================================================
// TENANT LIFECYCLE MANAGEMENT (RETENTION & CLEANUP)
// ============================================================
runWithLock("tenantLifecycle", 6 * 60 * 60 * 1000, async () => {
  console.log("[cron] Running Tenant Lifecycle Management check...")
  try {
    const now = new Date()
    
    // Fetch all retention settings once
    const retentionKeys = [
      'RETENTION_30_EMAIL_SUBJECT', 'RETENTION_30_EMAIL_BODY', 'RETENTION_30_WA',
      'RETENTION_60_EMAIL_SUBJECT', 'RETENTION_60_EMAIL_BODY', 'RETENTION_60_WA',
      'RETENTION_90_EMAIL_SUBJECT', 'RETENTION_90_EMAIL_BODY', 'RETENTION_90_WA'
    ]
    const platformSettings = await db.platformSetting.findMany({
      where: { key: { in: retentionKeys } }
    })
    const settingsMap = platformSettings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {} as any)
    
    const emailQueue = new Queue("email-queue", { connection })
    const waQueue = new Queue("wa-queue", { connection })

    // 1. Fase 1: Peringatan 30 Hari (Re-engagement)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    // PAGINATION FIX: Limit to 100 tenants per run to prevent OOM
    const warnTenants = await db.tenant.findMany({
      where: {
        isActive: true,
        retentionStatus: "ACTIVE",
        lastActiveAt: {
          lte: thirtyDaysAgo
        }
      },
      take: 100
    })

    for (const tenant of warnTenants) {
      console.log(`[retention] Warning 30-day inactive tenant: ${tenant.slug}`)
      
      // Update status
      await db.tenant.update({
        where: { id: tenant.id },
        data: { retentionStatus: "WARN_30" }
      })

      const emailSubject = settingsMap['RETENTION_30_EMAIL_SUBJECT'] || "Apakah ada kendala dengan website sekolah Anda?"
      const emailBodyRaw = settingsMap['RETENTION_30_EMAIL_BODY'] || `<p>Halo Admin {nama_sekolah},</p><p>Kami perhatikan Anda belum login ke dasbor SchoolPro selama 30 hari. Apakah ada kendala dalam mengatur website atau fitur sekolah Anda?</p><p>Silakan login kembali menggunakan email pendaftaran Anda yaitu <strong>{email_pendaftaran}</strong> beserta password yang sudah Anda buat saat mendaftar. Jika Anda lupa password, silakan gunakan fitur "Lupa Password" di halaman login untuk membuat password baru.</p><p>Yuk, mulai bangun kehadiran digital sekolah Anda sekarang. Jika butuh bantuan teknis, jangan sungkan membalas email ini!</p>`
      const emailBody = emailBodyRaw.replace(/{nama_sekolah}/g, tenant.name).replace(/{email_pendaftaran}/g, tenant.email || "")
      
      const waMsgRaw = settingsMap['RETENTION_30_WA'] || "Halo Admin {nama_sekolah}, kami perhatikan Anda belum login dasbor selama 30 hari. Apakah ada kendala?\n\nSilakan login kembali menggunakan email pendaftaran Anda yaitu {email_pendaftaran} beserta password yang sudah Anda buat saat mendaftar. Jika lupa password, gunakan fitur Lupa Password di halaman login.\n\nYuk, bangun kehadiran digital sekolah Anda sekarang. Balas pesan ini jika butuh bantuan!"
      const waMsg = waMsgRaw.replace(/{nama_sekolah}/g, tenant.name).replace(/{email_pendaftaran}/g, tenant.email || "")

      // Kirim Email
      if (tenant.email) {
        await emailQueue.add("retention-warning", {
          tenantId: tenant.id,
          to: tenant.email,
          subject: emailSubject,
          htmlContent: emailBody
        })
      }

      // Kirim WA
      if (tenant.whatsapp || tenant.phone) {
        const phone = tenant.whatsapp || tenant.phone || ""
        const waLog = await db.waQueueLog.create({
          data: {
            tenantId: tenant.id, 
            targetNumber: phone,
            message: waMsg,
            status: "PENDING"
          }
        })
        const delay = await getWaQueueDelay(tenant.id)
        await waQueue.add("retention-warning-wa", {
          tenantId: tenant.id,
          number: phone,
          message: waMsg,
          waQueueLogId: waLog.id
        }, { delay })
      }
    }

    // 2. Fase 2: Penonaktifan 60 Hari (Suspension)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
    const suspendTenants = await db.tenant.findMany({
      where: {
        isActive: true,
        retentionStatus: "WARN_30",
        lastActiveAt: { lte: sixtyDaysAgo }
      },
      take: 100
    })

    for (const tenant of suspendTenants) {
      console.log(`[retention] Suspending 60-day inactive tenant: ${tenant.slug}`)
      await db.tenant.update({
        where: { id: tenant.id },
        data: { 
          isActive: false, 
          retentionStatus: "SUSPENDED_60" 
        }
      })

      const emailSubject = settingsMap['RETENTION_60_EMAIL_SUBJECT'] || "PEMBERITAHUAN: Website Sekolah Anda Ditangguhkan (Suspend)"
      const emailBodyRaw = settingsMap['RETENTION_60_EMAIL_BODY'] || `<p>Halo Admin {nama_sekolah},</p><p>Kami ingin memberitahukan bahwa website sekolah Anda saat ini telah <strong>ditangguhkan (suspend)</strong> karena tidak ada aktivitas login selama 60 hari terakhir.</p><p>Untuk mengaktifkan kembali website Anda, silakan segera menghubungi tim Admin SchoolPro. Jika tidak ada konfirmasi lebih lanjut, data website Anda akan dihapus secara permanen pada hari ke-90.</p>`
      const emailBody = emailBodyRaw.replace(/{nama_sekolah}/g, tenant.name)
      
      const waMsgRaw = settingsMap['RETENTION_60_WA'] || "Halo Admin {nama_sekolah}, website sekolah Anda saat ini berstatus SUSPEND (ditangguhkan) karena tidak ada aktivitas login selama 60 hari. Silakan hubungi admin SchoolPro jika ingin mengaktifkan kembali website Anda sebelum dihapus permanen."
      const waMsg = waMsgRaw.replace(/{nama_sekolah}/g, tenant.name)

      if (tenant.email) {
        await emailQueue.add("retention-suspend", {
          tenantId: tenant.id, to: tenant.email, subject: emailSubject, htmlContent: emailBody
        })
      }

      if (tenant.whatsapp || tenant.phone) {
        const phone = tenant.whatsapp || tenant.phone || ""
        const waLog = await db.waQueueLog.create({
          data: { tenantId: tenant.id, targetNumber: phone, message: waMsg, status: "PENDING" }
        })
        const delay = await getWaQueueDelay(tenant.id)
        await waQueue.add("retention-suspend-wa", {
          tenantId: tenant.id, number: phone, message: waMsg, waQueueLogId: waLog.id
        }, { delay })
      }
    }

    // 3. Fase 3: Penghapusan 90 Hari (Hard Delete)
    const ninetyDaysAgoDelete = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    const deleteTenants = await db.tenant.findMany({
      where: {
        isActive: false,
        retentionStatus: "SUSPENDED_60",
        lastActiveAt: { lte: ninetyDaysAgoDelete },
        deletedAt: null
      },
      take: 100
    })

    for (const tenant of deleteTenants) {
      console.log(`[retention] Hard-deleting 90-day inactive tenant: ${tenant.slug}`)
      
      const emailSubject = settingsMap['RETENTION_90_EMAIL_SUBJECT'] || "PEMBERITAHUAN: Website Sekolah Anda Telah Dihapus Permanen"
      const emailBodyRaw = settingsMap['RETENTION_90_EMAIL_BODY'] || `<p>Halo Admin {nama_sekolah},</p><p>Karena tidak ada aktivitas login selama 90 hari dan masa penangguhan telah berakhir, dengan berat hati kami menginformasikan bahwa data website sekolah Anda telah <strong>dihapus secara total</strong> dari sistem kami untuk menjaga performa server.</p><p>Jika di kemudian hari Anda ingin memiliki website kembali, silakan melakukan pengajuan pendaftaran ulang. Terima kasih atas ketertarikan Anda pada SchoolPro.</p>`
      const emailBody = emailBodyRaw.replace(/{nama_sekolah}/g, tenant.name)
      
      const waMsgRaw = settingsMap['RETENTION_90_WA'] || "Halo Admin {nama_sekolah}, website sekolah Anda telah DIHAPUS TOTAL dari sistem karena tidak ada aktivitas selama 90 hari. Jika di kemudian hari Anda membutuhkan website kembali, silakan ajukan pendaftaran ulang. Terima kasih."
      const waMsg = waMsgRaw.replace(/{nama_sekolah}/g, tenant.name)

      if (tenant.email) {
        await emailQueue.add("retention-delete", {
          tenantId: tenant.id, to: tenant.email, subject: emailSubject, htmlContent: emailBody
        })
      }

      if (tenant.whatsapp || tenant.phone) {
        const phone = tenant.whatsapp || tenant.phone || ""
        const waLog = await db.waQueueLog.create({
          data: { tenantId: tenant.id, targetNumber: phone, message: waMsg, status: "PENDING" }
        })
        const delay = await getWaQueueDelay(tenant.id)
        await waQueue.add("retention-delete-wa", {
          tenantId: tenant.id, number: phone, message: waMsg, waQueueLogId: waLog.id
        }, { delay })
      }

      await db.tenant.update({
        where: { id: tenant.id },
        data: {
          isActive: false,
          retentionStatus: "CHURNED",
          deletedAt: new Date()
        }
      })
    }

  } catch (error) {
    console.error("[cron] Failed Tenant Lifecycle check", error)
  }
}) // Runs once every 6 hours

// ============================================================
// EMAIL QUEUE PROCESSOR
// ============================================================
runWithLock("emailQueueSync", 5 * 60 * 1000, async () => {
  console.log("[cron] Running Email Queue Process...")
  try {
    const { processEmailQueueCron } = await import("@/features/notification/services/notification.service")
    const result = await processEmailQueueCron()
    if (result.processed && result.processed > 0) {
      console.log(`[cron] Email Queue processed: ${result.processed}, success: ${result.successCount}, fail: ${result.failCount}`)
    }
  } catch (error) {
    console.error("[cron] Failed to process email queue", error)
  }
}) // Runs every 5 minutes
