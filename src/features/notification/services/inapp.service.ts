import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

export async function createInAppNotification(params: {
  tenantId?: string
  userId: string
  title: string
  message: string
  type?: string
  metadata?: any
}) {
  return db.notification.create({
    data: {
      tenantId: params.tenantId,
      userId: params.userId,
      title: params.title,
      message: params.message,
      type: params.type || "info",
      channel: "inapp",
      metadata: params.metadata || null,
    },
  })
}

export async function createNotification(data: { userId: string, title: string, message: string, type?: string }) {
  // Stub for creating system notification
  logger.info("createNotification stub called", data)
}
