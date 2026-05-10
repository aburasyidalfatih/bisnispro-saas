import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  
  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  const type = url.searchParams.get("type")
  const take = parseInt(url.searchParams.get("take") || "50")
  
  if (!tenantId) return NextResponse.json({ error: "Tenant ID required" }, { status: 400 })

  try {
    const where: any = { tenantId }
    if (type && type !== "ALL") where.type = type

    const data = await db.cashflow.findMany({
      where,
      orderBy: { recordedAt: "desc" },
      take
    })

    const summary = await db.cashflow.groupBy({
      by: ['type'],
      where: { tenantId },
      _sum: { amount: true }
    })

    const totalIncome = summary.find(s => s.type === "INCOME")?._sum.amount || 0
    const totalExpense = summary.find(s => s.type === "EXPENSE")?._sum.amount || 0

    return NextResponse.json({ 
      data, 
      summary: { 
        income: totalIncome, 
        expense: totalExpense, 
        balance: totalIncome - totalExpense 
      } 
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const { tenantId, type, category, amount, description, recordedAt } = body

    if (!tenantId || !type || !category || !amount) {
       return NextResponse.json({ error: "Semua kolom wajib diisi" }, { status: 400 })
    }

    const cashflow = await db.cashflow.create({
      data: {
        tenantId,
        type,
        category,
        amount: parseFloat(amount),
        description,
        recordedAt: recordedAt ? new Date(recordedAt) : new Date()
      }
    })

    return NextResponse.json(cashflow)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
