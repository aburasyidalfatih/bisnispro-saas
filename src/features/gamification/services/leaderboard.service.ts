import { db } from "@/lib/db"
import { getRedis } from "@/lib/redis"
import { publishEvent } from "@/lib/realtime"

export async function processLeaderboardSync() {
  const currentYear = new Date().getFullYear()
  const startOfYear = new Date(currentYear, 0, 1)

  // ============================================================
  // Step 1: Ambil peringkat LAMA sebelum recalculation
  // ============================================================
  const oldRanks = await db.tenantScore.findMany({
    select: { tenantId: true, rank: true, totalScore: true }
  })
  const oldRankMap = Object.fromEntries(oldRanks.map(r => [r.tenantId, { rank: r.rank, totalScore: r.totalScore }]))

  const postPointsAgg = await db.post.groupBy({
    by: ['tenantId'],
    _sum: { points: true },
    where: { status: "PUBLISHED", deletedAt: null, createdAt: { gte: startOfYear }, isEligibleForPoints: true }
  });
  const postPointsMap = Object.fromEntries(postPointsAgg.map(p => [p.tenantId, p._sum.points || 0]));

  // Ambil data Traffic (Unique Visitors per Tenant berdasarkan ipHash atau sessionId)
  const trafficAgg = await db.$queryRaw<Array<{ tenantId: string, uniqueVisits: number | bigint }>>`
    SELECT "tenantId", COUNT(DISTINCT COALESCE("ipHash", "sessionId")) as "uniqueVisits"
    FROM "page_views"
    WHERE "createdAt" >= ${startOfYear}
    GROUP BY "tenantId"
  `;
  const trafficMap = Object.fromEntries(trafficAgg.map(t => [t.tenantId, Number(t.uniqueVisits) || 0]));

  const tenants = await db.tenant.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      logo: true,
      heroImage: true,
      about: true,
      tagline: true,
      domain: true,
      _count: {
        select: {
          posts: { where: { status: "PUBLISHED", deletedAt: null, createdAt: { gte: startOfYear }, isEligibleForPoints: true } },
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
    // ANTI-SPAM CAPS: Maksimal poin dari artikel/berita dibatasi 7500 poin per tahun (Asumsi 30 artikel/bulan @ 20 poin)
    const postPoints = Math.min(postPointsMap[tenant.id] || 0, 7500)
    
    // ANTI-SPAM CAPS: Maksimal dihitung 50 entitas untuk mencegah spamming
    const staffCount = Math.min(tenant._count.staff || 0, 50)
    const facilityCount = Math.min(tenant._count.facilities || 0, 50)
    const eventCount = Math.min(tenant._count.events || 0, 50)
    const achievementCount = Math.min(tenant._count.achievements || 0, 50)

    const staffPoints = staffCount * 10
    const facilityPoints = facilityCount * 15
    const eventPoints = eventCount * 15
    const achievementPoints = achievementCount * 20
    
    const galleryItems = Array.isArray(tenant.gallery) ? tenant.gallery.length : 0
    const galleryPoints = Math.min(galleryItems, 100) * 5 // Max 100 foto galeri

    // Profile Completion Bonus
    let profileBonus = 0
    if (tenant.logo && tenant.heroImage && tenant.about && tenant.tagline) {
      profileBonus = 1000
    }

    // Custom Domain Bonus
    const customDomainBonus = tenant.domain ? 2000 : 0

    const contentScore = postPoints + staffPoints + facilityPoints + eventPoints + achievementPoints + galleryPoints + profileBonus + customDomainBonus
    
    // Traffic Score berdasarkan Unique Visitors (1 Poin per Pengunjung Unik)
    const trafficScore = (trafficMap[tenant.id] || 0) * 1
    
    // Aktivitas: pengumuman internal dibatasi maksimal 250 pesan (500 poin maksimal)
    const internalMessagesCount = Math.min(tenant._count.internalMessages || 0, 250)
    const announcementPoints = internalMessagesCount * 2
    
    const activityScore = announcementPoints

    const totalScore = contentScore + trafficScore + activityScore

    scores.push({
      tenantId: tenant.id,
      tenantName: tenant.name,
      contentScore,
      trafficScore,
      activityScore,
      totalScore,
    })
  }

  // Sort descending by totalScore
  scores.sort((a, b) => b.totalScore - a.totalScore)
  const totalParticipants = scores.length

  // ============================================================
  // Step 3: Update database
  // ============================================================
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

  await db.$transaction(updatePromises)

  // ============================================================
  // Step 4: Deteksi perubahan peringkat & kirim notifikasi
  // ============================================================
  for (let i = 0; i < scores.length; i++) {
    const newRank = i + 1
    const score = scores[i]
    const old = oldRankMap[score.tenantId]
    
    // Skip jika tenant baru (belum pernah punya ranking)
    if (!old || old.rank === 0) continue
    
    const oldRank = old.rank
    if (oldRank === newRank) continue // Tidak berubah

    let title = ""
    let message = ""
    let type = "info"

    if (newRank < oldRank) {
      // 📈 NAIK PERINGKAT
      if (newRank <= 3) {
        title = `🏆 WOW! Sekolah Anda masuk Top 3!`
        message = `Selamat! Website ${score.tenantName} naik dari peringkat #${oldRank} ke #${newRank} dari ${totalParticipants} sekolah! Terus pertahankan!`
        type = "success"
      } else {
        title = `📈 Peringkat Naik ke #${newRank}!`
        message = `Selamat! Website ${score.tenantName} naik dari peringkat #${oldRank} ke #${newRank}. Bagikan konten ke sosial media untuk naik lebih tinggi!`
        type = "success"
      }
    } else {
      // 📉 TURUN PERINGKAT
      const diff = newRank - oldRank
      title = `📉 Peringkat turun ke #${newRank}`
      message = `Peringkat website ${score.tenantName} turun ${diff} posisi (dari #${oldRank} ke #${newRank}). Yuk, buat postingan baru dan bagikan ke sosmed untuk merebut kembali posisi!`
      type = "warning"
    }

    // Buat notifikasi untuk semua admin/owner tenant ini
    try {
      const admins = await db.tenantUser.findMany({
        where: { tenantId: score.tenantId, role: { in: ["owner", "admin"] } },
        select: { userId: true }
      })

      for (const admin of admins) {
        await db.notification.create({
          data: {
            tenantId: score.tenantId,
            userId: admin.userId,
            title,
            message,
            type,
            channel: "inapp",
          }
        })

        // Kirim via SSE realtime
        publishEvent(`user-notif:${admin.userId}`, {
          type: "NEW_NOTIFICATION",
          notification: { title, message, type, isRead: false },
        }).catch(() => {})
      }
    } catch (e) {
      console.error(`[LEADERBOARD] Failed to notify tenant ${score.tenantId}`, e)
    }
  }

  // ============================================================
  // Step 5: Sync Redis ZSET
  // ============================================================
  try {
    const redis = getRedis()
    if (redis) {
      const pipeline = redis.pipeline()
      pipeline.del("leaderboard:global")
      for (const score of scores) {
        pipeline.zadd("leaderboard:global", score.totalScore, score.tenantId)
      }
      await pipeline.exec()
    }
  } catch (e) {
    console.error("[LEADERBOARD] Failed to sync Redis ZSET", e)
  }

  return {
    message: "Leaderboard synchronized successfully",
    processedCount: tenants.length
  }
}
