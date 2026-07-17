import { Worker, Job } from "bullmq"
import { connection, applyEnterpriseHandling } from "./shared"
import { db } from "@/lib/db"
import { FinanceService } from "@/features/finance/services/finance.service"

export const billingWorker = new Worker(
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

applyEnterpriseHandling(billingWorker)
