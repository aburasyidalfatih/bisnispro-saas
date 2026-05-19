import { db } from "@/lib/db"
import { gamificationQueue } from "@/lib/queue"

export type GamificationPayload = {
  tenantId: string
  userId?: string
  type: string
  points: number
  description?: string
}

/**
 * Enqueue poin gamifikasi ke BullMQ agar diproses di background.
 * Ini mencegah server dari query blocker.
 */
export async function addGamificationPoints(payload: GamificationPayload) {
  try {
    const job = await gamificationQueue.add("add-points", payload)
    return { success: true, jobId: job.id }
  } catch (err) {
    console.error("Failed to enqueue gamification points:", err)
    return { success: false, error: "Gagal memasukkan poin gamifikasi ke antrian" }
  }
}

/**
 * Eksekusi aktual oleh BullMQ Worker.
 */
export async function processGamificationPoints(payload: GamificationPayload) {
  try {
    const { tenantId, userId, type, points, description } = payload
    
    // Upsert: create jika belum ada, increment jika sudah ada
    const newScore = await db.tenantScore.upsert({
      where: { tenantId },
      update: {
        activityScore: { increment: points },
        totalScore: { increment: points },
      },
      create: {
        tenantId,
        contentScore: 0,
        trafficScore: 0,
        activityScore: points,
        totalScore: points,
        rank: 0,
      },
    })

    // Buat notifikasi jika userId tersedia
    if (userId) {
      await db.notification.create({
        data: {
          tenantId,
          userId,
          title: `+${points} Poin Pencapaian`,
          message: description || `Anda mendapatkan poin dari aktivitas: ${type}`,
          type: "success",
          channel: "inapp",
        },
      })
    }

    return { 
      success: true, 
      data: { 
        totalScore: newScore.totalScore,
        activityScore: newScore.activityScore
      } 
    }
  } catch (error) {
    console.error("Failed to add gamification points:", error)
    return { success: false, error: "Gagal memproses poin gamifikasi ke database" }
  }
}
