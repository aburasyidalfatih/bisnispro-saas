import { db } from "@/lib/db"
import { enqueueWhatsApp } from "@/features/notification/services/wa-queue.service"
import { emailQueue } from "@/lib/queue"

type ErrorCategory = "SYSTEM_BUG" | "USER_ERROR"

interface LogOptions {
  tenantId?: string
  userId?: string
  path?: string
  method?: string
  metadata?: any
}

/**
 * Logs an error to the database.
 */
async function logAppError(
  category: ErrorCategory,
  message: string,
  error: any = null,
  options: LogOptions = {}
) {
  try {
    let stack = null
    if (error instanceof Error) {
      stack = error.stack
      if (!message) message = error.message
    }

    await db.errorLog.create({
      data: {
        category,
        message,
        stack: stack ? String(stack) : null,
        path: options.path || null,
        method: options.method || null,
        tenantId: options.tenantId || null,
        userId: options.userId || null,
        metadata: options.metadata || {},
      }
    })

    if (category === "SYSTEM_BUG") {
      try {
        // Fetch all Super Admins
        const superAdmins = await db.user.findMany({
          where: { isSuperAdmin: true, isActive: true },
          select: { phone: true, email: true }
        })
        
        const text = `🚨 *SCHOOLPRO SYSTEM BUG* 🚨\n\n*Message:* ${message}\n*Path:* ${options.path || "-"}\n*Time:* ${new Date().toLocaleString("id-ID")}`
        const emailBody = `<h3>🚨 SCHOOLPRO SYSTEM BUG</h3><p><strong>Message:</strong> ${message}</p><p><strong>Path:</strong> ${options.path || "-"}</p><p><strong>Time:</strong> ${new Date().toLocaleString("id-ID")}</p>`

        for (const admin of superAdmins) {
          if (admin.phone) {
            enqueueWhatsApp(admin.phone, text, options.tenantId || null).catch(err => {
              console.error("Failed to queue WA alert for error", err)
            })
          }
          if (admin.email) {
            emailQueue.add("system-bug-alert", {
              to: admin.email,
              subject: "🚨 SchoolPro System Bug Alert",
              htmlContent: emailBody
            }).catch(err => {
              console.error("Failed to queue Email alert for error", err)
            })
          }
        }
      } catch (e) {
        console.error("Failed to queue alerts for error", e)
      }
    }
  } catch (e) {
    console.error("[ERROR_LOGGER_FAILED]", e)
  }
}

/**
 * Use this for bad requests, validation errors, wrong passwords, etc.
 */
export const logUserError = (message: string, error?: any, options?: LogOptions) => 
  logAppError("USER_ERROR", message, error, options)
