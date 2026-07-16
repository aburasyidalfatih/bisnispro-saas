import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createTransaction } from "@/features/finance/services/payment.service"
import { apiHandler, parseBody } from "@/lib/api-utils"
import { z } from "zod"

const topupSchema = z.object({
  walletId: z.string().min(1, "walletId wajib diisi"),
  amount: z.number().min(1000, "Minimal topup adalah Rp 1.000"),
  method: z.string().min(1, "Metode pembayaran wajib diisi"),
  customerName: z.string().optional(),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional()
})

export const POST = apiHandler(async (req: Request) => {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await parseBody(req, topupSchema)
  if (error) return error

  let { walletId, amount, method, customerName, customerEmail, customerPhone } = data
  amount = Math.round(Number(amount))

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
      customerName: customerName || "",
      customerEmail: customerEmail || "",
    })
    return NextResponse.json(result)
  }

  // Buat transaksi via Tripay
  const tripayResult = await createTransaction({
    tenantId: wallet.tenantId,
    plan: "WALLET_TOPUP",
    amount,
    method,
    customerName: customerName || "",
    customerEmail: customerEmail || "",
    customerPhone: customerPhone || "",
    metadata: { walletId: wallet.id }
  })

  if (!tripayResult.success) {
    return NextResponse.json({ error: tripayResult.error || "Gagal menghubungi Tripay" }, { status: 500 })
  }

  return NextResponse.json({
    message: "Transaksi berhasil dibuat",
    checkoutUrl: tripayResult.data.checkout_url
  })
}, { rateLimit: 10, rateLimitWindowMs: 60000 })
