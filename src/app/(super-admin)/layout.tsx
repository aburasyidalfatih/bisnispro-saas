"use client"

import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  // Auto-close mobile sidebar on navigation
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
    if (status === "authenticated" && !session?.user?.isSuperAdmin) router.push("/admin")
  }, [status, session, router])

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!session?.user?.isSuperAdmin) return null

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden lg:block"><Sidebar /></div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 animate-in fade-in-0 duration-200" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 h-full w-[260px] animate-in slide-in-from-left-full duration-200">
            <Sidebar />
            <Button variant="ghost" size="icon" className="absolute top-4 right-3 h-9 w-9 rounded-xl bg-background/80 backdrop-blur-sm shadow-md lg:hidden z-20" onClick={() => setMobileOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 sm:h-16 items-center justify-between border-b glass px-3 sm:px-4 lg:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9 rounded-xl mr-1 sm:mr-2 shrink-0" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <Header />
        </header>
        <main className="flex-1 overflow-y-auto bg-mesh p-3 sm:p-4 lg:p-6" style={{ viewTransitionName: "page-content" }}>
          {children}
        </main>
      </div>
    </div>
  )
}
