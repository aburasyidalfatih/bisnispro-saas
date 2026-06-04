"use server"

import { db } from "@/lib/db"
import { hash } from "bcryptjs"
import { z } from "zod"

const registerSchema = z.object({
  name: z.string().min(3, "Nama terlalu pendek"),
  email: z.string().email("Email tidak valid"),
  phone: z.string().min(10, "Nomor WhatsApp tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
})

export async function registerAffiliate(formData: FormData) {
  try {
    const parsed = registerSchema.parse({
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      password: formData.get("password"),
    })

    // Cek apakah email sudah dipakai
    const existingUser = await db.user.findUnique({
      where: { email: parsed.email },
    })

    if (existingUser) {
      return { error: "Email sudah terdaftar. Silakan gunakan email lain atau login." }
    }

    // Generate kode referral unik (e.g., bud123) - 3 Huruf + 3 Angka
    let baseLetters = parsed.name.toLowerCase().replace(/[^a-z]/g, "").substring(0, 3)
    if (baseLetters.length < 3) {
      const alphabet = "abcdefghijklmnopqrstuvwxyz"
      while (baseLetters.length < 3) {
        baseLetters += alphabet[Math.floor(Math.random() * alphabet.length)]
      }
    }
    
    const randomNumbers = Math.floor(100 + Math.random() * 900).toString()
    const referralCode = `${baseLetters}${randomNumbers}`

    const hashedPassword = await hash(parsed.password, 12)

    // Buat User, AffiliateProfile, dan Kupon Cashback sekaligus menggunakan Prisma Transaction
    await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: parsed.name,
          email: parsed.email,
          password: hashedPassword,
          phone: parsed.phone,
          isActive: true,
        },
      })

      const newAffiliate = await tx.affiliateProfile.create({
        data: {
          userId: user.id,
          referralCode: referralCode,
        }
      })

      const settings = await tx.platformSetting.findUnique({ where: { key: "AFFILIATE_DEFAULT_CASHBACK" } })
      const defaultCashbackAmount = settings ? parseInt(settings.value) : 400000;

      // Auto-generate Cashback Coupon matching the referral code
      await tx.discountCode.create({
        data: {
          code: referralCode,
          description: `Kupon Cashback Otomatis untuk Mitra ${parsed.name}`,
          type: "CASHBACK",
          cashbackAmount: defaultCashbackAmount,
          percentage: 0,
          affiliateId: newAffiliate.id,
          isActive: true,
        }
      })
    })

    return { success: true, message: "Pendaftaran berhasil. Silakan login untuk masuk ke Dashboard." }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    console.error("Affiliate Registration Error:", error)
    return { error: "Terjadi kesalahan sistem. Silakan coba lagi nanti." }
  }
}
