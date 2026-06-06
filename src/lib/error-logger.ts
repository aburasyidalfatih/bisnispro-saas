import { db } from "@/lib/db"
import { enqueueWhatsApp } from "@/features/notification/services/wa-queue.service"

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
export async function logAppError(
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
      // Notify Developer via WhatsApp
      const waNumber = process.env.DEVELOPER_WA_NUMBER
      if (waNumber) {
        try {
          const text = `🚨 *SCHOOLPRO SYSTEM BUG* 🚨\n\n*Message:* ${message}\n*Path:* ${options.path || "-"}\n*Time:* ${new Date().toLocaleString("id-ID")}`
          // Queue the WhatsApp message without blocking the main thread significantly
          enqueueWhatsApp(waNumber, text, options.tenantId || null).catch(err => {
            console.error("Failed to queue WA alert for error", err)
          })
        } catch (e) {
          console.error("Failed to queue WA alert for error", e)
        }
      }
    }
  } catch (e) {
    console.error("[ERROR_LOGGER_FAILED]", e)
  }
}

/**
 * Use this for system crashes, database failures, unhandled exceptions.
 */
export const logSystemError = (message: string, error?: any, options?: LogOptions) => 
  logAppError("SYSTEM_BUG", message, error, options)

/**
 * Use this for bad requests, validation errors, wrong passwords, etc.
 */
export const logUserError = (message: string, error?: any, options?: LogOptions) => 
  logAppError("USER_ERROR", message, error, options)
