import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

interface SuperAdminNotificationPayload {
  title: string
  message: string
  type?: "info" | "success" | "warning" | "error"
  metadata?: any
}

/**
 * Mengirimkan notifikasi ke semua user yang memiliki peran Super Admin.
 */
export async function notifyAllSuperAdmins(payload: SuperAdminNotificationPayload) {
  try {
    // 1. Ambil semua ID Super Admin
    const superAdmins = await db.user.findMany({
      where: { isSuperAdmin: true },
      select: { id: true },
    })

    if (superAdmins.length === 0) {
      return
    }

    // 2. Format payload untuk Prisma createMany
    const notifications = superAdmins.map((admin) => ({
      userId: admin.id,
      title: payload.title,
      message: payload.message,
      type: payload.type || "info",
      channel: "inapp",
      ...(payload.metadata ? { metadata: payload.metadata } : {}),
    }))

    // 3. Masukkan ke database
    await db.notification.createMany({
      data: notifications,
    })

    logger.info(`Terkirim notifikasi ke ${superAdmins.length} Super Admin: ${payload.title}`)
  } catch (error) {
    logger.error("Gagal mengirim notifikasi ke Super Admin:", error)
  }
}
