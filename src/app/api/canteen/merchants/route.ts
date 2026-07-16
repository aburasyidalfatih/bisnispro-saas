import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireTenantMembership } from "@/lib/api-utils"
import { z } from "zod"

const merchantSchema = z.object({
  tenantId: z.string(),
  userId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
})

export async function GET(req: Request) {
  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  if (!tenantId) return NextResponse.json({ error: "tenantId diperlukan" }, { status: 400 })
  const { error } = await requireTenantMembership(tenantId)
  if (error) return error

  const merchants = await db.canteenMerchant.findMany({
    where: { tenantId },
    include: {
      user: { select: { id: true, name: true, email: true, avatar: true } },
      _count: { select: { products: true, orders: true } },
    },
    orderBy: { name: "asc" },
  })
  return NextResponse.json(merchants)
}

export async function POST(req: Request) {
  const body = await req.json()
  const parsed = merchantSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { tenantId, ...data } = parsed.data
  const { error } = await requireTenantMembership(tenantId)
  if (error) return error

  // Pastikan user belum punya merchant di tenant ini
  const existing = await db.canteenMerchant.findUnique({ where: { userId: data.userId } })
  if (existing) return NextResponse.json({ error: "Pengguna ini sudah memiliki merchant kantin" }, { status: 409 })

  const merchant = await db.canteenMerchant.create({ data: { tenantId, ...data } })
  return NextResponse.json(merchant, { status: 201 })
}

export async function DELETE(req: Request) {
  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  const id = url.searchParams.get("id")
  
  if (!tenantId || !id) return NextResponse.json({ error: "tenantId dan id diperlukan" }, { status: 400 })
  
  const { error } = await requireTenantMembership(tenantId)
  if (error) return error

  try {
    await db.canteenMerchant.delete({
      where: { id }
    })
    return NextResponse.json({ message: "Merchant dihapus" })
  } catch (e) {
    return NextResponse.json({ error: "Gagal menghapus merchant" }, { status: 500 })
  }
}

