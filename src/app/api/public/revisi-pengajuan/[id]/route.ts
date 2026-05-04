import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { parseBody } from "@/lib/api-utils"

const reviseSchoolSchema = z.object({
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
  adminPhone: z.string().min(10, "Nomor telepon minimal 10 digit").max(15),
  address: z.string().optional(),
  logo: z.string().optional().nullable(),
})

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const application = await db.tenantApplication.findUnique({ where: { id } })

    if (!application) {
      return NextResponse.json({ error: "Pengajuan tidak ditemukan" }, { status: 404 })
    }

    if (application.status !== "REVISION") {
      return NextResponse.json({ error: "Pengajuan ini tidak dalam status revisi" }, { status: 400 })
    }

    const parsed = await parseBody(req, reviseSchoolSchema)
    if (parsed.error) return parsed.error

    const {
      schoolName, schoolSlug, npsn, schoolStatus,
      province, regency, adminName, adminPhone, address, logo
    } = parsed.data

    // Cek ketersediaan slug/subdomain jika berubah
    if (schoolSlug !== application.schoolSlug) {
      const existingTenant = await db.tenant.findUnique({ where: { slug: schoolSlug } })
      const existingApp = await db.tenantApplication.findUnique({ where: { schoolSlug } })
      
      if (existingTenant || (existingApp && existingApp.id !== id)) {
        return NextResponse.json({ error: "Subdomain sudah digunakan oleh sekolah lain" }, { status: 400 })
      }
    }

    await db.tenantApplication.update({
      where: { id },
      data: {
        schoolName,
        schoolSlug,
        npsn,
        schoolStatus,
        province,
        regency,
        adminName,
        adminPhone,
        address,
        logo,
        status: "PENDING", // Set back to PENDING for Super Admin to review
      }
    })

    return NextResponse.json({ message: "Pengajuan berhasil direvisi", id })
  } catch (error) {
    logger.error("Revision error", error, { path: "/api/public/revisi-pengajuan/[id]" })
    return NextResponse.json({ error: "Gagal merevisi pengajuan" }, { status: 500 })
  }
}
