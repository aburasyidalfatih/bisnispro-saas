export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateProductionEnv } = await import("./lib/env")
    validateProductionEnv()
  }

  // ============================================================
  // SENTRY: Initialize APM & Error Tracking
  // ============================================================
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config")
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config")
  }

  // ============================================================
  // BULLMQ WORKER: Background Job Processing
  // ============================================================
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.ENABLE_EMBEDDED_WORKER === 'true') {
    // Embedded worker is opt-in. Production should normally run the worker as a separate process/container.
    await import('./worker')
  }
}
