"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { requireTenantAccess } from "@/lib/guards/tenant-guard"

export async function verifyManualTopup(paymentId: string, tenantId: string) {
  await requireTenantAccess(tenantId)

  try {
    return await db.$transaction(async (tx) => {
      // 1. Get Payment
      const payment = await tx.payment.findUnique({
        where: { id: paymentId, tenantId: tenantId }
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

      // 3. Update Wallet Balance atomically
      const updatedWallet = await tx.walletAccount.update({
        where: { id: wallet.id },
        data: { balance: { increment: payment.amount } }
      })

      // 4. Create Wallet Transaction History
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          tenantId: tenantId,
          type: "DEPOSIT",
          amount: payment.amount,
          balanceBefore: updatedWallet.balance - payment.amount,
          balanceAfter: updatedWallet.balance,
          description: `Top Up Manual: ${meta.bankName || "Transfer"}`,
          referenceId: payment.reference
        }
      })

      // 5. Update Payment Status
      const session = await auth()
      await tx.payment.update({
        where: { id: payment.id },
        data: { 
           status: "PAID",
           paidAt: new Date(),
           metadata: {
              ...meta,
              verifiedBy: session?.user?.name || "Admin",
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

export async function rejectManualTopup(paymentId: string, reason: string, tenantId: string) {
  await requireTenantAccess(tenantId)

  try {
    const payment = await db.payment.findUnique({
      where: { id: paymentId, tenantId: tenantId }
    })

    if (!payment) throw new Error("Pembayaran tidak ditemukan")
    if (payment.status === "PAID") throw new Error("Pembayaran sudah terlanjur diverifikasi")

    const meta = payment.metadata as any

    const session = await auth()
    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: "FAILED",
        metadata: {
          ...meta,
          rejectedBy: session?.user?.name || "Admin",
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
