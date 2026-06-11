import { runWithTenantContext } from"@/lib/db"
import { auth } from"@/lib/auth"
import { redirect } from"next/navigation"
import { MenuBuilder } from"./_components/menu-builder"
import { ResetMenuButton } from"./_components/reset-menu-button"

export const metadata = {
  title:"Kelola Menu Website",
  description:"Atur navigasi utama website sekolah Anda"
}

export default async function WebsiteMenuPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  
  const tenantId = (session.user as any).tenants?.[0]?.id
  if (!tenantId) redirect("/login")

  await runWithTenantContext(tenantId, async (tx) => {
    const menuCount = await tx.websiteMenu.count({ where: { tenantId } })
    if (menuCount > 0) return

    // Seed default menus if empty: full hierarchical structure.
    await tx.websiteMenu.create({ data: { tenantId, label:"Beranda", url:"/", isSystem: true, order: 0 } })
    const profil = await tx.websiteMenu.create({ data: { tenantId, label:"Profil Sekolah", url:"/profil", isSystem: false, order: 1 } })
    const informasi = await tx.websiteMenu.create({ data: { tenantId, label:"Informasi", url:"/berita", isSystem: false, order: 2 } })
    const galeri = await tx.websiteMenu.create({ data: { tenantId, label:"Galeri", url:"/gallery", isSystem: false, order: 3 } })
    await tx.websiteMenu.create({ data: { tenantId, label:"Kontak", url:"/contact", isSystem: false, order: 4 } })

    await tx.websiteMenu.createMany({ data: [
      { tenantId, label:"Profil Lembaga", url:"/profil", parentId: profil.id, order: 0 },
      { tenantId, label:"Guru & Staf (GTK)", url:"/gtk", parentId: profil.id, order: 1 },
      { tenantId, label:"Fasilitas Sekolah", url:"/fasilitas", parentId: profil.id, order: 2 },
      { tenantId, label:"Program Unggulan", url:"/program", parentId: profil.id, order: 3 },
      { tenantId, label:"Ekstrakurikuler", url:"/ekstrakurikuler", parentId: profil.id, order: 4 },
    ]})

    await tx.websiteMenu.createMany({ data: [
      { tenantId, label:"Berita & Artikel", url:"/berita", parentId: informasi.id, order: 0 },
      { tenantId, label:"Agenda & Acara", url:"/agenda", parentId: informasi.id, order: 1 },
      { tenantId, label:"Pusat Unduhan", url:"/unduhan", parentId: informasi.id, order: 2 },
    ]})

    await tx.websiteMenu.createMany({ data: [
      { tenantId, label:"Galeri Foto", url:"/gallery", parentId: galeri.id, order: 0 },
      { tenantId, label:"Prestasi Siswa", url:"/prestasi", parentId: galeri.id, order: 1 },
      { tenantId, label:"Alumni Success", url:"/alumni", parentId: galeri.id, order: 2 },
    ]})
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Navigasi Website</h1>
          <p className="text-muted-foreground mt-1">
            Atur struktur menu navigasi (header) untuk website publik sekolah Anda.
          </p>
        </div>
        <ResetMenuButton />
      </div>
      
      <div className="bg-card border rounded-xl shadow-sm p-4 sm:p-6 overflow-hidden">
        <MenuBuilder />
      </div>
    </div>
  )
}

