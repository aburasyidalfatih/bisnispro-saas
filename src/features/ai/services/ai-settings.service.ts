import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

// ==========================================
// Query: Get AI Settings
// ==========================================
export async function getAiSettings(tenantId: string) {
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { aiTokens: true, useCustomApiKey: true, customOpenAiKey: true }
  })

  if (!tenant) throw new Error("Tenant not found")

  return {
    aiTokens: tenant.aiTokens,
    useCustomApiKey: tenant.useCustomApiKey,
    customOpenAiKey: tenant.customOpenAiKey || ""
  }
}

// ==========================================
// Mutation: Update AI Settings
// ==========================================
export async function updateAiSettings(tenantId: string, useCustomApiKey: boolean, customOpenAiKey?: string) {
  await db.tenant.update({
    where: { id: tenantId },
    data: {
      useCustomApiKey: Boolean(useCustomApiKey),
      customOpenAiKey: customOpenAiKey || null
    }
  })

  return { success: true }
}

// ==========================================
// Query: AI Usage Logs
// ==========================================
export async function getAiUsageLogs(tenantId: string, page = 1, limit = 10) {
  const [logs, total] = await Promise.all([
    db.aiUsageLog.findMany({
      where: { tenantId },
      include: {
        user: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.aiUsageLog.count({ where: { tenantId } })
  ])

  return {
    data: logs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  }
}
