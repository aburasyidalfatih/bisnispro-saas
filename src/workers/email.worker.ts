import { Worker, Job } from "bullmq"
import { connection, applyEnterpriseHandling } from "./shared"
import { sendEmail } from "@/features/notification/services/notification.service"
import { db } from "@/lib/db"

export const emailWorker = new Worker(
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

applyEnterpriseHandling(emailWorker)
