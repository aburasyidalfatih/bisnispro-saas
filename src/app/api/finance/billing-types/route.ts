import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireTenantMembership } from "@/lib/api-utils"
import { z } from "zod"

const billingTypeSchema = z.object({
  name: z.string().min(1),
  category: z.enum(["SPP", "DAFTAR_ULANG", "UANG_GEDUNG", "EKSKUL", "SERAGAM", "BUKU", "BEBAS", "LAINNYA"]),
  amount: z.number().min(0),
  isRecurring: z.boolean().default(false),
  isActive: z.boolean().default(true),
  description: z.string().optional(),
})

export async function GET(req: Request) {
  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  const showAll = url.searchParams.get("showAll") === "true"
  if (!tenantId) return NextResponse.json({ error: "tenantId diperlukan" }, { status: 400 })

  const { error: accessError } = await requireTenantMembership(tenantId);
    if (accessError) return accessError;

  const data = await db.billingType.findMany({
    where: { tenantId, ...(showAll ? {} : {}) }, // Admin UI fetches all, tidak filter isActive
    include: { _count: { select: { invoices: true } } },
    orderBy: [{ category: "asc" }, { name: "asc" }],
    take: 100,
  })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const body = await req.json()
  const { tenantId, ...rest } = body

  if (!tenantId) return NextResponse.json({ error: "tenantId diperlukan" }, { status: 400 })
  const { error: accessError } = await requireTenantMembership(tenantId);
    if (accessError) return accessError;

  const parsed = billingTypeSchema.safeParse(rest)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const record = await db.billingType.create({
    data: { tenantId, ...parsed.data },
  })
  return NextResponse.json(record, { status: 201 })
}
