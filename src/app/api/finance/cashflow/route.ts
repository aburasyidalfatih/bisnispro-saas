import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { requireTenantMembership } from "@/lib/api-utils"
import { parseBody } from "@/lib/api-utils"
import { z } from "zod"

const cashflowSchema = z.object({
  tenantId: z.string().min(1),
  type: z.enum(["INCOME", "EXPENSE"]),
  category: z.string().min(1),
  amount: z.number().min(1),
  description: z.string().optional(),
  recordedAt: z.string().datetime().optional()
})

export async function GET(req: Request) {
  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  const type = url.searchParams.get("type") as "INCOME" | "EXPENSE" | null
  const month = parseInt(url.searchParams.get("month") || "")
  const year = parseInt(url.searchParams.get("year") || "")

  if (!tenantId) return NextResponse.json({ error: "tenantId diperlukan" }, { status: 400 })

  const { error: accessError } = await requireTenantMembership(tenantId)
  if (accessError) return accessError

  const where: any = { tenantId }
  if (type) where.type = type
  if (month && year) {
    where.recordedAt = {
      gte: new Date(year, month - 1, 1),
      lt: new Date(year, month, 1)
    }
  }

  try {
    const cashflows = await db.cashflow.findMany({
      where,
      orderBy: { recordedAt: "desc" },
    })
    return NextResponse.json(cashflows)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { data, error } = await parseBody(req, cashflowSchema)
    if (error) return error

    const { tenantId, type, category, amount, description, recordedAt } = data

    const { error: accessError } = await requireTenantMembership(tenantId)
    if (accessError) return accessError

    const record = await db.cashflow.create({
      data: {
        tenantId,
        type,
        category,
        amount,
        description,
        recordedAt: recordedAt ? new Date(recordedAt) : new Date()
      }
    })

    return NextResponse.json(record)
  } catch (err: any) {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
