"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import AffiliateSidebar from "./_components/affiliate-sidebar"
import { Header } from "@/components/layout/header"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AffiliateLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
    if (status === "authenticated" && !session?.user?.isAffiliate && !session?.user?.isSuperAdmin) {
      router.push("/dashboard")
    }
  }, [status, session, router])

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!session?.user?.isAffiliate && !session?.user?.isSuperAdmin) return null

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden lg:block"><AffiliateSidebar /></div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 h-full w-[260px]">
            <AffiliateSidebar />
            <Button variant="ghost" size="icon" className="absolute top-4 right-[-48px] h-9 w-9 rounded-xl bg-background" onClick={() => setMobileOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b glass px-4 lg:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9 rounded-xl mr-2" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <Header />
        </header>
        <main className="flex-1 overflow-y-auto bg-mesh p-4 lg:p-6" style={{ viewTransitionName: "page-content" }}>
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
