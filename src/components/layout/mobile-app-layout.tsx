"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { MobileBottomNav } from "./mobile-bottom-nav"

export function MobileAppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const isSiswa = pathname.startsWith("/siswa")
  const isGTK = pathname.startsWith("/panel-gtk")
  const baseRoute = isSiswa ? "/siswa" : isGTK ? "/panel-gtk" : "/ortu"

  const navItems = isSiswa ? [
    { label: "Beranda", icon: Home, href: "/siswa" },
    { label: "Tugas", icon: FileText, href: "/siswa/tugas" },
    { label: "Nilai", icon: Wallet, href: "/siswa/nilai" },
    { label: "Profil", icon: User, href: "/siswa/profil" },
  ] : isGTK ? [
    { label: "Beranda", icon: Home, href: "/panel-gtk" },
    { label: "Kelas", icon: FileText, href: "/panel-gtk/kelas" },
    { label: "Nilai", icon: Wallet, href: "/panel-gtk/nilai" },
    { label: "Profil", icon: User, href: "/panel-gtk/profil" },
  ] : [
    { label: "Beranda", icon: Home, href: "/ortu" },
    { label: "Akademik", icon: FileText, href: "/ortu/akademik" },
    { label: "Tagihan", icon: Wallet, href: "/ortu/tagihan" },
    { label: "Profil", icon: User, href: "/ortu/profil" },
  ]

  const floatingAction = {
    label: "Jadwal",
    icon: Calendar,
    href: `${baseRoute}/jadwal`
  }

  return (
    <div className="min-h-screen flex justify-center w-full font-sans bg-muted/20">
      {/* Mobile Device Simulator Container */}
      <div className="w-full max-w-[480px] bg-background min-h-screen relative shadow-2xl flex flex-col overflow-hidden lg:my-0 ring-1 ring-border/50">
        
        {/* Main Content Area (Scrollable) */}
        <main className="flex-1 overflow-y-auto pb-28 hide-scrollbar relative">
          {children}
        </main>

        {/* Bottom Navigation */}
        <div className="absolute bottom-0 left-0 right-0 z-50">
          <MobileBottomNav />
        </div>
        
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  )
}
