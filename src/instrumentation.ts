export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Jalankan BullMQ Worker otomatis di dalam proses Node.js saat server Next.js menyala!
    // Ini menghilangkan kebutuhan akan container/service terpisah di VPS.
    await import('./worker')
  }
}
