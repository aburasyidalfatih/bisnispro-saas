import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "",

  // Only initialize if DSN is set
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

  // Session Replay (optional, disable for now to save quota)
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  // Environment
  environment: process.env.NODE_ENV || "development",

  // Filter noise
  ignoreErrors: [
    "ResizeObserver loop",
    "ResizeObserver loop completed with undelivered notifications",
    "Non-Error promise rejection captured",
    "Load failed",
    "Failed to fetch",
    "AbortError",
  ],

  // Release tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION || "dev",
})
