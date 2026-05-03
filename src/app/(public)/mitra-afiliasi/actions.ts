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

    // Generate kode referral unik (e.g., BUDI123)
    let baseCode = parsed.name.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, "")
    if (baseCode.length < 3) baseCode = "MITRA"
    
    const randomSuffix = Math.floor(1000 + Math.random() * 9000)
    const referralCode = `${baseCode}${randomSuffix}`

    const hashedPassword = await hash(parsed.password, 12)

    // Buat User dan AffiliateProfile sekaligus menggunakan Prisma Transaction
    const user = await db.user.create({
      data: {
        name: parsed.name,
        email: parsed.email,
        password: hashedPassword,
        phone: parsed.phone,
        isActive: true,
        affiliateProfile: {
          create: {
            referralCode: referralCode,
          }
        }
      },
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
