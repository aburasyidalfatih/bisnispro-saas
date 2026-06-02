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
    let { packageId, method } = await req.json()

    if (!packageId || !method) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 })
    }

    const aiPackage = await db.aiTokenPackage.findUnique({
      where: { id: packageId, isActive: true }
    })

    if (!aiPackage) {
      return NextResponse.json({ error: "Paket token tidak ditemukan atau sudah tidak aktif" }, { status: 404 })
    }

    const amount = Math.round(Number(aiPackage.price))
    const aiTokens = Math.round(Number(aiPackage.tokens))

    // Determine tenantId to link the transaction
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { tenantId: true, name: true, email: true }
    })

    if (!user || !user.tenantId) {
      return NextResponse.json({ error: "User tidak terkait dengan institusi apapun" }, { status: 400 })
    }

    if (method === "MANUAL_TRANSFER") {
      // Ambil detail manual bank dari platformSetting
      const platformSettings = await db.platformSetting.findMany({
        where: { key: { in: ["MANUAL_PAYMENT_BANK", "MANUAL_PAYMENT_NUMBER", "MANUAL_PAYMENT_NAME", "MANUAL_PAYMENT_WA"] } },
        select: { key: true, value: true }
      })
      const manualBankName = platformSettings.find(s => s.key === "MANUAL_PAYMENT_BANK")?.value || "Bank BCA"
      const manualAccountNumber = platformSettings.find(s => s.key === "MANUAL_PAYMENT_NUMBER")?.value || "1234 5678 90"
      const manualAccountName = platformSettings.find(s => s.key === "MANUAL_PAYMENT_NAME")?.value || "PT SchoolPro Indonesia"

      const payment = await db.payment.create({
        data: {
          tenantId: user.tenantId,
          reference: `MANUAL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          amount,
          method: "MANUAL_TRANSFER",
          status: "UNPAID",
          plan: "AI_TOKEN_USER",
          metadata: {
            userId: session.user.id,
            aiTokens,
            isManual: true,
            bankName: manualBankName,
            accountNumber: manualAccountNumber,
            accountName: manualAccountName
          }
        }
      })

      return NextResponse.json({
        message: "Transaksi manual berhasil dibuat",
        checkoutUrl: `/panel-gtk/ai/topup/manual/${payment.id}`
      })
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
