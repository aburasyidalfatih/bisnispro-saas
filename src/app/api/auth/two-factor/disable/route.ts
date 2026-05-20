import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { disableTwoFactor } from "@/features/auth/services/two-factor.service"
import { z } from "zod"
import { parseBody } from "@/lib/api-utils"
import { logger } from "@/lib/logger"

const schema = z.object({
  password: z.string().min(1, "Password harus diisi"),
})

// POST: disable 2FA (requires password confirmation)
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const parsed = await parseBody(req, schema)
    if (parsed.error) return parsed.error

    const bcrypt = await import("bcryptjs")
    const { db } = await import("@/lib/db")
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 })
    }

    const isValid = await bcrypt.compare(parsed.data.password, user.password)
    if (!isValid) {
      return NextResponse.json({ error: "Password salah" }, { status: 400 })
    }

    const result = await disableTwoFactor(session.user.id)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ message: "2FA berhasil dinonaktifkan" })
  } catch (error) {
    logger.error("2FA disable failed", error, { path: "/api/auth/two-factor/disable" })
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 })
  }
}
