import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireTenantMembership } from "@/lib/api-utils"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(1),
  category: z.enum(["SPP", "DAFTAR_ULANG", "SERAGAM", "BEBAS", "LAINNYA"]).optional(),
  amount: z.number().min(0).optional(),
  isRecurring: z.boolean().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  if (!tenantId) return NextResponse.json({ error: "tenantId diperlukan" }, { status: 400 })

  const { error: accessError } = await requireTenantMembership(tenantId);
    if (accessError) return accessError;

  const record = await db.billingType.findFirst({ where: { id, tenantId } })
  if (!record) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 })
  return NextResponse.json(record)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { tenantId, ...rest } = body

  if (!tenantId) return NextResponse.json({ error: "tenantId diperlukan" }, { status: 400 })
  const { error: accessError } = await requireTenantMembership(tenantId);
    if (accessError) return accessError;

  const parsed = schema.safeParse(rest)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const record = await db.billingType.update({
    where: { id },
    data: parsed.data,
  })
  return NextResponse.json(record)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  if (!tenantId) return NextResponse.json({ error: "tenantId diperlukan" }, { status: 400 })

  const { error: accessError } = await requireTenantMembership(tenantId);
    if (accessError) return accessError;

  await db.billingType.update({ where: { id }, data: { isActive: false } })
  return NextResponse.json({ message: "Berhasil dinonaktifkan" })
}
