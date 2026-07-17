import { Worker, Job } from "bullmq"
import { connection, applyEnterpriseHandling } from "./shared"
import { db } from "@/lib/db"
import { ImportService } from "@/features/import/services/import.service"

export const importWorker = new Worker(
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

applyEnterpriseHandling(importWorker)
