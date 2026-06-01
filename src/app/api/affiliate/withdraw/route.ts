import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { amount } = await req.json()
    if (!amount || amount < 50000) {
      return NextResponse.json({ error: "Minimal penarikan Rp 50.000" }, { status: 400 })
    }

    const affiliate = await db.affiliateProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!affiliate) {
      return NextResponse.json({ error: "Profil tidak ditemukan" }, { status: 404 })
    }

    if (!affiliate.bankAccount || !affiliate.bankName) {
      return NextResponse.json({ error: "Informasi rekening belum lengkap" }, { status: 400 })
    }

    if (amount > affiliate.balance) {
      return NextResponse.json({ error: "Saldo tidak mencukupi" }, { status: 400 })
    }

    // Buat withdrawal dan potong balance dalam transaksi
    const withdrawal = await db.$transaction(async (tx) => {
      const newWithdrawal = await tx.affiliateWithdrawal.create({
        data: {
          affiliateId: affiliate.id,
          amount: amount,
          status: "PENDING",
          bankName: affiliate.bankName,
          bankAccount: affiliate.bankAccount,
          accountName: affiliate.accountName,
        }
      })

      const updatedAffiliate = await tx.affiliateProfile.update({
        where: { id: affiliate.id },
        data: { balance: { decrement: amount } }
      })
      
      if (updatedAffiliate.balance < 0) {
        throw new Error("Saldo tidak mencukupi")
      }
      
      return newWithdrawal
    })

    // Notify Super Admin
    import("@/features/finance/services/billing-notification.service")
      .then(({ notifySuperAdminWithdrawalRequest }) => {
        notifySuperAdminWithdrawalRequest(withdrawal.id).catch(() => {})
      })
      .catch(() => {})

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Withdraw error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
