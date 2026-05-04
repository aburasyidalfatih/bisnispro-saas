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

export async function updateProfile(data: { name: string, email: string, phone: string }) {
  try {
    const session = await auth()
    if (!session?.user) return { error: "Unauthorized" }

    if (!data.email.endsWith("@gmail.com")) {
      return { error: "Email wajib menggunakan @gmail.com untuk keamanan login." }
    }

    if (!data.phone || data.phone.length < 10) {
      return { error: "Nomor WhatsApp tidak valid." }
    }

    // Check if email is already used by another user
    if (data.email !== session.user.email) {
      const existingUser = await db.user.findUnique({
        where: { email: data.email }
      })
      if (existingUser) {
        return { error: "Email ini sudah terdaftar. Gunakan email lain." }
      }
    }

    await db.user.update({
      where: { id: session.user.id },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
      }
    })

    return { success: true }
  } catch (error) {
    console.error("Update profile error:", error)
    return { error: "Terjadi kesalahan saat menyimpan profil." }
  }
}

export async function checkUserProfile() {
  try {
    const session = await auth()
    if (!session?.user) return null
    const user = await db.user.findUnique({ 
      where: { id: session.user.id }, 
      select: { phone: true, name: true, email: true } 
    })
    return user
  } catch (error) {
    return null
  }
}
