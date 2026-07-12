import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"

/**
 * CRON: Proses antrean email (EmailQueueLog) yang gagal atau tertunda.
 * Dijalankan secara periodik via crontab (misal setiap 5 menit).
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { processEmailQueueCron } = await import("@/features/notification/services/notification.service")
    const result = await processEmailQueueCron()
    return NextResponse.json(result)
  } catch (error: any) {
    logger.error("Email Queue Cron error", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
