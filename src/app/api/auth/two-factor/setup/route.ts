import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { generateTwoFactorSecret } from "@/features/auth/services/two-factor.service"
import { logger } from "@/lib/logger"

// POST: generate 2FA secret + QR code
export async function POST() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await generateTwoFactorSecret(
      session.user.id,
      session.user.email!
    )

    if (!result.success || !result.data) {
      return NextResponse.json({ error: "Gagal membuat secret 2FA" }, { status: 500 })
    }

    return NextResponse.json({
      qrCode: result.data.qrCode,
      secret: result.data.secret,
    })
  } catch (error) {
    logger.error("2FA setup failed", error, { path: "/api/auth/two-factor/setup" })
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 })
  }
}
