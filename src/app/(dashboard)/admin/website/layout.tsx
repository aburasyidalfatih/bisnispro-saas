import { redirect } from"next/navigation"
import { auth } from"@/lib/auth"
import { cookies } from"next/headers"

export default async function WebsiteLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login")
  }
  
  const cookieStore = await cookies()
  const isImpersonatingUser = cookieStore.has("impersonate-user")
  
  const hasAdminRole = Boolean(
    session.user.isSuperAdmin || 
    session.user.tenants?.some((t: any) => t.role === "owner" || t.role === "admin")
  )
  
  const isAdminRole = !isImpersonatingUser && hasAdminRole
  
  if (!isAdminRole) {
    redirect("/admin")
  }

  return <>{children}</>
}
