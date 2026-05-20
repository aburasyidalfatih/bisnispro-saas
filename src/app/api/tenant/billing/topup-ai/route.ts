import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { createTransaction } from "@/features/finance/services/payment.service"
import { logger } from "@/lib/logger"
import { getCurrentTenant } from "@/lib/session"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const tenant = getCurrentTenant(session)
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 })

  try {
    const { packageId } = await req.json()
    if (!packageId) return NextResponse.json({ error: "Package ID is required" }, { status: 400 })

    const tokenPackage = await db.aiTokenPackage.findUnique({
      where: { id: packageId }
    })

    if (!tokenPackage || !tokenPackage.isActive) {
      return NextResponse.json({ error: "Paket token tidak ditemukan atau tidak aktif" }, { status: 404 })
    }

    // Hitung PPN 11% (jika ada, sesuaikan dengan logic platform. Di sini diasumsikan nett)
    const amount = tokenPackage.price

    // Create payment transaction
    const payment = await createTransaction({
      tenantId: tenant.id,
      amount,
      plan: "ai-token",
      metadata: {
        type: "AI_QUOTA",
        packageId: tokenPackage.id,
        packageName: tokenPackage.name,
        aiTokens: tokenPackage.tokens
      }
    })

    return NextResponse.json(payment)
  } catch (error) {
    logger.error("Create AI top-up payment failed", error, { path: "/api/tenant/billing/topup-ai" })
    return NextResponse.json({ error: "Gagal membuat tagihan pembelian token AI" }, { status: 500 })
  }
}
