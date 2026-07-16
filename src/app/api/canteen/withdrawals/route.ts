import { requireTenantMembership } from "@/lib/api-utils"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { z } from "zod"

const withdrawalSchema = z.object({
  tenantId: z.string(),
  merchantId: z.string(),
  amount: z.number().min(1),
  notes: z.string().optional(),
})

// GET: List withdrawals merchant
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  if (!tenantId) return NextResponse.json({ error: "tenantId diperlukan" }, { status: 400 })
  const { error: accessError } = await requireTenantMembership(tenantId as string);
  if (accessError) return accessError;

  const merchant = await db.canteenMerchant.findFirst({
    where: { userId: session.user.id, tenantId },
  })
  if (!merchant) return NextResponse.json({ error: "Merchant tidak ditemukan" }, { status: 404 })

  const withdrawals = await db.canteenWithdrawal.findMany({
    where: { merchantId: merchant.id },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ merchant, withdrawals })
}

// POST: Ajukan penarikan
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const parsed = withdrawalSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { tenantId, merchantId, amount, notes } = parsed.data

  const merchant = await db.canteenMerchant.findFirst({
    where: { id: merchantId, userId: session.user.id, tenantId },
  })
  if (!merchant) return NextResponse.json({ error: "Merchant tidak valid" }, { status: 403 })
  if (merchant.balance < amount) {
    return NextResponse.json({ error: `Saldo tidak cukup. Saldo tersedia: Rp ${merchant.balance.toLocaleString("id-ID")}` }, { status: 400 })
  }

  // Kurangi saldo merchant + buat pengajuan
  const withdrawal = await db.$transaction(async (tx) => {
    const updatedMerchant = await tx.canteenMerchant.update({
      where: { id: merchant.id },
      data: { balance: { decrement: amount } },
    })
    if (updatedMerchant.balance < 0) {
      throw new Error("Saldo merchant tidak mencukupi")
    }
    return tx.canteenWithdrawal.create({
      data: { tenantId, merchantId, amount, notes },
    })
  })

  return NextResponse.json(withdrawal, { status: 201 })
}
