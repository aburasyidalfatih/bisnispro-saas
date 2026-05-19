import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { emailQueue } from "@/lib/queue"
import { startOfDay } from "date-fns"

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes timeout for cron job

export async function GET(req: Request) {
  // Verifikasi keamanan CRON Job
  const authHeader = req.headers.get('authorization')
  if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { processDailyDrip } = await import("@/features/notification/services/drip-campaign.service")
    const result = await processDailyDrip()
    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Daily Drip Cron Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
