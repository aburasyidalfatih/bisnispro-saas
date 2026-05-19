import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const maxDuration = 60 // Allow longer execution time

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key")

    if (key !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { processLeaderboardSync } = await import("@/features/gamification/services/leaderboard.service")
    const result = await processLeaderboardSync()
    return NextResponse.json(result)

  } catch (error: any) {
    console.error("Leaderboard Sync Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
