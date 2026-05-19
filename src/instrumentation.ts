export async function register() {
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
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.DISABLE_WORKER !== 'true') {
    // Jalankan BullMQ Worker otomatis di dalam proses Node.js saat server Next.js menyala!
    // Ini menghilangkan kebutuhan akan container/service terpisah di VPS, kecuali DISABLE_WORKER diatur.
    await import('./worker')
  }
}
