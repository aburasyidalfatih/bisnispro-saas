import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { createTransaction } from "@/lib/services/payment"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    let { walletId, amount, method, customerName, customerEmail, customerPhone } = await req.json()
    amount = Math.round(Number(amount))

    if (!walletId || !amount || isNaN(amount) || !method) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 })
    }

    // Verify wallet ownership
    const wallet = await db.walletAccount.findUnique({
      where: { id: walletId },
      include: {
        student: {
          include: {
            parents: {
              where: { userId: session.user.id }
            }
          }
        }
      }
    })

    if (!wallet || wallet.student.parents.length === 0) {
       return NextResponse.json({ error: "Wallet tidak ditemukan atau Anda tidak memiliki akses" }, { status: 403 })
    }

    // Handle Manual Bank Transfer
    if (method.startsWith("MANUAL_")) {
       const tenantData = await db.tenant.findUnique({
          where: { id: wallet.tenantId },
          select: { settings: true }
       })
       const manualBanks = (tenantData?.settings as any)?.manualBanks || []
       const idx = parseInt(method.split("_")[1])
       const selectedBank = manualBanks[idx]

       if (!selectedBank) {
          return NextResponse.json({ error: "Rekening manual tidak ditemukan" }, { status: 400 })
       }

       const payment = await db.payment.create({
          data: {
             tenantId: wallet.tenantId,
             reference: `MANUAL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
             amount: amount,
             method: `MANUAL_TRANSFER`,
             status: "UNPAID",
             plan: "WALLET_TOPUP",
             metadata: {
                walletId: wallet.id,
                customerName,
                customerEmail,
                bankName: selectedBank.bank,
                accountNumber: selectedBank.account,
                accountName: selectedBank.name,
                isManual: true
             }
          }
       })

       return NextResponse.json({
          message: "Transaksi manual berhasil dibuat",
          redirectUrl: `/ortu/wallet/topup/manual/${payment.id}`
       })
    }

    // Buat transaksi via Tripay
    const tripayResult = await createTransaction({
      tenantId: wallet.tenantId,
      plan: "WALLET_TOPUP", // Ini penting agar dikenali sebagai Top Up oleh handleCallback
      amount: amount,
      method: method,
      customerName: customerName,
      customerEmail: customerEmail,
      customerPhone: customerPhone,
      metadata: {
        walletId: wallet.id,
      }
    })

    if (!tripayResult.success) {
      return NextResponse.json({ error: tripayResult.message || "Gagal menghubungi Tripay" }, { status: 500 })
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
