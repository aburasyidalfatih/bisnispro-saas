import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/api-utils"
import { z } from "zod"

const changeSubdomainSchema = z.object({
  tenantId: z.string(),
  newSlug: z.string()
    .min(3, "Subdomain minimal 3 karakter")
    .max(50, "Subdomain maksimal 50 karakter")
    .regex(/^[a-z0-9-]+$/, "Subdomain hanya boleh berisi huruf kecil, angka, dan strip (-)"),
})

export async function PUT(req: Request) {
  const { session, error } = await requireAuth()
  if (error) return error

  try {
    const body = await req.json()
    const parsed = changeSubdomainSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { tenantId, newSlug } = parsed.data

    const tu = await db.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId, userId: session.user.id } },
    })
    
    if (!session.user.isSuperAdmin && (!tu || !["owner", "admin"].includes(tu.role))) {
      return NextResponse.json({ error: "Tidak punya izin" }, { status: 403 })
    }

    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: { slug: true, settings: true },
    })
    
    if (!tenant) {
      return NextResponse.json({ error: "Tenant tidak ditemukan" }, { status: 404 })
    }

    const settings = (tenant.settings as Record<string, any>) || {}
    
    if (settings.hasChangedSubdomain) {
      return NextResponse.json({ 
        error: "Anda sudah pernah mengganti subdomain. Penggantian hanya diperbolehkan 1 kali." 
      }, { status: 403 })
    }

    if (tenant.slug === newSlug) {
      return NextResponse.json({ error: "Subdomain baru harus berbeda dengan yang lama." }, { status: 400 })
    }

    // Cek apakah subdomain sudah dipakai tenant lain atau masuk dalam reserved word list
    const reservedSlugs = ["admin", "superadmin", "api", "auth", "static", "assets", "dashboard", "site", "schoolpro"]
    if (reservedSlugs.includes(newSlug)) {
      return NextResponse.json({ error: "Subdomain ini tidak dapat digunakan." }, { status: 400 })
    }

    const existing = await db.tenant.findUnique({ where: { slug: newSlug } })
    if (existing) {
      return NextResponse.json({ 
        error: "Subdomain sudah digunakan oleh sekolah lain. Silakan pilih yang berbeda." 
      }, { status: 409 })
    }

    // Update slug dan flag hasChangedSubdomain
    await db.tenant.update({
      where: { id: tenantId },
      data: {
        slug: newSlug,
        settings: {
          ...settings,
          hasChangedSubdomain: true
        }
      }
    })

    return NextResponse.json({ message: "Subdomain berhasil diubah" })
  } catch (err: any) {
    return NextResponse.json({ error: "Terjadi kesalahan internal peladen" }, { status: 500 })
  }
}
