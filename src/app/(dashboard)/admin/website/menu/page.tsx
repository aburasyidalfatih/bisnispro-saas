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

