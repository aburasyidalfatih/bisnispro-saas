import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { sendApplicationNotification, sendNewApplicationAlerts } from "@/lib/services/application"
import { parseBody } from "@/lib/api-utils"

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
  adminEmail: z.string().email("Email tidak valid"),
  adminPhone: z.string().min(10, "Nomor telepon minimal 10 digit").max(15),
  address: z.string().min(5, "Alamat wajib diisi"),
  logo: z.string().min(1, "Logo wajib diunggah"),
  studentCount: z.coerce.number().min(1, "Jumlah siswa harus lebih dari 0"),
  referralCode: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const parsed = await parseBody(req, registerSchoolSchema)
    if (parsed.error) return parsed.error

    const {
      schoolName, schoolSlug, npsn, schoolStatus,
      province, regency, adminName, adminEmail, adminPhone, address, logo, studentCount, referralCode
    } = parsed.data

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
            { referralCode },
            { referralCode: `ref-${referralCode}` }
          ]
        }
      })
      if (affiliate && affiliate.isActive) {
        affiliateId = affiliate.id
      }
    }

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
        adminPhone,
        address,
        logo,
        studentCount,
        status: "PENDING",
        affiliateId
      }
    })

    // Kirim notifikasi WA status PENDING
    await sendApplicationNotification(application.id)
    await sendNewApplicationAlerts(application.id, affiliateId)

    return NextResponse.json({ message: "Pengajuan berhasil dikirim", id: application.id })
  } catch (error) {
    logger.error("Registration error", error, { path: "/api/public/register-school" })
    return NextResponse.json({ error: "Gagal mengirim pengajuan" }, { status: 500 })
  }
}
