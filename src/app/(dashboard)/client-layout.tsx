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
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav"
import { GtkAppLayout } from "@/components/layout/gtk-app-layout"
import { usePlanAccess } from "@/hooks/use-free-plan-access"
import { TenantCompletenessPopup } from "@/components/layout/tenant-completeness-popup"
import { PresenceProvider } from "@/components/providers/presence-provider"
import { ActivityTracker } from "@/components/providers/activity-tracker"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const currentPlan = (session?.user as any)?.tenants?.[0]?.plan || "free"
  const { access: planAccess } = usePlanAccess(currentPlan)

  // Determine if the user is a normal member (orangtua/siswa) instead of admin
  const currentTenantSlug = session?.user?.tenants?.[0]?.slug
  const currentTenant = session?.user?.tenants?.find((t: any) => t.slug === currentTenantSlug) || session?.user?.tenants?.[0]
  const currentRole = currentTenant?.role || "orangtua"
  
  const isImpersonatingUser = typeof document !== "undefined" && document.cookie.includes("impersonate-user=")
  const isImpersonatingTenant = typeof document !== "undefined" && document.cookie.includes("impersonate-tenant=")
  const isGuru = !isImpersonatingUser && currentRole === "guru"
  const isAdminRole = !isImpersonatingUser && (currentRole === "owner" || currentRole === "admin" || currentRole === "guru" || (session?.user?.isSuperAdmin && isImpersonatingTenant))

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
    if (status === "authenticated") {
      if (session?.user?.isSuperAdmin) {
        const isImpersonating = document.cookie.includes("impersonate-tenant=")
        if (!isImpersonating) router.push("/super-admin")
      } else if (session?.user?.isAffiliate && (!session.user.tenants || session.user.tenants.length === 0)) {
        router.push("/affiliate")
      } else {
        // DEFENSE IN DEPTH: Client-side role isolation (mencegah bypass middleware)
        if (!session?.user?.isSuperAdmin) {
           if (pathname.startsWith("/admin") && currentRole !== "owner" && currentRole !== "admin") {
             router.replace(currentRole === "guru" ? "/panel-gtk" : currentRole === "orangtua" ? "/ortu" : currentRole === "siswa" ? "/siswa" : "/login")
             return
           }
           if (pathname.startsWith("/panel-gtk") && currentRole !== "guru") {
             router.replace(currentRole === "owner" || currentRole === "admin" ? "/admin" : currentRole === "orangtua" ? "/ortu" : currentRole === "siswa" ? "/siswa" : "/login")
             return
           }
           if (pathname.startsWith("/ortu") && currentRole !== "orangtua") {
             router.replace(currentRole === "owner" || currentRole === "admin" ? "/admin" : currentRole === "guru" ? "/panel-gtk" : currentRole === "siswa" ? "/siswa" : "/login")
             return
           }
           if (pathname.startsWith("/siswa") && currentRole !== "siswa") {
             router.replace(currentRole === "owner" || currentRole === "admin" ? "/admin" : currentRole === "guru" ? "/panel-gtk" : currentRole === "orangtua" ? "/ortu" : "/login")
             return
           }
        }

        // Redirect free tenants from the root dashboard to the website dashboard (ONLY FOR ADMINS)
        const plan = currentTenant?.plan || "free"
        if (plan === "free" && (currentRole === "owner" || currentRole === "admin" || (session?.user?.isSuperAdmin && isImpersonatingTenant))) {
          const allowedPaths = [
            "/admin/website",
            "/admin/users",
            "/admin/students",
            "/admin/students/classrooms",
            "/admin/subjects",
            "/admin/settings",
            "/admin/billing",
            "/admin/notifications",
            "/admin/my-messages"
          ]
          
          const pa = (planAccess as any)?._plan_access || {}
          if (pa.ppdb) allowedPaths.push("/admin/ppdb")
          if (pa.keuangan) allowedPaths.push("/admin/finance")
          if (pa.e_kantin) allowedPaths.push("/admin/canteen")
          if (pa.laporan) allowedPaths.push("/admin/reports")
          if (pa.donasi) allowedPaths.push("/admin/donation")
          if (pa.akademik) allowedPaths.push("/admin/schedules", "/admin/grades", "/admin/discipline")
          if (pa.kehadiran) allowedPaths.push("/admin/attendance")

          const isAllowed = allowedPaths.some(p => pathname === p || pathname.startsWith(`${p}/`))
          
          if (pathname === "/admin" || !isAllowed) {
            router.replace("/admin/website")
          }
        }
      }
    }
  }, [status, session, router, pathname, currentTenant, isAdminRole, planAccess])

  if (status === "loading") {
    return (
      <div className="flex h-[100dvh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!session) return null

  // Mencegah flash UI (render salah) selama proses redirect super admin
  if (session.user?.isSuperAdmin && !document.cookie.includes("impersonate-tenant=")) {
    return (
      <div className="flex h-[100dvh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <TenantBrandingProvider>
      <PresenceProvider />
      {isAdminRole && <ActivityTracker />}
      <TenantCompletenessPopup />
      {isGuru ? (
        <GtkAppLayout>
          {children}
        </GtkAppLayout>
      ) : !isAdminRole ? (
        <MobileAppLayout>
          {children}
        </MobileAppLayout>
      ) : (
        <div className="flex h-[100dvh] overflow-hidden">
          {/* Desktop sidebar */}
          <div className="hidden lg:block">
            <Sidebar />
          </div>

          {/* Mobile sidebar overlay (Sembunyikan untuk guru karena guru pakai bottom nav di mobile) */}
          {!isGuru && mobileOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
              <div className="relative z-10 h-full w-[260px] max-w-full">
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

          <div className="flex flex-1 flex-col overflow-hidden relative">
            <header className={cn("flex h-16 items-center justify-between border-b glass px-4 lg:px-6 z-10", isGuru && "hidden lg:flex")}>
              {!isGuru && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden h-9 w-9 rounded-xl mr-2"
                  onClick={() => setMobileOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              )}
              <Header />
            </header>
            <main className={cn("flex-1 overflow-y-auto bg-mesh p-4 lg:p-6", isGuru && "pb-28 lg:pb-6")} style={{ viewTransitionName: "page-content" }}>
              {children}
            </main>
          </div>
        </div>
      )}
    </TenantBrandingProvider>
  )
}
