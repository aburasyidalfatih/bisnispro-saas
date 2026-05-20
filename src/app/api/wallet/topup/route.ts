import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createTransaction } from "@/features/finance/services/payment.service"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    let { walletId, amount, method, customerName, customerEmail, customerPhone } = await req.json()
    amount = Math.round(Number(amount))

    if (!walletId || !amount || isNaN(amount) || !method) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 })
    }

    const { verifyWalletOwnership, createManualTopup } = await import("@/features/finance/services/wallet.service")

    // Verify wallet ownership
    const wallet = await verifyWalletOwnership(walletId, session.user.id)

    // Handle Manual Bank Transfer
    if (method.startsWith("MANUAL_")) {
      const idx = parseInt(method.split("_")[1])
      const result = await createManualTopup({
        walletId: wallet.id,
        tenantId: wallet.tenantId,
        amount,
        methodIndex: idx,
        customerName,
        customerEmail,
      })
      return NextResponse.json(result)
    }

    // Buat transaksi via Tripay
    const tripayResult = await createTransaction({
      tenantId: wallet.tenantId,
      plan: "WALLET_TOPUP",
      amount,
      method,
      customerName,
      customerEmail,
      customerPhone,
      metadata: { walletId: wallet.id }
    })

    if (!tripayResult.success) {
      return NextResponse.json({ error: tripayResult.error || "Gagal menghubungi Tripay" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Transaksi berhasil dibuat",
      checkoutUrl: tripayResult.data.checkout_url
    })

  } catch (error: any) {
    console.error("Topup error:", error)
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server" }, { status: 500 })
  }
}
