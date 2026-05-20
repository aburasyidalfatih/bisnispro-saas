import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "",

  // Only initialize if DSN is set
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring for Edge Runtime (middleware)
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Environment
  environment: process.env.NODE_ENV || "development",
})
