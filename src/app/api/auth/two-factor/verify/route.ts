import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { enableTwoFactor } from "@/features/auth/services/two-factor.service"
import { z } from "zod"
import { parseBody } from "@/lib/api-utils"
import { logger } from "@/lib/logger"

const schema = z.object({
  code: z.string().length(6, "Kode OTP harus 6 digit"),
})

// POST: verify code and enable 2FA
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const parsed = await parseBody(req, schema)
    if (parsed.error) return parsed.error

    const result = await enableTwoFactor(session.user.id, parsed.data.code)
    if (!result.success || !result.data) {
      return NextResponse.json({ error: result.error || "Gagal mengaktifkan 2FA" }, { status: 400 })
    }

    return NextResponse.json({
      message: "2FA berhasil diaktifkan",
      backupCodes: result.data.backupCodes,
    })
  } catch (error) {
    logger.error("2FA verify failed", error, { path: "/api/auth/two-factor/verify" })
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 })
  }
}
