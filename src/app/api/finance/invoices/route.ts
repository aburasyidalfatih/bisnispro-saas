import { NextResponse } from "next/server"
import { db, withTenant } from "@/lib/db"
import { requireTenantAccess } from "@/lib/guards/tenant-guard"
import { z } from "zod"
import { nanoid } from "nanoid"
import { sendNotification } from "@/lib/services/notification"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { FinanceService } from "@/lib/services/finance-service"

const invoiceSchema = z.object({
  studentId: z.string().min(1),
  billingTypeId: z.string().optional(),
  title: z.string().min(1),
  amount: z.number().min(1),
  dueDate: z.string(), // ISO string
  month: z.number().min(1).max(12).optional(),
  year: z.number().optional(),
  isAutoDebet: z.boolean().default(false),
  notes: z.string().optional(),
  // Cicilan
  installments: z.array(z.object({
    dueDate: z.string(),
    amount: z.number(),
  })).optional(),
})

export async function GET(req: Request) {
  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  const status = url.searchParams.get("status")
  const studentId = url.searchParams.get("studentId")
  const page = parseInt(url.searchParams.get("page") || "1")
  const perPage = 20

  if (!tenantId) return NextResponse.json({ error: "tenantId diperlukan" }, { status: 400 })
  try {
    await requireTenantAccess(tenantId)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 })
  }

  const tenantDb = withTenant(tenantId)
  const where: any = { deletedAt: null }
  if (status) where.status = status
  if (studentId) where.studentId = studentId

  const [invoices, total] = await Promise.all([
    tenantDb.invoice.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, nis: true, classroom: { select: { name: true } } } },
        billingType: { select: { id: true, name: true, category: true } },
        payments: { where: { status: "VERIFIED" }, select: { amount: true } },
      },
      orderBy: { dueDate: "asc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    tenantDb.invoice.count({ where }),
  ])

  return NextResponse.json({
    data: invoices,
    meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
  })
}

export async function POST(req: Request) {
  const body = await req.json()
  const { tenantId, ...rest } = body

  if (!tenantId) return NextResponse.json({ error: "tenantId diperlukan" }, { status: 400 })
  try {
    await requireTenantAccess(tenantId)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 })
  }

  const parsed = invoiceSchema.safeParse(rest)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { installments, dueDate, ...invoiceData } = parsed.data

  try {
    const invoice = await FinanceService.createInvoice({
      tenantId,
      studentId: invoiceData.studentId,
      billingTypeId: invoiceData.billingTypeId,
      title: invoiceData.title,
      amount: invoiceData.amount,
      dueDate,
      month: invoiceData.month,
      year: invoiceData.year,
      notes: invoiceData.notes,
      installments
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (error: any) {
    console.error("Gagal membuat invoice:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
