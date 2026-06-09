"use client"

import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"

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
      <div className="flex h-[100dvh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!session?.user?.isSuperAdmin) return null

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <div className="hidden lg:block"><Sidebar /></div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-[260px] lg:hidden">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <Sidebar />
        </SheetContent>
      </Sheet>

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
