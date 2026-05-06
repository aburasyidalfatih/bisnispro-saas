"use client"

import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { TenantBrandingProvider } from "@/components/providers/tenant-branding-provider"
import { MobileAppLayout } from "@/components/layout/mobile-app-layout"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Determine if the user is a normal member (orangtua/siswa) instead of admin
  const currentTenantSlug = session?.user?.tenants?.[0]?.slug
  const currentTenant = session?.user?.tenants?.find((t: any) => t.slug === currentTenantSlug) || session?.user?.tenants?.[0]
  const currentRole = currentTenant?.role || "member"
  
  const isImpersonatingUser = typeof document !== "undefined" && document.cookie.includes("impersonate-user=")
  const isImpersonatingTenant = typeof document !== "undefined" && document.cookie.includes("impersonate-tenant=")
  const isAdminRole = !isImpersonatingUser && (currentRole === "owner" || currentRole === "admin" || (session?.user?.isSuperAdmin && isImpersonatingTenant))

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
    if (status === "authenticated") {
      if (session?.user?.isSuperAdmin) {
        const isImpersonating = document.cookie.includes("impersonate-tenant=")
        if (!isImpersonating) router.push("/super-admin")
      } else if (session?.user?.isAffiliate && (!session.user.tenants || session.user.tenants.length === 0)) {
        router.push("/affiliate")
      } else {
        // Redirect free tenants from the root dashboard to the website dashboard (ONLY FOR ADMINS)
        const plan = currentTenant?.plan || "free"
        if (plan === "free" && isAdminRole) {
          const allowedPaths = [
            "/dashboard/website",
            "/dashboard/users",
            "/dashboard/settings",
            "/dashboard/billing"
          ]
          
          const isAllowed = allowedPaths.some(p => pathname === p || pathname.startsWith(`${p}/`))
          
          if (pathname === "/dashboard" || !isAllowed) {
            router.replace("/dashboard/website")
          }
        }
      }
    }
  }, [status, session, router, pathname, currentTenant, isAdminRole])

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!session) return null

  return (
    <TenantBrandingProvider>
      {!isAdminRole ? (
        <MobileAppLayout>
          {children}
        </MobileAppLayout>
      ) : (
        <div className="flex h-screen overflow-hidden">
          {/* Desktop sidebar */}
          <div className="hidden lg:block">
            <Sidebar />
          </div>

          {/* Mobile sidebar overlay */}
          {mobileOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
              <div className="relative z-10 h-full w-[260px]">
                <Sidebar />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-[-48px] h-9 w-9 rounded-xl bg-background"
                  onClick={() => setMobileOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-1 flex-col overflow-hidden">
            <header className="flex h-16 items-center justify-between border-b glass px-4 lg:px-6">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-9 w-9 rounded-xl mr-2"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <Header />
            </header>
            <main className="flex-1 overflow-y-auto bg-mesh p-4 lg:p-6" style={{ viewTransitionName: "page-content" }}>
              {children}
            </main>
          </div>
        </div>
      )}
    </TenantBrandingProvider>
  )
}
