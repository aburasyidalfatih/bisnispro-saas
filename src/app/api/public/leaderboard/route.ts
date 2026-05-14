import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const leaderboard = await db.tenantScore.findMany({
      take: 100,
      orderBy: { totalScore: "desc" },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            logo: true,
            slug: true
          }
        }
      }
    })

    return NextResponse.json(leaderboard)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
