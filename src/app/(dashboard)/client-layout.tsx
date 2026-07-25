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
import { TenantCompletenessPopup } from "@/components/layout/tenant-completeness-popup"
import { PresenceProvider } from "@/components/providers/presence-provider"
import { ActivityTracker } from "@/components/providers/activity-tracker"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isImpersonatingTenant = typeof document !== "undefined" && document.cookie.includes("impersonate-tenant=")

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
    if (status === "authenticated") {
      if (session?.user?.isSuperAdmin) {
        if (!isImpersonatingTenant) router.push("/super-admin")
      } else if (session?.user?.isAffiliate && (!session.user.tenants || session.user.tenants.length === 0)) {
        router.push("/affiliate")
      }
    }
  }, [status, session, router, pathname, isImpersonatingTenant])

  if (status === "loading") {
    return (
      <div className="flex h-[100dvh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!session) return null

  // Mencegah flash UI (render salah) selama proses redirect super admin
  if (session.user?.isSuperAdmin && typeof document !== "undefined" && !document.cookie.includes("impersonate-tenant=")) {
    return (
      <div className="flex h-[100dvh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <TenantBrandingProvider>
      <PresenceProvider />
      <ActivityTracker />
      <TenantCompletenessPopup />
      <div className="flex h-[100dvh] overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Mobile sidebar overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
            <div className="relative z-10 h-full w-[260px] max-w-full">
              <Sidebar />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-3.5 right-3.5 z-20 h-8 w-8 rounded-lg bg-background/80 hover:bg-background border border-border shadow-sm"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-1 flex-col overflow-hidden relative">
          <header className={cn("flex h-16 items-center justify-between border-b glass px-4 lg:px-6 z-10")}>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9 rounded-xl mr-2"
              onClick={() => setMobileOpen(true)}
              aria-label="Toggle menu"
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
    </TenantBrandingProvider>
  )
}
