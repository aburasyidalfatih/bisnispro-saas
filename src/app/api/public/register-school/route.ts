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
    await sendApplicationNotification(application.id)
    await sendNewApplicationAlerts(application.id, affiliateId)

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
