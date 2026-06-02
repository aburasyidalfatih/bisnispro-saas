import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createTransaction } from "@/features/finance/services/payment.service"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || session.user.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    let { amount, method, aiTokens } = await req.json()
    amount = Math.round(Number(amount))
    aiTokens = Math.round(Number(aiTokens))

    if (!amount || isNaN(amount) || !method || !aiTokens || isNaN(aiTokens)) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 })
    }

    // Determine tenantId to link the transaction
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { tenantId: true, name: true, email: true }
    })

    if (!user || !user.tenantId) {
      return NextResponse.json({ error: "User tidak terkait dengan institusi apapun" }, { status: 400 })
    }

    // Buat transaksi via Tripay (force platform tripay via payment.service.ts)
    const tripayResult = await createTransaction({
      tenantId: user.tenantId,
      plan: "AI_TOKEN_USER",
      amount,
      method,
      customerName: user.name || "Guru",
      customerEmail: user.email || "guru@schoolpro.id",
      metadata: { userId: session.user.id, aiTokens }
    })

    if (!tripayResult.success) {
      return NextResponse.json({ error: tripayResult.error || "Gagal menghubungi Tripay" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Transaksi berhasil dibuat",
      checkoutUrl: tripayResult.data.checkout_url
    })

  } catch (error: any) {
    console.error("Teacher AI Topup error:", error)
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server" }, { status: 500 })
  }
}
