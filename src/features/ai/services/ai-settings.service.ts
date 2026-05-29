import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

// ==========================================
// Query: Get AI Settings
// ==========================================
export async function getAiSettings(tenantId: string) {
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { aiTokens: true, aiAddonTokens: true }
  })

  if (!tenant) throw new Error("Tenant not found")

  return {
    aiTokens: tenant.aiTokens,
    aiAddonTokens: tenant.aiAddonTokens
  }
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
