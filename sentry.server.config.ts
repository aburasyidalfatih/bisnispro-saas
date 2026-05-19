import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "",

  // Only initialize if DSN is set
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring — sample 20% of server transactions in prod
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

  // Environment
  environment: process.env.NODE_ENV || "development",

  // Release tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION || "dev",

  // Spotlight for local development
  spotlight: process.env.NODE_ENV === "development",
})
