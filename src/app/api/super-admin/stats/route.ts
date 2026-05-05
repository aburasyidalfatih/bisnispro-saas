import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const [tenantCount, userCount, activeTenants, totalRevenue, recentPayments, pendingPayments, applicationCount] = await Promise.all([
    db.tenant.count(),
    db.user.count({ where: { isSuperAdmin: false } }),
    db.tenant.count({ where: { isActive: true } }),
    db.payment.aggregate({ where: { status: "paid" }, _sum: { amount: true } }),
    db.payment.count({ where: { status: "paid", paidAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),
    db.payment.count({ where: { status: "pending" } }),
    db.tenantApplication.count(),
  ])

  return NextResponse.json({
    tenantCount,
    userCount,
    activeTenants,
    totalRevenue: totalRevenue._sum.amount || 0,
    recentPayments,
    pendingPayments,
    applicationCount,
  })
}
