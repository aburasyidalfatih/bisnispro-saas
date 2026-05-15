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

    const currentYear = new Date().getFullYear()
    const startOfYear = new Date(currentYear, 0, 1)

    // Ambil semua tenant yang aktif
    const tenants = await db.tenant.findMany({
      where: { isActive: true },
      select: {
        id: true,
        _count: {
          select: {
            posts: { where: { status: "PUBLISHED", deletedAt: null, createdAt: { gte: startOfYear } } },
            staff: { where: { createdAt: { gte: startOfYear } } },
            facilities: { where: { createdAt: { gte: startOfYear } } },
            events: { where: { createdAt: { gte: startOfYear } } },
            achievements: { where: { createdAt: { gte: startOfYear } } },
            internalMessages: { where: { receiverId: null, createdAt: { gte: startOfYear } } }
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
      
      // Aktivitas: pengumuman internal
      const announcementPoints = (tenant._count.internalMessages || 0) * 2
      
      const activityScore = announcementPoints // Login harian belum terhitung di backend
      
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
