import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getRedis } from "@/lib/redis"

export async function GET() {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    // [REDIS ZSET] Try Redis first for instant Top 10
    const redis = getRedis()
    if (redis) {
      try {
        const results = await redis.zrevrange("leaderboard:global", 0, 9, "WITHSCORES")
        
        if (results && results.length >= 2) {
          const tenantIds: string[] = []
          const scoreMap: Record<string, number> = {}
          
          for (let i = 0; i < results.length; i += 2) {
            tenantIds.push(results[i])
            scoreMap[results[i]] = parseInt(results[i + 1], 10)
          }

          const tenants = await db.tenant.findMany({
            where: { id: { in: tenantIds } },
            select: { id: true, name: true, slug: true, logo: true, address: true }
          })
          const tenantMap = Object.fromEntries(tenants.map(t => [t.id, t]))

          const detailedScores = await db.tenantScore.findMany({
            where: { tenantId: { in: tenantIds } },
            select: { tenantId: true, contentScore: true, trafficScore: true, activityScore: true, rank: true, lastCalculated: true }
          })
          const detailMap = Object.fromEntries(detailedScores.map(s => [s.tenantId, s]))

          const result = tenantIds
            .filter(id => tenantMap[id]) // Filter out orphaned Redis entries
            .map((id, index) => ({
            id,
            name: tenantMap[id]?.name || "Unknown",
            slug: tenantMap[id]?.slug || "",
            logo: tenantMap[id]?.logo || null,
            address: tenantMap[id]?.address || null,
            activity_score: scoreMap[id],
            content_score: detailMap[id]?.contentScore || 0,
            activity_points: detailMap[id]?.activityScore || 0,
            traffic_score: detailMap[id]?.trafficScore || 0,
            rank: index + 1,
            lastCalculated: detailMap[id]?.lastCalculated || null,
          }))

          return NextResponse.json(result.slice(0, 7))
        }
      } catch (redisError) {
        console.error("[SUPER-ADMIN LEADERBOARD] Redis ZSET read failed, falling back to DB", redisError)
      }
    }

    // Fallback: Ambil dari TenantScore (sinkron dengan leaderboard-sync cron)
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
