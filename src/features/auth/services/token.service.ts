import crypto from "crypto"
import { db } from "@/lib/db"
import { getRedisClient } from "@/lib/redis"

export type TokenType = "email_verify" | "password_reset" | "school_register";

/**
 * Membuat token verifikasi baru dan menghapus token lama dengan tipe yang sama.
 */
export async function createToken(userId: string, type: TokenType, expiresInHours = 24) {
  // Hapus token lama dengan tipe yang sama
  await db.verificationToken.deleteMany({ where: { userId, type } })

  const token = crypto.randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000)

  const record = await db.verificationToken.create({
    data: { userId, token, type, expiresAt },
  })

  // DTO Mapping: Hanya kembalikan string token yang dibutuhkan
  return {
    success: true,
    token: record.token,
    expiresAt: record.expiresAt.toISOString()
  }
}

/**
 * Memverifikasi validitas token (termasuk expired check).
 */
export async function verifyToken(token: string, type: TokenType) {
  const record = await db.verificationToken.findUnique({ where: { token } })

  if (!record || record.type !== type) {
    return { success: false, error: "Token tidak valid atau tidak ditemukan." }
  }
  
  if (record.expiresAt < new Date()) {
    await db.verificationToken.delete({ where: { id: record.id } })
    return { success: false, error: "Token sudah kadaluarsa." }
  }

  // DTO Mapping: Mencegah kembalian raw Prisma object
  return {
    success: true,
    data: {
      userId: record.userId,
      type: record.type
    }
  }
}

/**
 * Menghapus token setelah berhasil digunakan (dikonsumsi).
 */
export async function consumeToken(token: string) {
  try {
    await db.verificationToken.delete({ where: { token } })
    return { success: true }
  } catch (error) {
    return { success: false, error: "Gagal menghapus token" }
  }
}

/**
 * Membuat token untuk registrasi sekolah baru (tanpa model User).
 * Disimpan ke Redis agar aman dan otomatis kedaluwarsa.
 */
export async function createAppRegistrationToken(applicationId: string, expiresInHours = 24) {
  const token = crypto.randomBytes(32).toString("hex")
  const redis = await getRedisClient()
  await redis.set(`app_register:${token}`, applicationId, expiresInHours * 60 * 60)
  
  return {
    success: true,
    token: token
  }
}

/**
 * Memverifikasi token registrasi sekolah.
 */
export async function verifyAppRegistrationToken(token: string) {
  const redis = await getRedisClient()
  const applicationId = await redis.get(`app_register:${token}`)
  
  if (!applicationId) {
    return { success: false, error: "Token tidak valid atau sudah kadaluarsa." }
  }
  
  return {
    success: true,
    data: { applicationId }
  }
}

/**
 * Menghapus token registrasi sekolah setelah digunakan.
 */
export async function consumeAppRegistrationToken(token: string) {
  try {
    const redis = await getRedisClient()
    await redis.del(`app_register:${token}`)
    return { success: true }
  } catch (error) {
    return { success: false, error: "Gagal menghapus token" }
  }
}
