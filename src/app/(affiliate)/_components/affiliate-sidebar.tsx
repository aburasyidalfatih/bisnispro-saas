"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, Wallet, Settings, LogOut, ChevronLeft, BookOpen, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"

const affiliateMenu = [
  { label: "Overview", href: "/affiliate", icon: LayoutDashboard },
  { label: "Leads & Sekolah", href: "/affiliate/referrals", icon: Users },
  { label: "Komisi & Penarikan", href: "/affiliate/commissions", icon: Wallet },
  { label: "Leaderboard", href: "/affiliate/leaderboard", icon: Trophy },
  { label: "Panduan Program", href: "/affiliate/panduan", icon: BookOpen },
  { label: "Pengaturan Akun", href: "/affiliate/settings", icon: Settings },
]

export default function AffiliateSidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-[260px] flex-col glass border-r">
      <div className="flex h-16 items-center px-4 border-b border-border/50">
        <Link href="/affiliate" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl btn-gradient text-white font-bold text-sm shadow-lg">
            S
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight leading-tight">SchoolPro</span>
            <span className="text-[10px] font-medium text-emerald-500 leading-tight">Mitra Afiliasi</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {affiliateMenu.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/") && item.href !== "/affiliate"
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 text-emerald-600 shadow-sm"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <div className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
                isActive ? "bg-emerald-500/10 text-emerald-600" : "text-muted-foreground group-hover:bg-accent group-hover:text-foreground"
              )}>
                <item.icon className="h-[18px] w-[18px]" />
              </div>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>


    </aside>
  )
}
