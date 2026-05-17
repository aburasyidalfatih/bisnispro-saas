import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/**
 * Cron handler: kirim pengingat langganan PRO yang akan habis
 * Mengirim notifikasi pada H-30, H-7, H-3, H-1 sebelum expired
 * 
 * Panggil via: GET /api/cron/subscription-reminder?key=SECRET
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const key = searchParams.get("key")
  if (key !== (process.env.CRON_SECRET || "cron-secret-key")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { notifySubscriptionExpiring } = await import("@/lib/services/billing-notifications")
    const result = await notifySubscriptionExpiring()

    logger.info("Cron subscription-reminder completed", result)

    return NextResponse.json({
      message: `Processed ${result.processed} tenants, sent ${result.sent} reminders`,
      ...result
    })
  } catch (error) {
    logger.error("Cron subscription-reminder failed", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
