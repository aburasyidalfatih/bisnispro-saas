import { db, withTenant } from "@/lib/db"

// ==========================================
// Query: List Notifications (In-App)
// ==========================================
export async function listNotifications(userId: string, page = 1, limit = 20) {
  const where = { userId, channel: "inapp" }
  const [data, total] = await Promise.all([
    db.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.notification.count({ where }),
  ])

  return { data, total, page, totalPages: Math.ceil(total / limit) }
}

// ==========================================
// Mutation: Mark Notification as Read
// ==========================================
export async function markNotificationRead(userId: string, id?: string, all?: boolean) {
  if (all) {
    await db.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    })
  } else if (id) {
    await db.notification.updateMany({ 
      where: { id, userId }, 
      data: { isRead: true } 
    })
  }
  return { message: "OK" }
}

// ==========================================
// Query: Notification Preferences
// ==========================================
export async function getNotificationPreferences(userId: string) {
  return db.notificationSetting.findMany({
    where: { userId },
  })
}

// ==========================================
// Mutation: Update Notification Preference
// ==========================================
export async function updateNotificationPreference(userId: string, channel: string, enabled: boolean) {
  await db.notificationSetting.upsert({
    where: { userId_channel: { userId, channel } },
    update: { enabled },
    create: { userId, channel, enabled },
  })
  return { message: "Preferensi disimpan" }
}

// ==========================================
// Query: Internal Messages (Inbox/Sent)
// ==========================================
export async function listMessages(tenantId: string, userId: string, isSuperAdmin: boolean, isSent: boolean) {
  const tenantDb = withTenant(tenantId)
  let isAdminRole = isSuperAdmin
  if (!isAdminRole) {
    const tu = await tenantDb.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
    })
    isAdminRole = tu?.role === "owner" || tu?.role === "admin"
  }

  if (isSent) {
    return tenantDb.internalMessage.findMany({
      where: { tenantId, senderId: userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        receiver: { select: { name: true, email: true, avatar: true } }
      }
    })
  }

  let whereClause: any = { tenantId, receiverId: userId }
  if (isAdminRole) {
    whereClause = {
      tenantId,
      OR: [
        { receiverId: userId },
        { receiverId: null }
      ]
    }
  }

  return tenantDb.internalMessage.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      sender: { select: { name: true, email: true, avatar: true } }
    }
  })
}

// ==========================================
// Mutation: Send Internal Message
// ==========================================
export async function sendMessage(tenantId: string, senderId: string, receiverId: string | null, subject: string | null, body: string) {
  const tenantDb = withTenant(tenantId)
  
  const msg = await tenantDb.internalMessage.create({
    data: {
      tenantId,
      senderId,
      receiverId: receiverId || null,
      subject,
      body
    }
  })

  // Audit trail
  await tenantDb.auditLog.create({
    data: {
      tenantId,
      action: "INTERNAL_MESSAGE_SENT",
      entity: "Notification",
      newData: { messageId: msg.id }
    }
  }).catch(() => {})

  return msg
}

// ==========================================
// Query: Unread Message Count
// ==========================================
export async function getUnreadCount(tenantId: string, userId: string, isSuperAdmin: boolean) {
  const tenantDb = withTenant(tenantId)
  let isAdminRole = isSuperAdmin
  if (!isAdminRole) {
    const tu = await tenantDb.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
    })
    isAdminRole = tu?.role === "owner" || tu?.role === "admin"
  }

  let internalWhere: any = { tenantId, receiverId: userId, isRead: false }
  if (isAdminRole) {
    internalWhere = {
      tenantId,
      isRead: false,
      OR: [
        { receiverId: userId },
        { receiverId: null }
      ]
    }
  }

  const internalCount = await tenantDb.internalMessage.count({ where: internalWhere })

  let contactCount = 0
  if (isAdminRole) {
    contactCount = await tenantDb.contactSubmission.count({ where: { tenantId, isRead: false } })
  }

  return { unread: internalCount + contactCount, internalCount, contactCount }
}
