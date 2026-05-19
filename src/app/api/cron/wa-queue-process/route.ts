import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { getWaConfig } from "@/features/notification/services/notification.service"

/**
 * CRON: Proses ulang pesan WA yang stuck di status PENDING.
 * Dijalankan setiap 5 menit via crontab VPS.
 * TANPA delay per-pesan (delay hanya untuk real-time send, bukan retry).
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { processWaQueueCron } = await import("@/features/notification/services/wa-queue.service")
    const result = await processWaQueueCron()
    return NextResponse.json(result)
  } catch (error: any) {
    logger.error("WA Queue Cron error", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


