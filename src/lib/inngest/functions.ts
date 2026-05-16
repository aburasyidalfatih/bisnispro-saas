// @ts-nocheck
import { inngest } from "./client"
import { ImportService } from "@/lib/services/import-service"
import { FinanceService } from "@/lib/services/finance-service"
import { db } from "@/lib/db"

/**
 * Enterprise Job Queue Functions (Fase 2)
 * Fungsi-fungsi di sini berjalan secara Asynchronous (di Background) 
 * untuk mencegah blocking pada Event Loop Node.js saat melayani ribuan tenant.
 * 
 * Inngest v4 API: triggers masuk ke argumen pertama (bukan argumen kedua).
 * Ref: https://www.inngest.com/docs/reference/functions/create
 */

// 1. Job Import Siswa Massal
export const importStudentsJob = inngest.createFunction(
  {
    id: "import-students-job",
    name: "Import Students Async",
    triggers: [{ event: "tenant/students.import" }],
  },
  async ({ event, step }: any) => {
    const { tenantId, students } = event.data

    const result = await step.run("import-to-database", async () => {
      return await ImportService.importStudents({ tenantId, students })
    })

    await step.run("log-audit", async () => {
      await db.auditLog.create({
        data: {
          tenantId,
          action: "IMPORT_STUDENTS_ASYNC",
          entity: "System",
          userId: "SYSTEM"
          // details di-skip karena schema belum memiliki property ini
        }
      })
    })

    return result
  }
)

// 2. Job Import GTK/Users Massal
export const importUsersJob = inngest.createFunction(
  {
    id: "import-users-job",
    name: "Import GTK Async",
    triggers: [{ event: "tenant/users.import" }],
  },
  async ({ event, step }: any) => {
    const { tenantId, users } = event.data

    const result = await step.run("import-users-to-database", async () => {
      return await ImportService.importUsers({ tenantId, users })
    })

    await step.run("log-audit", async () => {
      await db.auditLog.create({
        data: {
          tenantId,
          action: "IMPORT_USERS_ASYNC",
          entity: "System",
          userId: "SYSTEM"
        }
      })
    })

    return result
  }
)

// 3. Job Generate Tagihan Massal (Invoices)
export const generateInvoicesJob = inngest.createFunction(
  {
    id: "generate-invoices-job",
    name: "Generate Invoices Async",
    triggers: [{ event: "finance/invoices.generate" }],
  },
  async ({ event, step }: any) => {
    const { data } = event.data // DTO payload for FinanceService.createInvoice

    const result = await step.run("generate-invoices", async () => {
      return await FinanceService.createInvoice(data)
    })

    return result
  }
)

// 4. Job Cron: Cek Tagihan Jatuh Tempo (Berjalan setiap jam 8 pagi)
export const checkOverdueInvoicesJob = inngest.createFunction(
  {
    id: "check-overdue-invoices",
    name: "Check Overdue Invoices (Daily)",
    triggers: [{ cron: "TZ=Asia/Jakarta 0 8 * * *" }]
  },
  async ({ step }: any) => {
    // 1. Cari semua invoice yang overdue dan belum lunas
    const overdueInvoices = await step.run("fetch-overdue-invoices", async () => {
      const today = new Date()
      // Kita anggap overdue jika dueDate < besok (artinya hari ini atau kemarin)
      return await db.invoice.findMany({
        where: {
          status: { in: ["UNPAID", "PARTIAL"] },
          dueDate: { lte: today },
        },
        include: {
          student: {
            include: { parents: true, tenant: true }
          }
        }
      })
    })

    if (overdueInvoices.length === 0) return { message: "No overdue invoices found" }

    // 2. Loop & Kirim Notifikasi (dalam batch untuk menghindari timeout, atau panggil inngest function lain)
    // Di sini kita langsung proses satu per satu via service
    const { sendTemplateNotification } = await import("@/lib/services/notification")
    const { format } = await import("date-fns")
    const { id: localeId } = await import("date-fns/locale")

    let sentCount = 0

    await step.run("send-overdue-notifications", async () => {
      const events: any[] = []
      
      for (const inv of overdueInvoices) {
        const parentUserId = inv.student.parents?.[0]?.userId
        if (parentUserId) {
          events.push({
            name: "tenant/notification.send",
            data: {
              tenantId: inv.tenantId,
              templateId: "invoice_overdue",
              variables: {
                studentName: inv.student.name,
                invoiceTitle: inv.title,
                amountDue: inv.amountDue.toLocaleString("id-ID"),
                dueDate: format(new Date(inv.dueDate), "dd MMM yyyy", { locale: localeId }),
                schoolName: inv.student.tenant?.name || "Sekolah",
              },
              targetUserId: parentUserId,
            }
          })
          sentCount++
        }
      }

      // Batch send to Inngest queue (Max 1000 per request recommended, but Inngest handles chunking)
      if (events.length > 0) {
        const { inngest } = await import("@/lib/inngest/client")
        // Chunk array to 500 per batch to be safe against HTTP payload limits
        const chunkSize = 500
        for (let i = 0; i < events.length; i += chunkSize) {
          const chunk = events.slice(i, i + chunkSize)
          await inngest.send(chunk)
        }
      }
    })

    return { message: `Enqueued ${sentCount} overdue notifications to queue` }
  }
)

// 5. Job Async: Kirim Notifikasi Template
export const sendTemplateNotificationJob = inngest.createFunction(
  {
    id: "send-template-notification-job",
    name: "Send Template Notification Async",
    triggers: [{ event: "tenant/notification.send" }],
    concurrency: {
      limit: 10, // Maksimal 10 notifikasi berjalan bersamaan untuk mencegah rate limit SMTP/WA
    }
  },
  async ({ event, step }: any) => {
    const payload = event.data

    const result = await step.run("process-notification", async () => {
      const { processTemplateNotification } = await import("@/lib/services/notification")
      await processTemplateNotification(payload)
      return { success: true }
    })

    return result
  }
)

// 6. Job Async: Kirim Notifikasi Persetujuan Tenant (Antrean Anti-SPAM)
export const applicationNotificationJob = inngest.createFunction(
  {
    id: "application-notification-job",
    name: "Application Notification Async",
    triggers: [{ event: "superadmin/application.notify" }],
    concurrency: {
      limit: 1, // Hanya boleh mengirim 1 notifikasi persetujuan pada satu waktu
    }
  },
  async ({ event, step }: any) => {
    const { applicationId } = event.data

    // Jeda pengiriman pesan agar tidak dianggap SPAM oleh WhatsApp (Delay 5 detik per antrean)
    await step.sleep("delay-anti-spam", "5s")

    await step.run("send-application-notification", async () => {
      const { sendApplicationNotification } = await import("@/lib/services/application")
      await sendApplicationNotification(applicationId)
    })
    
    // Bersihkan password sementara
    await step.run("clear-temp-password", async () => {
      const { db } = await import("@/lib/db")
      await db.tenantApplication.update({
        where: { id: applicationId },
        data: { adminMessage: null },
      }).catch(e => console.error("Failed to clear temp password", e))
    })

    return { success: true }
  }
)

// 7. Job Cron: Bersihkan WA Queue Logs yang lebih lama dari 3 hari (agar DB tidak bengkak)
export const cleanupWaQueueLogsJob = inngest.createFunction(
  {
    id: "cleanup-wa-queue-logs",
    name: "Cleanup WA Queue Logs (Daily)",
    triggers: [{ cron: "TZ=Asia/Jakarta 0 2 * * *" }] // Setiap jam 2 pagi
  },
  async ({ step }: any) => {
    const result = await step.run("delete-old-logs", async () => {
      const { db } = await import("@/lib/db")
      const threeDaysAgo = new Date()
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
      
      const res = await db.waQueueLog.deleteMany({
        where: { createdAt: { lt: threeDaysAgo } }
      })
      
      return res.count
    })
    
    return { message: `Deleted ${result} old WA logs.` }
  }
)
