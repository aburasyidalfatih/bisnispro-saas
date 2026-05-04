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
  province: z.string().optional(),
  regency: z.string().optional(),
  adminName: z.string().min(2, "Nama admin minimal 2 karakter").max(100),
  adminEmail: z.string().email("Email tidak valid"),
  adminPhone: z.string().min(10, "Nomor telepon minimal 10 digit").max(15),
  address: z.string().optional(),
  logo: z.string().optional().nullable(),
  referralCode: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const parsed = await parseBody(req, registerSchoolSchema)
    if (parsed.error) return parsed.error

    const {
      schoolName, schoolSlug, npsn, schoolStatus,
      province, regency, adminName, adminEmail, adminPhone, address, logo, referralCode
    } = parsed.data

    // Cek ketersediaan slug/subdomain
    const existingTenant = await db.tenant.findUnique({ where: { slug: schoolSlug } })
    const existingApp = await db.tenantApplication.findUnique({ where: { schoolSlug } })
    
    if (existingTenant || existingApp) {
      return NextResponse.json({ error: "Subdomain sudah digunakan" }, { status: 400 })
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
