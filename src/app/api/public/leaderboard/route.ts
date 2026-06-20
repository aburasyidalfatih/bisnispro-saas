import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getRedis } from "@/lib/redis"

export async function GET(req: Request) {
  try {
    // [REDIS ZSET] Try to get leaderboard from Redis first (instant, O(log N))
    const redis = getRedis()
    if (redis) {
      try {
        const results = await redis.zrevrange("leaderboard:global", 0, -1, "WITHSCORES")
        
        // results = [tenantId1, score1, tenantId2, score2, ...]
        if (results && results.length >= 2) {
          const tenantIds: string[] = []
          const scoreMap: Record<string, number> = {}
          
          for (let i = 0; i < results.length; i += 2) {
            const tenantId = results[i]
            const score = parseInt(results[i + 1], 10)
            tenantIds.push(tenantId)
            scoreMap[tenantId] = score
          }

          // Fetch tenant details from DB (just names/logos, very light query)
          const tenants = await db.tenant.findMany({
            where: { id: { in: tenantIds } },
            select: { id: true, name: true, logo: true, slug: true }
          })

          const tenantMap = Object.fromEntries(tenants.map(t => [t.id, t]))

          // Also get detailed scores from tenantScore for breakdown
          const detailedScores = await db.tenantScore.findMany({
            where: { tenantId: { in: tenantIds } },
            select: { tenantId: true, contentScore: true, trafficScore: true, activityScore: true, rank: true, lastCalculated: true }
          })
          const detailMap = Object.fromEntries(detailedScores.map(s => [s.tenantId, s]))

          const leaderboard = tenantIds
            .filter(id => tenantMap[id]) // Filter out tenants that no longer exist in DB
            .map((id, index) => ({
              id: detailMap[id]?.tenantId || id,
              tenantId: id,
              totalScore: scoreMap[id],
              contentScore: detailMap[id]?.contentScore || 0,
              trafficScore: detailMap[id]?.trafficScore || 0,
              activityScore: detailMap[id]?.activityScore || 0,
              rank: index + 1,
              lastCalculated: detailMap[id]?.lastCalculated || null,
              tenant: tenantMap[id]
            }))

          return NextResponse.json(leaderboard)
        }
      } catch (redisError) {
        console.error("[LEADERBOARD] Redis ZSET read failed, falling back to DB", redisError)
      }
    }

    // Fallback: PostgreSQL query (lebih lambat, tapi selalu akurat)
    const leaderboard = await db.tenantScore.findMany({
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
