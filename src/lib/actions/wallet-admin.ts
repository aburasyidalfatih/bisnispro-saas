"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function verifyManualTopup(paymentId: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const tenant = session.user.tenants?.[0]
  if (!tenant) throw new Error("No active tenant")

  try {
    return await db.$transaction(async (tx) => {
      // 1. Get Payment
      const payment = await tx.payment.findUnique({
        where: { id: paymentId, tenantId: tenant.id }
      })

      if (!payment) throw new Error("Pembayaran tidak ditemukan")
      if (payment.status === "PAID") throw new Error("Pembayaran sudah diverifikasi")

      const meta = payment.metadata as any
      if (!meta?.walletId) throw new Error("Data wallet tidak ditemukan pada pembayaran")

      // 2. Get Wallet
      const wallet = await tx.walletAccount.findUnique({
        where: { id: meta.walletId }
      })

      if (!wallet) throw new Error("Wallet account tidak ditemukan")

      const newBalance = wallet.balance + payment.amount

      // 3. Update Wallet Balance
      await tx.walletAccount.update({
        where: { id: wallet.id },
        data: { balance: newBalance }
      })

      // 4. Create Wallet Transaction History
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          tenantId: tenant.id,
          type: "DEPOSIT",
          amount: payment.amount,
          balanceBefore: wallet.balance,
          balanceAfter: newBalance,
          description: `Top Up Manual: ${meta.bankName || "Transfer"}`,
          referenceId: payment.reference
        }
      })

      // 5. Update Payment Status
      await tx.payment.update({
        where: { id: payment.id },
        data: { 
           status: "PAID",
           paidAt: new Date(),
           metadata: {
              ...meta,
              verifiedBy: session.user.name,
              verifiedAt: new Date().toISOString()
           }
        }
      })

      revalidatePath("/admin/finance/wallet")
      return { success: true }
    })
  } catch (error: any) {
    console.error("Verify topup error:", error)
    return { success: false, error: error.message }
  }
}

export async function rejectManualTopup(paymentId: string, reason: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const tenant = session.user.tenants?.[0]
  if (!tenant) throw new Error("No active tenant")

  try {
    const payment = await db.payment.findUnique({
      where: { id: paymentId, tenantId: tenant.id }
    })

    if (!payment) throw new Error("Pembayaran tidak ditemukan")
    if (payment.status === "PAID") throw new Error("Pembayaran sudah terlanjur diverifikasi")

    const meta = payment.metadata as any

    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: "FAILED",
        metadata: {
          ...meta,
          rejectedBy: session.user.name,
          rejectedAt: new Date().toISOString(),
          rejectReason: reason
        }
      }
    })

    revalidatePath("/admin/finance/wallet")
    return { success: true }
  } catch (error: any) {
    console.error("Reject topup error:", error)
    return { success: false, error: error.message }
  }
}
