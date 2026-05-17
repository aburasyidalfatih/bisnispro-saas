import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { MenuBuilder } from "./_components/menu-builder"

export const metadata = {
  title: "Kelola Menu Website",
  description: "Atur navigasi utama website sekolah Anda"
}

export default async function WebsiteMenuPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/login")
  
  const tenantId = session.user.tenants?.[0]?.id
  if (!tenantId) redirect("/login")

  // Ensure initial data exists
  const menus = await db.websiteMenu.findMany({
    where: { tenantId },
    orderBy: { order: "asc" }
  })

  // Seed default menus if empty
  if (menus.length === 0) {
    const defaultMenus = [
      { label: "Beranda", url: "/", isSystem: true, order: 0 },
      { label: "Profil Sekolah", url: "/profil", isSystem: false, order: 1 },
      { label: "Berita", url: "/berita", isSystem: false, order: 2 },
      { label: "Galeri", url: "/gallery", isSystem: false, order: 3 },
      { label: "Kontak", url: "/contact", isSystem: false, order: 4 },
    ]
    
    await db.$transaction(
      defaultMenus.map(m => db.websiteMenu.create({
        data: { ...m, tenantId }
      }))
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Navigasi Website</h1>
        <p className="text-muted-foreground mt-1">
          Atur struktur menu navigasi (header) untuk website publik sekolah Anda.
        </p>
      </div>
      
      <div className="bg-card border rounded-xl shadow-sm p-4 sm:p-6 overflow-hidden">
        <MenuBuilder />
      </div>
    </div>
  )
}
