import { redirect } from"next/navigation"
import { auth } from"@/lib/auth"
import { cookies } from"next/headers"

export default async function WebsiteLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login")
  }
  
  const currentRole = session.user.tenants?.[0]?.role ||"orangtua"
  
  const cookieStore = await cookies()
  const isImpersonatingUser = cookieStore.has("impersonate-user")
  const isImpersonatingLembaga = cookieStore.has("impersonate-tenant")
  
  const isAdminRole = !isImpersonatingUser && (
    currentRole ==="owner" || 
    currentRole ==="admin" || 
    (session.user.isSuperAdmin && isImpersonatingTenant)
  )
  
  if (!isAdminRole) {
    redirect("/admin")
  }

  return <>{children}</>
}
