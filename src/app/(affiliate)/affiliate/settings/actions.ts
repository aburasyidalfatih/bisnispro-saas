"use server"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function updateBankInfo(data: { bankName: string, bankAccount: string, accountName: string }) {
  try {
    const session = await auth()
    if (!session?.user) return { error: "Unauthorized" }

    const affiliate = await db.affiliateProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!affiliate) return { error: "Profile not found" }

    await db.affiliateProfile.update({
      where: { id: affiliate.id },
      data: {
        bankName: data.bankName,
        bankAccount: data.bankAccount,
        accountName: data.accountName,
      }
    })

    return { success: true }
  } catch (error) {
    console.error("Update bank info error:", error)
    return { error: "Terjadi kesalahan saat menyimpan data" }
  }
}
