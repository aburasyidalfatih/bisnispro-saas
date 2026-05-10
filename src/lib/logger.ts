/**
 * Structured logger for production use.
 * Outputs JSON in production, pretty-prints in development.
 */

type LogLevel = "debug" | "info" | "warn" | "error"

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  [key: string]: unknown
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const MIN_LEVEL = process.env.NODE_ENV === "production" ? "info" : "debug"
const IS_PROD = process.env.NODE_ENV === "production"

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LEVEL]
}

function formatEntry(level: LogLevel, message: string, meta?: Record<string, unknown>): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  }
}

function output(entry: LogEntry) {
  const str = IS_PROD ? JSON.stringify(entry) : `[${entry.timestamp}] ${entry.level.toUpperCase()} ${entry.message}${Object.keys(entry).length > 3 ? " " + JSON.stringify(Object.fromEntries(Object.entries(entry).filter(([k]) => !["level", "message", "timestamp"].includes(k)))) : ""}`

  switch (entry.level) {
    case "error":
      console.error(str)
      break
    case "warn":
      console.warn(str)
      break
    default:
      console.log(str)
  }
}

export const logger = {
  debug(message: string, meta?: Record<string, unknown>) {
    if (shouldLog("debug")) output(formatEntry("debug", message, meta))
  },
  info(message: string, meta?: Record<string, unknown>) {
    if (shouldLog("info")) output(formatEntry("info", message, meta))
  },
  warn(message: string, meta?: Record<string, unknown>) {
    if (shouldLog("warn")) output(formatEntry("warn", message, meta))
  },
  error(message: string, error?: unknown, meta?: Record<string, unknown>) {
    if (!shouldLog("error")) return
    const errorMeta: Record<string, unknown> = { ...meta }
    if (error instanceof Error) {
      errorMeta.error = error.message
      errorMeta.stack = error.stack
    } else if (error) {
      errorMeta.error = String(error)
    }
    output(formatEntry("error", message, errorMeta))

    // ENTERPRISE TELEMETRY (Fase 1)
    // TODO: Integrate @sentry/nextjs or Datadog tracing here for production
    if (IS_PROD && process.env.SENTRY_DSN) {
      // Sentry.captureException(error || new Error(message), { extra: errorMeta });
    }
  },
}
