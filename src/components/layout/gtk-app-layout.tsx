"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, CalendarCheck, FileText, User, Calendar, LogOut, Award, ShieldAlert } from "lucide-react"
import { cn } from "@/lib/utils"
import { MobileBottomNav } from "./mobile-bottom-nav"
import { Button } from "@/components/ui/button"
import { signOut, useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function GtkAppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()

  const tenantPlan = session?.user?.tenants?.[0]?.plan || "free"
  const isPremium = tenantPlan === "premium" || tenantPlan === "pro"

  const navItems = [
    { label: "Beranda", icon: Home, href: "/panel-gtk" },
    { label: "Jadwal", icon: Calendar, href: "/panel-gtk/jadwal", badge: "Pro" },
    { label: "Jurnal", icon: CalendarCheck, href: "/panel-gtk/jurnal", badge: "Pro" },
    { label: "Nilai", icon: Award, href: "/panel-gtk/nilai", badge: "Pro" },
    { label: "Poin", icon: ShieldAlert, href: "/panel-gtk/poin", badge: "Pro" },
    { label: "Artikel", icon: FileText, href: "/panel-gtk/posts" },
    { label: "Bank Soal", icon: FileText, href: "/panel-gtk/cbt/bank-soal", badge: "Pro" },
    { label: "Jadwal CBT", icon: CalendarCheck, href: "/panel-gtk/cbt/jadwal", badge: "Pro" }
  ]

  return (
    <div className="min-h-screen bg-muted/20 font-sans flex flex-col">
      {/* Top Navigation - Desktop Only */}
      <header className="hidden lg:block sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/panel-gtk" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">S</span>
              </div>
              <span className="font-bold text-lg hidden xl:inline-block">SchoolPro GTK</span>
            </Link>

            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/panel-gtk" && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                    {item.badge && (
                      <span className="ml-1 inline-flex items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0 text-[9px] font-bold uppercase tracking-widest text-amber-600">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10 border-2 border-primary/20">
                    <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {session?.user?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{session?.user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session?.user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/panel-gtk/profil" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profil Saya</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-600 cursor-pointer" 
                  onClick={async () => {
                    await signOut({ redirect: false })
                    window.location.href = "/login"
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Keluar</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8 pb-32 lg:pb-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation - Mobile Only */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        <MobileBottomNav />
      </div>
    </div>
  )
}
