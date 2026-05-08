import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireTenantMembership } from "@/lib/api-utils"
import { z } from "zod"
import { auth } from "@/lib/auth"

const productSchema = z.object({
  tenantId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  price: z.number().min(0),
  stock: z.number().default(-1),
  isActive: z.boolean().default(true),
})

// Merchant ambil produknya sendiri
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  const merchantId = url.searchParams.get("merchantId")
  if (!tenantId) return NextResponse.json({ error: "tenantId diperlukan" }, { status: 400 })

  // Cari merchant milik user ini (jika merchantId tidak disediakan)
  const merchant = merchantId
    ? await db.canteenMerchant.findFirst({ where: { id: merchantId, tenantId } })
    : await db.canteenMerchant.findFirst({ where: { userId: session.user.id, tenantId } })

  if (!merchant) return NextResponse.json({ error: "Merchant tidak ditemukan" }, { status: 404 })

  const products = await db.canteenProduct.findMany({
    where: { merchantId: merchant.id, tenantId },
    orderBy: { name: "asc" },
  })
  return NextResponse.json({ merchant, products })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const parsed = productSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { tenantId, ...data } = parsed.data

  // Pastikan merchant milik user ini
  const merchant = await db.canteenMerchant.findFirst({
    where: { userId: session.user.id, tenantId },
  })
  if (!merchant) return NextResponse.json({ error: "Anda tidak memiliki merchant di tenant ini" }, { status: 403 })

  const product = await db.canteenProduct.create({
    data: { merchantId: merchant.id, tenantId, ...data },
  })
  return NextResponse.json(product, { status: 201 })
}
