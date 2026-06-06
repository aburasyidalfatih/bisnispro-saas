import { db } from "@/lib/db"

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
