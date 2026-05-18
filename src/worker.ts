import { Worker, Job } from "bullmq"
import { Redis } from "ioredis"
import { db } from "./lib/db"

import { sendWhatsAppDirect } from "./lib/services/notification"
import { ImportService } from "./lib/services/import-service"

const redisOptions = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
}

const connection = new Redis(redisOptions)

console.log("🛠️  Starting BullMQ Enterprise Workers...")

// -----------------------------------------------------------------------------
// 1. WhatsApp Notification Worker
// -----------------------------------------------------------------------------
const waWorker = new Worker(
  "wa-queue",
  async (job: Job) => {
    const { tenantId, number, message, waQueueLogId } = job.data
    console.log(`[wa-queue] Processing job ${job.id} for ${number}...`)

    try {
      // Panggil fungsi kirim WA aktual
      const result = await sendWhatsAppDirect(number, message, tenantId)
      
      if (!result.success) {
        throw new Error(result.error || "Failed to send WhatsApp message")
      }
      
      if (waQueueLogId) {
        await db.waQueueLog.update({
          where: { id: waQueueLogId },
          data: { status: "SENT", sentAt: new Date() },
        })
      }
      return { success: true }
    } catch (error: any) {
      if (waQueueLogId) {
        await db.waQueueLog.update({
          where: { id: waQueueLogId },
          data: { status: "FAILED", error: error.message },
        })
      }
      throw error // Akan diproses ulang oleh fitur retry BullMQ
    }
  },
  { 
    connection,
    concurrency: 20 // Bisa kirim 20 WA sekaligus tanpa ngelag!
  }
)

// -----------------------------------------------------------------------------
// 2. CSV Import Worker
// -----------------------------------------------------------------------------
const importWorker = new Worker(
  "import-queue",
  async (job: Job) => {
    const { tenantId, type, data, userId } = job.data
    console.log(`[import-queue] Processing import ${type} for tenant ${tenantId}...`)

    try {
      if (type === "students") {
        await ImportService.importStudents({ tenantId, students: data })
      } else if (type === "users") {
        await ImportService.importUsers({ tenantId, users: data })
      }

      await db.auditLog.create({
        data: {
          tenantId,
          action: `IMPORT_${type.toUpperCase()}_COMPLETED`,
          entity: "System",
          userId: userId || "SYSTEM"
        }
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
          details: error.message
        }
      }).catch(() => {})
      throw error
    }
  },
  { connection, concurrency: 5 } // Tugas berat, concurrency diset rendah
)

// -----------------------------------------------------------------------------
// 3. Billing / Invoice Worker
// -----------------------------------------------------------------------------
const billingWorker = new Worker(
  "billing-queue",
  async (job: Job) => {
    console.log(`[billing-queue] Processing invoice generation for tenant ${job.data.tenantId}...`)
    // Generate invoice bulanan secara asinkron
    return { success: true }
  },
  { connection, concurrency: 5 }
)

// -----------------------------------------------------------------------------
// 4. Gamification Worker
// -----------------------------------------------------------------------------
const gamificationWorker = new Worker(
  "gamification-queue",
  async (job: Job) => {
    console.log(`[gamification-queue] Adding points to user ${job.data.userId}...`)
    // Hitung poin secara background
    return { success: true }
  },
  { connection, concurrency: 50 } // Sangat ringan, concurrency diset sangat tinggi
)

// Menangani error tak terduga agar worker tidak crash
const workers = [waWorker, importWorker, billingWorker, gamificationWorker]
workers.forEach(w => {
  w.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} in ${w.name} failed:`, err.message)
  })
})

console.log("✅ All BullMQ Workers are running and listening to queues!")
