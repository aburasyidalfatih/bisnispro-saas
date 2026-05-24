import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"

export const maxDuration = 120

/**
 * CRON: Weekly AI Ads Analysis
 * Runs every Monday at 08:00 WIB via crontab VPS.
 * Endpoint: GET /api/cron/ads-ai-analysis?key=CRON_SECRET
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const key = searchParams.get("key")
  const authHeader = req.headers.get("authorization")

  // Verify cron auth
  const secret = process.env.CRON_SECRET || "cron-secret-key"
  if (key !== secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    logger.info("Starting weekly AI Ads Analysis...")

    // Call the AI analysis API internally
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const res = await fetch(`${baseUrl}/api/super-admin/meta-ads/ai-analysis`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${secret}`,
      },
    })

    const result = await res.json()

    if (!res.ok) {
      logger.error("Weekly AI Ads Analysis failed", result)
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    logger.info("Weekly AI Ads Analysis completed", {
      date: result.report?.date,
      spend: result.report?.dataSummary?.totalSpend,
    })

    return NextResponse.json({
      success: true,
      message: "AI Ads Analysis berhasil di-generate",
      date: result.report?.date,
    })
  } catch (error: any) {
    logger.error("Cron ads-ai-analysis failed", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
