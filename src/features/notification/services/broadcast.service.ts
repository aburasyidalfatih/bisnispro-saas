import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { waQueue } from "@/lib/queue"
import { getWaConfig } from "@/features/notification/services/notification.service"
import { getWaQueueDelays } from "@/features/notification/services/wa-queue.service"

// ==========================================
// Query: Resolve Broadcast Recipients
// ==========================================
export async function resolveBroadcastRecipients(tenantId: string, target: string) {
  const targetRoles: string[] = []
  if (target === "all_gtk") targetRoles.push("staf")
  if (target === "all_parents") targetRoles.push("orangtua")
  if (target === "all") targetRoles.push("staf", "orangtua")

  if (targetRoles.length === 0) {
    throw new Error("Target penerima tidak valid")
  }

  const tenantUsers = await db.tenantUser.findMany({
    where: { tenantId, role: { in: targetRoles } },
    include: { user: { select: { name: true, phone: true } } },
  })

  const recipients = tenantUsers
    .map((tu) => ({ name: tu.user.name, phone: tu.user.phone }))
    .filter((r) => r.phone)

  // Remove duplicates by phone
  const unique = Array.from(new Map(recipients.map((r) => [r.phone, r])).values())

  if (unique.length === 0) {
    throw new Error("Tidak ada penerima dengan nomor WhatsApp yang valid")
  }

  return unique
}

// ==========================================
// Mutation: Enqueue Broadcast to BullMQ
// ==========================================
export async function enqueueBroadcast(params: {
  tenantId: string
  userId: string
  target: string
  message: string
}) {
  const { tenantId, userId, target, message } = params

  // 1. Resolve recipients
  const recipients = await resolveBroadcastRecipients(tenantId, target)

  // 2. Calculate sequential non-overlapping delays for all recipients
  const delays = await getWaQueueDelays(tenantId, recipients.length)

  // 3. Create broadcast log entry
  const broadcastLog = await db.waMessage.create({
    data: {
      tenantId,
      to: `broadcast:${target}`,
      content: `[BROADCAST] ${recipients.length} penerima`,
      status: "PENDING",
    },
  })

  // 4. Enqueue each recipient as individual BullMQ job with sequential delay
  const jobs = recipients.map((recipient, index) => {
    const finalMessage = message
      .replace(/{{name}}/g, recipient.name || "")
      .replace(/{{phone}}/g, recipient.phone || "")

    const delayMs = delays[index]

    return {
      name: "broadcast-wa",
      data: {
        tenantId,
        number: recipient.phone,
        message: finalMessage,
        broadcastId: broadcastLog.id,
        recipientName: recipient.name,
      },
      opts: {
        delay: delayMs,
        attempts: 3,
        backoff: { type: "exponential" as const, delay: 5000 },
        removeOnComplete: { age: 3600 },
        removeOnFail: { age: 86400 },
      },
    }
  })

  await waQueue.addBulk(jobs)

  logger.info(`Broadcast enqueued: ${recipients.length} messages`, {
    tenantId,
    broadcastId: broadcastLog.id,
    target,
  })

  return {
    broadcastId: broadcastLog.id,
    count: recipients.length,
    message: `Broadcast sedang diproses untuk ${recipients.length} nomor tujuan.`,
  }
}

// ==========================================
// Query: Get Broadcast Status
// ==========================================
export async function getBroadcastHistory(tenantId: string, page = 1, limit = 20) {
  const [data, total] = await Promise.all([
    db.waMessage.findMany({
      where: { tenantId, to: { startsWith: "broadcast:" } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.waMessage.count({
      where: { tenantId, to: { startsWith: "broadcast:" } },
    }),
  ])

  return { data, total, page, totalPages: Math.ceil(total / limit) }
}
