import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireTenantMembership } from "@/lib/api-utils"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  if (!tenantId) return NextResponse.json({ error: "tenantId diperlukan" }, { status: 400 })

  try {
    const { error: accessError } = await requireTenantMembership(tenantId);
  if (accessError) throw new Error("Unauthorized")
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 })
  }

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
  try {
    const { error: accessError } = await requireTenantMembership(tenantId);
  if (accessError) throw new Error("Unauthorized")
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 })
  }

  const invoice = await db.invoice.update({
    where: { id, tenantId },
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

  try {
    const { error: accessError } = await requireTenantMembership(tenantId);
  if (accessError) throw new Error("Unauthorized")
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 })
  }

  await db.invoice.update({ where: { id, tenantId }, data: { deletedAt: new Date(), status: "CANCELLED" } })
  return NextResponse.json({ message: "Tagihan dibatalkan" })
}
