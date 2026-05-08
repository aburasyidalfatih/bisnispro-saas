import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireTenantAccess } from "@/lib/guards/tenant-guard"
import { z } from "zod"
import { nanoid } from "nanoid"

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
  const { error } = await requireTenantAccess(tenantId)
  if (error) return error

  const where: any = { tenantId, deletedAt: null }
  if (status) where.status = status
  if (studentId) where.studentId = studentId

  const [invoices, total] = await Promise.all([
    db.invoice.findMany({
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
    db.invoice.count({ where }),
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
  const { error } = await requireTenantAccess(tenantId)
  if (error) return error

  const parsed = invoiceSchema.safeParse(rest)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { installments, ...invoiceData } = parsed.data

  // Generate kode unik
  const code = `INV-${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, "0")}-${nanoid(6).toUpperCase()}`

  const invoice = await db.$transaction(async (tx) => {
    const inv = await tx.invoice.create({
      data: {
        tenantId,
        code,
        amountDue: invoiceData.amount,
        dueDate: new Date(invoiceData.dueDate),
        ...invoiceData,
        month: invoiceData.month,
        year: invoiceData.year ?? new Date().getFullYear(),
      },
    })

    // Buat cicilan jika ada
    if (installments && installments.length > 0) {
      await tx.installment.createMany({
        data: installments.map((ins) => ({
          invoiceId: inv.id,
          tenantId,
          dueDate: new Date(ins.dueDate),
          amount: ins.amount,
        })),
      })
    }

    return inv
  })

  return NextResponse.json(invoice, { status: 201 })
}
