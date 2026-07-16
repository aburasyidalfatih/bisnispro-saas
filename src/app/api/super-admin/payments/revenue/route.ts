import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  // Group by month
  const payments = await db.payment.findMany({
    where: {
      status: "paid",
      createdAt: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
    },
    select: {
      amount: true,
      paidAt: true,
      createdAt: true
    },
    orderBy: { createdAt: "desc" }
  })

  const monthlyData: Record<string, number> = {}

  payments.forEach(p => {
    const date = p.paidAt || p.createdAt
    const month = new Date(date).toLocaleString('default', { month: 'short', year: '2-digit' })
    monthlyData[month] = (monthlyData[month] || 0) + p.amount
  })

  const chartData = Object.entries(monthlyData).map(([name, total]) => ({
    name,
    total
  })).reverse()

  return NextResponse.json({
    chartData,
    totalRevenue: payments.reduce((acc, curr) => acc + curr.amount, 0)
  })
}
