import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { verifyAppRegistrationToken, consumeAppRegistrationToken } from "@/features/auth/services/token.service"
import { approveApplication } from "@/features/tenant/services/application.service"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get("token")

    if (!token) {
      return new NextResponse(`
        <html>
          <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #dc2626;">Token Tidak Valid</h1>
            <p>Token verifikasi tidak ditemukan.</p>
          </body>
        </html>
      `, { status: 400, headers: { 'Content-Type': 'text/html' } })
    }

    const tokenRecord = await verifyAppRegistrationToken(token)

    if (!tokenRecord.success || !tokenRecord.data?.applicationId) {
      return new NextResponse(`
        <html>
          <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #dc2626;">Link Verifikasi Tidak Valid</h1>
            <p>Link verifikasi ini mungkin tidak valid atau sudah pernah digunakan.</p>
            <p>Jika perusahaan Anda sudah diverifikasi, silakan langsung login. Jika belum, silakan hubungi administrator.</p>
          </body>
        </html>
      `, { status: 400, headers: { 'Content-Type': 'text/html' } })
    }

    // Return HTML confirmation page to prevent WhatsApp/Telegram bots from consuming the token on GET
    return new NextResponse(`
      <html>
        <head>
          <title>Verifikasi Email - BisnisPro</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body style="font-family: sans-serif; text-align: center; padding: 50px; background-color: #f8fafc;">
          <div style="max-width: 500px; margin: 0 auto; background: white; padding: 40px 30px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
            <div style="margin-bottom: 20px;">
              <svg style="width: 64px; height: 64px; color: #4f46e5; margin: 0 auto;" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76"></path>
              </svg>
            </div>
            <h1 style="color: #0f172a; margin-bottom: 16px; font-size: 24px;">Verifikasi Email Pendaftaran</h1>
            <p style="color: #475569; line-height: 1.6; margin-bottom: 32px; font-size: 15px;">
              Terima kasih telah mendaftar di BisnisPro. Silakan klik tombol di bawah ini untuk memverifikasi email Anda dan mengaktifkan sistem perusahaan Anda.
            </p>
            <form method="POST" action="/api/public/verify-email?token=${token}">
              <button type="submit" style="background: #4f46e5; color: white; border: none; padding: 14px 28px; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: background 0.3s; width: 100%; max-width: 300px;">
                Verifikasi Email Saya
              </button>
            </form>
          </div>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } })

  } catch (error) {
    logger.error("Verify email GET error", error, { path: "/api/public/verify-email" })
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

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get("token")

    if (!token) {
      return new NextResponse(`
        <html>
          <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #dc2626;">Token Tidak Valid</h1>
            <p>Token verifikasi tidak ditemukan.</p>
          </body>
        </html>
      `, { status: 400, headers: { 'Content-Type': 'text/html' } })
    }

    const tokenRecord = await verifyAppRegistrationToken(token)

    if (!tokenRecord.success || !tokenRecord.data?.applicationId) {
      return new NextResponse(`
        <html>
          <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #dc2626;">Link Verifikasi Kadaluarsa atau Tidak Valid</h1>
            <p>Link verifikasi ini mungkin sudah digunakan atau melewati batas waktu 24 jam.</p>
            <p>Jika perusahaan Anda sudah diverifikasi, silakan langsung login. Jika belum, silakan hubungi administrator.</p>
          </body>
        </html>
      `, { status: 400, headers: { 'Content-Type': 'text/html' } })
    }

    // Ambil data pengajuan
    const applicationId = tokenRecord.data.applicationId
    const app = await db.tenantApplication.findUnique({ where: { id: applicationId } })
    if (!app) {
      return new NextResponse(`
        <html>
          <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #dc2626;">Pengajuan tidak ditemukan</h1>
            <p>Data pendaftaran perusahaan Anda tidak ditemukan di sistem.</p>
          </body>
        </html>
      `, { status: 404, headers: { 'Content-Type': 'text/html' } })
    }

    if (app.status === "APPROVED") {
      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "bisnispro.id"
      return NextResponse.redirect(`https://${app.businessSlug}.${rootDomain}/login?verified=true`, 303)
    }

    // Setujui instan (Ini akan membuat Tenant dan User Admin)
    await approveApplication(applicationId)

    // Update status pengajuan di database agar tercatat sebagai disetujui
    await db.tenantApplication.update({
      where: { id: applicationId },
      data: { status: "APPROVED", adminMessage: "Disetujui otomatis (Verifikasi Email Instan)" }
    })

    // 2. Tandai token sudah dipakai (hapus dari Redis)
    await consumeAppRegistrationToken(token)

    // 3. Jalankan alur persetujuan utama (membuat Tenant, membuat Super Admin Tenant, kirim WA/Email "Approved")
    const user = await db.user.findUnique({ where: { email: app.adminEmail.toLowerCase() } })
    if (user) {
      await db.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() }
      })
    }
    
    // Redirect ke halaman login subdomain dengan status 303 (See Other) agar browser melakukan GET request
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "bisnispro.id"
    return NextResponse.redirect(`https://${app.businessSlug}.${rootDomain}/login?verified=true`, 303)

  } catch (error) {
    logger.error("Verify email POST error", error, { path: "/api/public/verify-email" })
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





