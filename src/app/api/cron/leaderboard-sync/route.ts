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

    // Ambil semua tenant yang aktif
    const tenants = await db.tenant.findMany({
      where: { isActive: true },
      select: {
        id: true,
        _count: {
          select: {
            posts: { where: { status: "PUBLISHED", deletedAt: null } },
            staff: true,
            facilities: true,
            events: true,
            achievements: true,
            gallery: true // Note: gallery is json in Tenant, but _count won't work on json directly
          }
        },
        gallery: true,
        tenantScore: true
      }
    })

    const scores = []

    for (const tenant of tenants) {
      const postPoints = (tenant._count.posts || 0) * 20
      const staffPoints = (tenant._count.staff || 0) * 10
      const facilityPoints = (tenant._count.facilities || 0) * 15
      const eventPoints = (tenant._count.events || 0) * 15
      const achievementPoints = (tenant._count.achievements || 0) * 20
      
      const galleryItems = Array.isArray(tenant.gallery) ? tenant.gallery.length : 0
      const galleryPoints = galleryItems * 5

      const contentScore = postPoints + staffPoints + facilityPoints + eventPoints + achievementPoints + galleryPoints
      
      // Pertahankan traffic score yang ada, atau mulai dari 0
      const trafficScore = tenant.tenantScore?.trafficScore || 0
      
      const activityScore = 0 // Dapat dihitung dari AuditLog di iterasi selanjutnya
      
      const totalScore = contentScore + trafficScore + activityScore

      scores.push({
        tenantId: tenant.id,
        contentScore,
        trafficScore,
        activityScore,
        totalScore,
      })
    }

    // Sort descending by totalScore
    scores.sort((a, b) => b.totalScore - a.totalScore)

    // Update database dalam transaksi
    const updatePromises = scores.map((score, index) => {
      const rank = index + 1
      return db.tenantScore.upsert({
        where: { tenantId: score.tenantId },
        update: {
          contentScore: score.contentScore,
          activityScore: score.activityScore,
          totalScore: score.totalScore,
          rank: rank,
          lastCalculated: new Date()
        },
        create: {
          tenantId: score.tenantId,
          contentScore: score.contentScore,
          trafficScore: score.trafficScore,
          activityScore: score.activityScore,
          totalScore: score.totalScore,
          rank: rank,
          lastCalculated: new Date()
        }
      })
    })

    // Eksekusi batch
    await db.$transaction(updatePromises)

    return NextResponse.json({
      message: "Leaderboard synchronized successfully",
      processedCount: tenants.length
    })

  } catch (error: any) {
    console.error("Leaderboard Sync Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
