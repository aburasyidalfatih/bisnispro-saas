import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { createToken } from "@/lib/services/token"
import { sendEmail } from "@/lib/services/notification"
import { rateLimit } from "@/lib/rate-limit"
import { forgotPasswordSchema } from "@/lib/validations/auth"
import { parseBody } from "@/lib/api-utils"
import { logger } from "@/lib/logger"

export async function POST(req: Request) {
  try {
    // Rate limit: 5 requests per minute per IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "anonymous"
    const { success } = await rateLimit(`auth:forgot:${ip}`, 5, 60_000)
    if (!success) {
      return NextResponse.json({ error: "Terlalu banyak permintaan. Coba lagi nanti." }, { status: 429 })
    }

    const parsed = await parseBody(req, forgotPasswordSchema)
    if (parsed.error) return parsed.error
    const email = parsed.data.email.toLowerCase().trim()

    const user = await db.user.findUnique({ where: { email } })

    // Selalu return sukses untuk mencegah email enumeration
    if (!user) return NextResponse.json({ message: "Jika email terdaftar, link reset akan dikirim." })

    // Coba dapatkan tenantId dari hostname agar email dikirim dari SMTP sekolah jika ada
    const host = req.headers.get("host") || ""
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "schoolpro.id"
    const hostWithoutPort = host.split(":")[0]
    let tenantId = undefined

    if (hostWithoutPort !== "localhost" && hostWithoutPort !== rootDomain && hostWithoutPort !== `www.${rootDomain}`) {
      const slug = hostWithoutPort.replace(`.${rootDomain}`, "").split(".")[0]
      const tenant = await db.tenant.findUnique({ where: { slug }, select: { id: true } })
      if (tenant) tenantId = tenant.id
    }

    const { token } = await createToken(user.id, "password_reset", 1)
    const origin = req.headers.get("origin") || process.env.AUTH_URL || "https://schoolpro.id"
    const resetUrl = `${origin}/reset-password?token=${token}`

    const emailResult = await sendEmail(
      user.email,
      "Reset Password — SchoolPro",
      `<div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2>Reset Password</h2>
        <p>Halo ${user.name},</p>
        <p>Klik tombol di bawah untuk mereset password Anda. Link berlaku 1 jam.</p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#6c47ff;color:#fff;border-radius:8px;text-decoration:none;margin:16px 0">Reset Password</a>
        <p style="color:#888;font-size:13px">Jika Anda tidak meminta reset password, abaikan email ini.</p>
      </div>`,
      tenantId
    ).catch((e) => ({ success: false, error: e.message }))
    
    logger.info("Forgot Password Email Result:", emailResult)

    return NextResponse.json({ 
      message: "Jika email terdaftar, link reset akan dikirim.",
      debug: emailResult
    })
  } catch (error) {
    logger.error("Forgot password failed", error, { path: "/api/auth/forgot-password" })
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 })
  }
}
