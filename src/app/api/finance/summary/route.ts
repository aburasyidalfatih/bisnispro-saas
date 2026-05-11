import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 })

  const { error } = await (await import("@/lib/api-utils")).requireTenantMembership(tenantId)
  if (error) return error

  const [totalRevenue, totalDue, totalPaidCount, totalUnpaidCount, totalOverdueCount] = await Promise.all([
    db.invoice.aggregate({
      where: { tenantId, status: "PAID", deletedAt: null },
      _sum: { amountPaid: true },
    }),
    db.invoice.aggregate({
      where: { tenantId, status: { in: ["UNPAID", "PARTIAL", "OVERDUE"] }, deletedAt: null },
      _sum: { amountDue: true },
    }),
    db.invoice.count({ where: { tenantId, status: "PAID", deletedAt: null } }),
    db.invoice.count({ where: { tenantId, status: { in: ["UNPAID", "PARTIAL"] }, deletedAt: null } }),
    db.invoice.count({ where: { tenantId, status: "OVERDUE", deletedAt: null } }),
  ])

  return NextResponse.json({
    totalRevenue: totalRevenue._sum.amountPaid || 0,
    totalDue: totalDue._sum.amountDue || 0,
    paidCount: totalPaidCount,
    unpaidCount: totalUnpaidCount,
    overdueCount: totalOverdueCount,
    totalInvoices: totalPaidCount + totalUnpaidCount + totalOverdueCount,
  })
}
