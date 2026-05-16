import { db } from "@/lib/db"

/**
 * Tambah poin gamifikasi langsung ke database.
 * Fallback dari Inngest (yang belum dikonfigurasi).
 * 
 * Fungsi ini aman dipanggil dari mana saja — jika tenantScore belum ada,
 * akan di-create otomatis; jika sudah ada, akan di-increment.
 */
export async function addGamificationPoints({
  tenantId,
  userId,
  type,
  points,
  description,
}: {
  tenantId: string
  userId?: string
  type: string
  points: number
  description?: string
}) {
  try {
    // Upsert: create jika belum ada, increment jika sudah ada
    await db.tenantScore.upsert({
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
  } catch (error) {
    // Jangan lempar error agar tidak mengganggu flow utama
    console.error("Failed to add gamification points:", error)
  }
}
