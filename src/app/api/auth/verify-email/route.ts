import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyToken, consumeToken } from "@/features/auth/services/token.service"
import { verifyEmailSchema } from "@/lib/validations/auth"
import { parseBody } from "@/lib/api-utils"
import { logger } from "@/lib/logger"

export async function POST(req: Request) {
  try {
    const parsed = await parseBody(req, verifyEmailSchema)
    if (parsed.error) return parsed.error
    const { token } = parsed.data

    const record = await verifyToken(token, "email_verify")
    if (!record.success || !record.data) {
      return NextResponse.json({ error: record.error || "Token tidak valid atau sudah kedaluwarsa" }, { status: 400 })
    }

    await db.user.update({
      where: { id: record.data.userId },
      data: { emailVerified: new Date() },
    })
    await consumeToken(token)

    return NextResponse.json({ message: "Email berhasil diverifikasi" })
  } catch (error) {
    logger.error("Verify email failed", error, { path: "/api/auth/verify-email" })
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 })
  }
}
