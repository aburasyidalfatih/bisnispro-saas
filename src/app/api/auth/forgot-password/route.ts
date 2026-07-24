import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { createToken } from "@/features/auth/services/token.service"
import { sendEmail } from "@/features/notification/services/notification.service"
import { rateLimit } from "@/lib/rate-limit"
import { forgotPasswordSchema } from "@/features/auth/schemas/auth.schema"
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

    // Coba dapatkan tenantId dari hostname agar email dikirim dari SMTP perusahaan jika ada
    const host = req.headers.get("host") || ""
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "bisnispro.id"
    const hostWithoutPort = host.split(":")[0]
    let tenantId = undefined

    if (hostWithoutPort !== "localhost" && hostWithoutPort !== rootDomain && hostWithoutPort !== `www.${rootDomain}`) {
      const slug = hostWithoutPort.replace(`.${rootDomain}`, "").split(".")[0]
      const tenant = await db.tenant.findUnique({ where: { slug }, select: { id: true } })
      if (tenant) tenantId = tenant.id
    }

    const { token } = await createToken(user.id, "password_reset", 1)
    const origin = req.headers.get("origin") || process.env.AUTH_URL || "https://bisnispro.id"
    const resetUrl = `${origin}/reset-password?token=${token}`

    const emailResult = await sendEmail(
      user.email,
      "Reset Password — BisnisPro",
      `<div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 24px; border-radius: 12px 12px 0 0; color: white;">
          <h2 style="margin: 0;">🔐 Reset Password</h2>
          <p style="margin: 4px 0 0; opacity: 0.9;">BisnisPro</p>
        </div>
        <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; line-height: 1.6;">
          <p>Halo <strong>${user.name}</strong>,</p>
          <p>Kami menerima permintaan untuk mereset password akun Anda. Klik tombol di bawah untuk membuat password baru:</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px;">Reset Password</a>
          </div>
          <p style="color: #64748b; font-size: 13px;">Link ini berlaku selama 1 jam. Jika Anda tidak meminta reset password, abaikan email ini.</p>
        </div>
        <div style="background: #f1f5f9; padding: 12px 24px; border-radius: 0 0 12px 12px; text-align: center; color: #94a3b8; font-size: 12px;">
          BisnisPro — Platform Edukasi Terintegrasi
        </div>
      </div>`,
      tenantId
    ).catch((e) => ({ success: false, error: e.message }))
    
    logger.info("Forgot Password Email Result:", emailResult)

    return NextResponse.json({ 
      message: "Jika email terdaftar, link reset akan dikirim."
    })
  } catch (error) {
    logger.error("Forgot password failed", error, { path: "/api/auth/forgot-password" })
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 })
  }
}
