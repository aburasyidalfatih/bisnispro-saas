import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import { invalidatePublicTenantCache } from "@/features/tenant/services/tenant-public.service"
import { Prisma } from "@prisma/client"

export async function POST(req: NextRequest) {
  const session = await auth()
  const tenantId = (session?.user as any)?.tenants?.[0]?.id

  if (!session || !tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await db.$transaction(async (tx) => {
      // Set tenant context for RLS
      await tx.$executeRaw`SELECT set_config('app.current_tenant', ${tenantId}, TRUE)`
      await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, TRUE)`

      // Step 1: Use raw SQL to delete ALL menus for this tenant
      // Delete children first (parentId IS NOT NULL), then parents
      await tx.$executeRaw`DELETE FROM "website_menus" WHERE "tenantId" = ${tenantId} AND "parentId" IS NOT NULL`
      await tx.$executeRaw`DELETE FROM "website_menus" WHERE "tenantId" = ${tenantId}`

      // Step 2: Re-create full default hierarchical structure
      const beranda = await tx.websiteMenu.create({ data: { tenantId, label: "Beranda", url: "/", isSystem: true, order: 0 } })
      const profil = await tx.websiteMenu.create({ data: { tenantId, label: "Profil Sekolah", url: "/profil", isSystem: false, order: 1 } })
      const informasi = await tx.websiteMenu.create({ data: { tenantId, label: "Informasi", url: "/berita", isSystem: false, order: 2 } })
      const galeri = await tx.websiteMenu.create({ data: { tenantId, label: "Galeri", url: "/gallery", isSystem: false, order: 3 } })
      await tx.websiteMenu.create({ data: { tenantId, label: "Kontak", url: "/contact", isSystem: false, order: 4 } })

      await tx.websiteMenu.createMany({ data: [
        { tenantId, label: "Profil Lembaga", url: "/profil", parentId: profil.id, order: 0 },
        { tenantId, label: "Guru & Staf (GTK)", url: "/gtk", parentId: profil.id, order: 1 },
        { tenantId, label: "Fasilitas Sekolah", url: "/fasilitas", parentId: profil.id, order: 2 },
        { tenantId, label: "Program Unggulan", url: "/program", parentId: profil.id, order: 3 },
        { tenantId, label: "Ekstrakurikuler", url: "/ekstrakurikuler", parentId: profil.id, order: 4 },
      ]})

      await tx.websiteMenu.createMany({ data: [
        { tenantId, label: "Berita & Artikel", url: "/berita", parentId: informasi.id, order: 0 },
        { tenantId, label: "Agenda & Acara", url: "/agenda", parentId: informasi.id, order: 1 },
        { tenantId, label: "Pusat Unduhan", url: "/unduhan", parentId: informasi.id, order: 2 },
      ]})

      await tx.websiteMenu.createMany({ data: [
        { tenantId, label: "Galeri Foto", url: "/gallery", parentId: galeri.id, order: 0 },
        { tenantId, label: "Prestasi Siswa", url: "/prestasi", parentId: galeri.id, order: 1 },
        { tenantId, label: "Alumni Success", url: "/alumni", parentId: galeri.id, order: 2 },
      ]})
    })

    // Step 3: Invalidate public cache
    const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
    if (tenant) await invalidatePublicTenantCache(tenant.slug)

    return NextResponse.json({ success: true, message: "Menu berhasil direset ke default." })
  } catch (error) {
    console.error("[WEBSITE_MENU_RESET]", error)
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}
