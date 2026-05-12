export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Only run the worker in the Node.js runtime (not Edge)
    const { startWaWorker } = await import('@/lib/services/wa-queue')
    
    // Cegah worker berjalan berkali-kali di mode dev saat hot-reload
    const globalForWorker = globalThis as unknown as { waWorkerStarted: boolean }
    
    if (!globalForWorker.waWorkerStarted) {
      globalForWorker.waWorkerStarted = true
      startWaWorker()
    }
  }
}
