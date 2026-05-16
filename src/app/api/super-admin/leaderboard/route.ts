import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    // Ambil dari TenantScore (sinkron dengan leaderboard-sync cron)
    const leaderboard = await db.tenantScore.findMany({
      where: { totalScore: { gt: 0 } },
      orderBy: { totalScore: "desc" },
      take: 10,
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            address: true,
          }
        }
      }
    })

    // Map ke format yang sama untuk komponen UI
    const result = leaderboard.map(entry => ({
      id: entry.tenant.id,
      name: entry.tenant.name,
      slug: entry.tenant.slug,
      logo: entry.tenant.logo,
      address: entry.tenant.address,
      activity_score: entry.totalScore,
      content_score: entry.contentScore,
      activity_points: entry.activityScore,
      traffic_score: entry.trafficScore,
      rank: entry.rank,
      lastCalculated: entry.lastCalculated,
    }))

    return NextResponse.json(result.slice(0, 7))
  } catch (error) {
    console.error("Failed to fetch leaderboard", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
