"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, Calendar, Wallet, User, FileText, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

export function MobileBottomNav({ className }: { className?: string }) {
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
    { label: "Artikel", icon: FileText, href: "/panel-gtk/posts" },
    { label: "Pesan", icon: MessageSquare, href: "/panel-gtk/messages" },
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
    <div className={cn("bg-background/95 backdrop-blur-md border-t border-border/50 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)] px-6 pt-2 pb-6 z-50", className)}>
      <div className={cn("flex items-center relative", isGTK ? "justify-around w-full" : "justify-between")}>
        
        {/* Left Nav Items */}
        <div className={cn("flex justify-between relative z-10", isGTK ? "w-full px-2" : "w-2/5")}>
          {navItems.slice(0, isGTK ? 4 : 2).map((item) => {
            const isActive = pathname === item.href || (item.href !== baseRoute && pathname.startsWith(item.href))
            return (
              <Link href={item.href} key={item.label} className={cn("flex flex-col items-center justify-center p-2 gap-1", isGTK ? "w-1/4" : "w-16")}>
                <item.icon className={cn("h-6 w-6 transition-all duration-300", isActive ? "text-primary scale-110" : "text-muted-foreground")} />
                <span className={cn("text-[10px] font-medium transition-colors duration-300", isActive ? "text-primary font-bold" : "text-muted-foreground")}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>

        {/* Floating Action Button (Jadwal) - Hidden for GTK */}
        {!isGTK && (
          <div className="absolute left-1/2 -top-8 -translate-x-1/2 flex flex-col items-center justify-center z-20">
            <Link href={floatingAction.href} className="flex flex-col items-center group">
              <div className="h-16 w-16 rounded-full btn-gradient text-white flex items-center justify-center shadow-lg shadow-primary/40 ring-[6px] ring-background group-hover:scale-105 transition-transform mb-1">
                <floatingAction.icon className="h-7 w-7" />
              </div>
              <span className={cn("text-[10px] font-medium text-muted-foreground absolute -bottom-5", pathname.includes("/jadwal") && "text-primary font-bold")}>
                {floatingAction.label}
              </span>
            </Link>
          </div>
        )}

        {/* Right Nav Items - Hidden for GTK (Merged to Left) */}
        {!isGTK && (
          <div className="flex w-2/5 justify-between relative z-10">
            {navItems.slice(2, 4).map((item) => {
              const isActive = pathname === item.href || (item.href !== baseRoute && pathname.startsWith(item.href))
              return (
                <Link href={item.href} key={item.label} className="flex flex-col items-center justify-center p-2 gap-1 w-16">
                  <item.icon className={cn("h-6 w-6 transition-all duration-300", isActive ? "text-primary scale-110" : "text-muted-foreground")} />
                  <span className={cn("text-[10px] font-medium transition-colors duration-300", isActive ? "text-primary font-bold" : "text-muted-foreground")}>
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </div>
        )}
        
      </div>
    </div>
  )
}
