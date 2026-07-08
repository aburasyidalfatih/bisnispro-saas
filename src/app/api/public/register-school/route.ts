import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { sendApplicationNotification, sendNewApplicationAlerts } from "@/features/tenant/services/application.service"
import { checkWhatsAppNumber } from "@/features/notification/services/notification.service"
import { parseBody } from "@/lib/api-utils"
import { rateLimit } from "@/lib/rate-limit"
import bcrypt from "bcryptjs"

const registerSchoolSchema = z.object({
  schoolName: z.string().min(3, "Nama sekolah minimal 3 karakter").max(200),
  schoolSlug: z
    .string()
    .min(3, "Subdomain minimal 3 karakter")
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug hanya boleh huruf kecil, angka, dan strip"),
  npsn: z.string().min(8, "NPSN harus 8 digit").max(8, "NPSN harus 8 digit"),
  schoolStatus: z.enum(["NEGERI", "SWASTA"]).optional().default("SWASTA"),
  province: z.string().min(2, "Provinsi wajib diisi"),
  regency: z.string().min(2, "Kabupaten/Kota wajib diisi"),
  adminName: z.string().min(2, "Nama admin minimal 2 karakter").max(100),
  adminEmail: z.string().email("Email tidak valid").refine((val) => val.toLowerCase().endsWith("@gmail.com"), "Wajib menggunakan layanan @gmail.com"),
  adminPhone: z.string().min(10, "Nomor telepon minimal 10 digit").max(15),
  adminPosition: z.string().min(2, "Jabatan penanggung jawab wajib diisi"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  address: z.string().min(5, "Alamat wajib diisi"),
  logo: z.string().min(1, "Logo wajib diunggah"),
  studentCount: z.coerce.number().min(1, "Jumlah siswa harus lebih dari 0"),
  referralCode: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  utmContent: z.string().optional(),
  utmTerm: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "anonymous"
    const { success } = await rateLimit(`register-school:${ip}`, 5, 600_000)
    if (!success) {
      return NextResponse.json({ error: "Terlalu banyak pengajuan. Coba lagi nanti." }, { status: 429 })
    }

    const parsed = await parseBody(req, registerSchoolSchema)
    if (parsed.error) return parsed.error

    const {
      schoolName, schoolSlug, npsn, schoolStatus,
      province, regency, adminName, adminEmail, adminPhone, adminPosition, password, address, logo, studentCount, referralCode,
      utmSource, utmMedium, utmCampaign, utmContent, utmTerm
    } = parsed.data

    // Validasi Nomor WhatsApp Admin
    const waCheck = await checkWhatsAppNumber(adminPhone)
    if (!waCheck.isValid) {
      return NextResponse.json({ 
        error: "Nomor telepon Admin tidak valid atau tidak terdaftar di WhatsApp. Pastikan menggunakan nomor Indonesia (awalan 08/628)." 
      }, { status: 400 })
    }

    // Cek ketersediaan slug/subdomain di tabel Tenant utama
    const existingTenant = await db.tenant.findUnique({ where: { slug: schoolSlug } })
    if (existingTenant) {
      return NextResponse.json({ error: "Subdomain sudah digunakan oleh sekolah lain" }, { status: 400 })
    }

    // Cek duplikasi di pengajuan aplikasi (NPSN, Email, atau Slug)
    const existingApp = await db.tenantApplication.findFirst({
      where: {
        OR: [
          { schoolSlug },
          { adminEmail },
          { npsn }
        ],
        status: { not: "REJECTED" } // Boleh daftar ulang jika sebelumnya ditolak
      }
    })
    
    if (existingApp) {
      if (existingApp.schoolSlug === schoolSlug) {
        return NextResponse.json({ error: "Subdomain sudah diajukan sebelumnya" }, { status: 400 })
      }
      if (existingApp.npsn === npsn) {
        return NextResponse.json({ error: "Sekolah dengan NPSN ini sudah terdaftar" }, { status: 400 })
      }
      if (existingApp.adminEmail === adminEmail) {
        return NextResponse.json({ error: "Email ini sedang dalam proses pengajuan sekolah lain" }, { status: 400 })
      }
    }

    // Cek apakah email sudah terdaftar sebagai User di platform
    const existingUser = await db.user.findUnique({ where: { email: adminEmail } })
    if (existingUser) {
      return NextResponse.json({ error: "Email ini sudah terdaftar sebagai pengguna SchoolPro" }, { status: 400 })
    }

    let affiliateId = undefined
    if (referralCode) {
      const affiliate = await db.affiliateProfile.findFirst({
        where: {
          OR: [
            { referralCode: { equals: referralCode, mode: "insensitive" } },
            { referralCode: { equals: `ref-${referralCode}`, mode: "insensitive" } }
          ]
        }
      })
      if (affiliate && affiliate.isActive) {
        affiliateId = affiliate.id
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const application = await db.tenantApplication.create({
      data: {
        schoolName,
        schoolSlug,
        npsn,
        schoolStatus,
        province,
        regency,
        adminName,
        adminEmail,
        adminPhone: waCheck.formatted || adminPhone,
        adminPosition,
        hashedPassword,
        address,
        logo,
        studentCount,
        status: "PENDING",
        affiliateId,
        utmSource: utmSource || null,
        utmMedium: utmMedium || null,
        utmCampaign: utmCampaign || null,
        utmContent: utmContent || null,
        utmTerm: utmTerm || null,
      }
    })

    // Kirim notifikasi WA status PENDING
    // Cek apakah Auto Approve Instant aktif
    const instantApproveSetting = await db.platformSetting.findUnique({ where: { key: "AUTO_APPROVE_APPLICATIONS_INSTANT" } })
    const isInstant = instantApproveSetting?.value === "true"

    if (isInstant) {
      // 1. Generate Token
      const crypto = require("crypto")
      const token = crypto.randomBytes(32).toString("hex")
      
      // 2. Simpan di Redis (Expired dalam 24 Jam)
      const { getRedisClient } = require("@/lib/redis")
      const redis = await getRedisClient()
      await redis.set(`verification:school:${token}`, application.id, 86400)

      // 3. Kirim Email Verifikasi
      const { sendEmail } = require("@/features/notification/services/notification.service")
      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "schoolpro.id"
      const verifyUrl = `https://${rootDomain}/api/public/verify-email?token=${token}`
      const platformName = process.env.NEXT_PUBLIC_APP_NAME || "SchoolPro"
      
      const emailHtml = `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 24px; border-radius: 12px 12px 0 0; color: white; text-align: center;">
            <h2 style="margin: 0;">Verifikasi Email Anda</h2>
            <p style="margin: 4px 0 0; opacity: 0.9;">Untuk mengaktifkan website sekolah Anda</p>
          </div>
          <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; line-height: 1.6; text-align: center;">
            <p>Halo <strong>${adminName}</strong>,</p>
            <p>Terima kasih telah mendaftarkan <strong>${schoolName}</strong> di ${platformName}.</p>
            <p>Satu langkah lagi! Silakan klik tombol di bawah ini untuk memverifikasi alamat email Anda. Setelah email terverifikasi, subdomain sekolah Anda akan <strong>langsung aktif</strong> seketika.</p>
            <div style="margin: 32px 0;">
              <a href="${verifyUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Verifikasi & Aktifkan Sekolah</a>
            </div>
            <p style="font-size: 13px; color: #64748b;">Link verifikasi ini akan kadaluarsa dalam 24 jam.<br>Jika tombol tidak berfungsi, salin dan tempel URL berikut di browser Anda:<br><span style="word-break: break-all; color: #3b82f6;">${verifyUrl}</span></p>
          </div>
          <div style="background: #f1f5f9; padding: 12px 24px; border-radius: 0 0 12px 12px; text-align: center; color: #94a3b8; font-size: 12px;">
            ${platformName} — Platform Edukasi Terintegrasi
          </div>
        </div>
      `
      await sendEmail(adminEmail, "Verifikasi Email Pendaftaran Sekolah", emailHtml).catch((e: any) => logger.error("Failed sending verify email", e))
      
      // Kirim alert ke SuperAdmin agar tahu ada pendaftaran (opsional, tapi baik untuk logging)
      await sendNewApplicationAlerts(application.id, affiliateId)
    } else {
      // Alur normal (Pending Approval manual / 24h cron)
      await sendApplicationNotification(application.id)
      await sendNewApplicationAlerts(application.id, affiliateId)
    }

    // Ambil nomor CS dari pengaturan platform
    let csPhone = ""
    try {
      const csSetting = await db.platformSetting.findUnique({ where: { key: "SUPPORT_WA_NUMBERS" } })
      if (csSetting && csSetting.value) {
        const parsed = JSON.parse(csSetting.value)
        if (parsed.length > 0 && parsed[0].number) {
          csPhone = parsed[0].number
        }
      }
    } catch (e) {
      logger.error("Gagal parse SUPPORT_WA_NUMBERS", e)
    }

    return NextResponse.json({ message: "Pengajuan berhasil dikirim", id: application.id, csPhone })
  } catch (error) {
    logger.error("Registration error", error, { path: "/api/public/register-school" })
    return NextResponse.json({ error: "Gagal mengirim pengajuan" }, { status: 500 })
  }
}
