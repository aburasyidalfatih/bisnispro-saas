import { logger } from "@/lib/logger"
import * as Sentry from "@sentry/nextjs"

/**
 * Error Reporter — Enterprise error tracking layer.
 *
 * - Development: logs via structured logger
 * - Production: sends to Sentry + structured logger
 *
 * Usage:
 *   import { reportError } from "@/lib/error-reporter"
 *   reportError(new Error("Something failed"), { userId: "...", action: "..." })
 */

interface ErrorContext {
  userId?: string
  tenantId?: string
  action?: string
  [key: string]: unknown
}

/**
 * Report an error to Sentry + structured logger.
 * Always logs locally; sends to Sentry in production when DSN is configured.
 */
export function reportError(error: Error | unknown, context?: ErrorContext) {
  const err = error instanceof Error ? error : new Error(String(error))

  // Always log locally
  logger.error(err.message, err, context)

  // Send to Sentry if configured
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.withScope((scope) => {
      if (context?.userId) scope.setUser({ id: context.userId })
      if (context?.tenantId) scope.setTag("tenantId", context.tenantId)
      if (context?.action) scope.setTag("action", context.action)
      if (context) {
        scope.setExtras(context as Record<string, unknown>)
      }
      Sentry.captureException(err)
    })
  }
}

/**
 * Report a warning (non-fatal issue that should be tracked).
 */
export function reportWarning(message: string, context?: ErrorContext) {
  logger.warn(message, context)

  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.withScope((scope) => {
      scope.setLevel("warning")
      if (context?.tenantId) scope.setTag("tenantId", context.tenantId)
      if (context) scope.setExtras(context as Record<string, unknown>)
      Sentry.captureMessage(message)
    })
  }
}
