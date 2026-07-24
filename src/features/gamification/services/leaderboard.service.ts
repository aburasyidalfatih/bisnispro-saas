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
          teamMembers: { where: { createdAt: { gte: startOfYear } } },
          offices: { where: { createdAt: { gte: startOfYear } } },
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
    const staffCount = Math.min(tenant._count.teamMembers || 0, 50)
    const facilityCount = Math.min(tenant._count.offices || 0, 50)
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
    
    // Gabungkan poin pengumuman ke dalam konten agar tidak menimpa activityScore (yang diisi oleh fitur Login Harian)
    const finalContentScore = contentScore + announcementPoints
    
    // Ambil activityScore yang sudah ada di DB (yang berisi poin Login Harian, Share Sosmed, dll)
    const activityScore = tenant.tenantScore?.activityScore || 0

    const totalScore = finalContentScore + trafficScore + activityScore

    scores.push({
      tenantId: tenant.id,
      tenantName: tenant.name,
      contentScore: finalContentScore,
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
        trafficScore: score.trafficScore,
        // Kita TIDAK menimpa activityScore di update, agar poin login harian tidak ter-reset
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

  // BATCH TRANSACTIONS: process in chunks of 100 to avoid DB locks
  const chunkSize = 100
  for (let i = 0; i < updatePromises.length; i += chunkSize) {
    const chunk = updatePromises.slice(i, i + chunkSize)
    await db.$transaction(chunk)
  }

  // ============================================================
  // Step 4: Deteksi perubahan peringkat & kirim notifikasi
  // ============================================================
  const allAffectedTenantIds = scores
    .filter((s, i) => {
      const old = oldRankMap[s.tenantId]
      return old && old.rank > 0 && old.rank !== i + 1
    })
    .map((s) => s.tenantId)

  let adminMap: Record<string, string[]> = {}
  if (allAffectedTenantIds.length > 0) {
    const allAdmins = await db.tenantUser.findMany({
      where: { tenantId: { in: allAffectedTenantIds }, role: { in: ["owner", "admin"] } },
      select: { tenantId: true, userId: true }
    })
    
    adminMap = allAdmins.reduce((acc, curr) => {
      if (!acc[curr.tenantId]) acc[curr.tenantId] = []
      acc[curr.tenantId].push(curr.userId)
      return acc
    }, {} as Record<string, string[]>)
  }

  const allNotifications = []

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
        title = `🏆 WOW! Perusahaan Anda masuk Top 3!`
        message = `Selamat! Website ${score.tenantName} naik dari peringkat #${oldRank} ke #${newRank} dari ${totalParticipants} perusahaan! Terus pertahankan!`
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
      const adminUserIds = adminMap[score.tenantId] || []
      if (adminUserIds.length > 0) {
        for (const userId of adminUserIds) {
          allNotifications.push({
            tenantId: score.tenantId,
            userId: userId,
            title,
            message,
            type,
            channel: "inapp",
          })

          // Kirim via SSE realtime
          publishEvent(`user-notif:${userId}`, {
            type: "NEW_NOTIFICATION",
            notification: { title, message, type, isRead: false },
          }).catch(() => {})
        }
      }
    } catch (e) {
      console.error(`[LEADERBOARD] Failed to notify tenant ${score.tenantId}`, e)
    }
  }

  if (allNotifications.length > 0) {
    try {
      // Chunk creation to avoid large payloads
      const chunkSize = 1000
      for (let i = 0; i < allNotifications.length; i += chunkSize) {
        await db.notification.createMany({
          data: allNotifications.slice(i, i + chunkSize)
        })
      }
    } catch (e) {
      console.error("[LEADERBOARD] Failed to createMany notifications", e)
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
