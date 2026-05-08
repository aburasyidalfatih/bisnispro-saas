import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireTenantAccess } from "@/lib/guards/tenant-guard"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  if (!tenantId) return NextResponse.json({ error: "tenantId diperlukan" }, { status: 400 })

  const { error } = await requireTenantAccess(tenantId)
  if (error) return error

  const invoice = await db.invoice.findFirst({
    where: { id, tenantId, deletedAt: null },
    include: {
      student: {
        include: {
          classroom: true,
          walletAccount: { select: { balance: true } },
        },
      },
      billingType: true,
      payments: {
        orderBy: { createdAt: "desc" },
      },
      installments: { orderBy: { dueDate: "asc" } },
    },
  })

  if (!invoice) return NextResponse.json({ error: "Tagihan tidak ditemukan" }, { status: 404 })
  return NextResponse.json(invoice)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { tenantId, ...data } = body

  if (!tenantId) return NextResponse.json({ error: "tenantId diperlukan" }, { status: 400 })
  const { error } = await requireTenantAccess(tenantId)
  if (error) return error

  const invoice = await db.invoice.update({
    where: { id },
    data,
  })
  return NextResponse.json(invoice)
}

// Soft delete
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  if (!tenantId) return NextResponse.json({ error: "tenantId diperlukan" }, { status: 400 })

  const { error } = await requireTenantAccess(tenantId)
  if (error) return error

  await db.invoice.update({ where: { id }, data: { deletedAt: new Date(), status: "CANCELLED" } })
  return NextResponse.json({ message: "Tagihan dibatalkan" })
}
