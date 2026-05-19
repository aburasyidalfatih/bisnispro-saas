import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { verifyToken, consumeToken } from "@/features/auth/services/token.service"
import { resetPasswordSchema } from "@/lib/validations/auth"
import { parseBody } from "@/lib/api-utils"
import { logger } from "@/lib/logger"
import { rateLimit } from "@/lib/rate-limit"

export async function POST(req: Request) {
  try {
    // Rate limit: 5 requests per minute per IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "anonymous"
    const { success } = await rateLimit(`auth:reset:${ip}`, 5, 60_000)
    if (!success) {
      return NextResponse.json({ error: "Terlalu banyak permintaan. Coba lagi nanti." }, { status: 429 })
    }

    const parsed = await parseBody(req, resetPasswordSchema)
    if (parsed.error) return parsed.error
    const { token, password } = parsed.data

    const record = await verifyToken(token, "password_reset")
    if (!record.success || !record.data) {
      return NextResponse.json({ error: record.error || "Token tidak valid atau sudah kedaluwarsa" }, { status: 400 })
    }

    const hashed = await bcrypt.hash(password, 12)
    const updatedUser = await db.user.update({ 
      where: { id: record.data.userId }, 
      data: { password: hashed },
      include: { tenants: { include: { tenant: true } } }
    })
    await consumeToken(token)

    let loginUrl = "/login"
    if (!updatedUser.isSuperAdmin && updatedUser.tenants && updatedUser.tenants.length > 0) {
      const protocol = process.env.NODE_ENV === "production" ? "https" : "http"
      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "schoolpro.id"
      loginUrl = `${protocol}://${updatedUser.tenants[0].tenant.slug}.${rootDomain}/login`
    }

    return NextResponse.json({ message: "Password berhasil direset", loginUrl })
  } catch (error) {
    logger.error("Reset password failed", error, { path: "/api/auth/reset-password" })
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 })
  }
}
