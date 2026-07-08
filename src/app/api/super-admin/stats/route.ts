import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getRedis } from "@/lib/redis"

export async function GET() {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const redis = getRedis()
  const cacheKey = "superadmin:stats"

  if (redis) {
    try {
      const cached = await redis.get(cacheKey)
      if (cached) {
        return NextResponse.json(typeof cached === "string" ? JSON.parse(cached) : cached)
      }
    } catch (e) {
      console.error("[REDIS] Cache read failed", e)
    }
  }

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const [tenantCount, userCount, activeTenants, totalRevenue, recentPayments, pendingPayments, applicationCount, loginHariIni, dormantCount] = await Promise.all([
    db.tenant.count(),
    db.user.count({ where: { isSuperAdmin: false } }),
    db.tenant.count({ where: { isActive: true } }),
    db.payment.aggregate({ where: { status: "paid" }, _sum: { amount: true } }),
    db.payment.count({ where: { status: "paid", paidAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),
    db.payment.count({ where: { status: "pending" } }),
    db.tenantApplication.count(),
    db.auditLog.count({ where: { action: "USER_LOGIN", createdAt: { gte: startOfToday } } }),
    db.tenant.count({ where: { auditLogs: { none: { action: { contains: "login", mode: "insensitive" } } } } })
  ])

  const result = {
    tenantCount,
    userCount,
    activeTenants,
    totalRevenue: totalRevenue._sum.amount || 0,
    recentPayments,
    pendingPayments,
    applicationCount,
    loginHariIni,
    dormantCount,
  }

  if (redis) {
    try {
      await redis.setex(cacheKey, 300, JSON.stringify(result)) // 5 minutes cache
    } catch (e) {
      console.error("[REDIS] Cache write failed", e)
    }
  }

  return NextResponse.json(result)
}
