import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { getRedisClient } from "@/lib/redis"
import { approveApplication } from "@/features/tenant/services/application.service"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json({ error: "Token tidak valid atau tidak ditemukan" }, { status: 400 })
    }

    const redis = await getRedisClient()
    const applicationId = await redis.get(`verification:school:${token}`)

    if (!applicationId) {
      return new NextResponse(`
        <html>
          <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #dc2626;">Link Verifikasi Kadaluarsa atau Tidak Valid</h1>
            <p>Link verifikasi ini mungkin sudah digunakan atau melewati batas waktu 24 jam.</p>
            <p>Silakan hubungi administrator jika Anda memerlukan bantuan.</p>
          </body>
        </html>
      `, { status: 400, headers: { 'Content-Type': 'text/html' } })
    }

    // Ambil data pengajuan
    const app = await db.tenantApplication.findUnique({ where: { id: applicationId } })
    if (!app) {
      return NextResponse.json({ error: "Pengajuan tidak ditemukan" }, { status: 404 })
    }

    if (app.status === "APPROVED") {
      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "schoolpro.id"
      return NextResponse.redirect(`https://${app.schoolSlug}.${rootDomain}/login?verified=true`)
    }

    // Setujui instan (Ini akan membuat Tenant dan User Admin)
    await approveApplication(applicationId)

    // Update status pengajuan di database agar tercatat sebagai disetujui (approveApplication sebenarnya sudah melakukannya, tapi kita pastikan jika ada logika tambahan)
    await db.tenantApplication.update({
      where: { id: applicationId },
      data: { status: "APPROVED", adminMessage: "Disetujui otomatis (Verifikasi Email Instan)" }
    })

    // Setelah disetujui, User admin sudah tercipta. Kita set emailVerified agar valid.
    const user = await db.user.findUnique({ where: { email: app.adminEmail } })
    if (user) {
      await db.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() }
      })
    }

    // Hapus token agar tidak bisa dipakai 2x
    await redis.del(`verification:school:${token}`)

    // Redirect ke halaman login subdomain
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "schoolpro.id"
    return NextResponse.redirect(`https://${app.schoolSlug}.${rootDomain}/login?verified=true`)

  } catch (error) {
    logger.error("Verify email error", error, { path: "/api/public/verify-email" })
    return new NextResponse(`
      <html>
        <body style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: #dc2626;">Terjadi Kesalahan Sistem</h1>
          <p>Mohon maaf, terjadi kesalahan saat memverifikasi email Anda.</p>
          <p>Silakan coba beberapa saat lagi atau hubungi support.</p>
        </body>
      </html>
    `, { status: 500, headers: { 'Content-Type': 'text/html' } })
  }
}
