"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, CalendarCheck, FileText, User, Calendar, LogOut, Award, ShieldAlert, MessageSquare, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { MobileBottomNav } from "./mobile-bottom-nav"
import { Button } from "@/components/ui/button"
import { signOut, useSession } from "next-auth/react"
import { useRealtimeNotification } from "@/hooks/use-realtime-notification"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useEffect, useState } from "react"
import { AiTopupDialog } from "@/components/shared/ai-topup-dialog"
import { Coins } from "lucide-react"

export function GtkAppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  
  // Aktivasi real-time notifications via SSE
  useRealtimeNotification()

  const tenantPlan = session?.user?.tenants?.[0]?.plan || "free"
  const isPremium = tenantPlan === "premium" || tenantPlan === "pro"

  const [aiData, setAiData] = useState<any>(null)
  const [isTopupOpen, setIsTopupOpen] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/gtk/ai/info', { signal: controller.signal })
      .then(r => r.json())
      .then(d => {
         if (!d.error) setAiData(d)
      })
      .catch((err) => {
        if (err.name !== 'AbortError') console.error(err)
      })
      
    return () => controller.abort()
  }, [])

  const navItems: { label: string; icon: any; href: string; badge?: string }[] = [
    { label: "Beranda", icon: Home, href: "/panel-gtk" },
    { label: "Jadwal", icon: Calendar, href: "/panel-gtk/jadwal" },
    { label: "Jurnal", icon: CalendarCheck, href: "/panel-gtk/jurnal" },
    { label: "Nilai", icon: Award, href: "/panel-gtk/nilai" },
    { label: "Poin", icon: ShieldAlert, href: "/panel-gtk/poin" },
    { label: "Artikel", icon: FileText, href: "/panel-gtk/posts" },
    { label: "Bank Soal", icon: FileText, href: "/panel-gtk/cbt/bank-soal" },
    { label: "Jadwal CBT", icon: CalendarCheck, href: "/panel-gtk/cbt/jadwal" },
    { label: "Pesan", icon: MessageSquare, href: "/panel-gtk/messages" },
    { label: "AI Assistant", icon: Sparkles, href: "/panel-gtk/ai" }
  ]

  const currentTenant = session?.user?.tenants?.[0]
  const brandLogo = (currentTenant as any)?.logo
  const brandName = currentTenant?.name || "SchoolPro"
  const brandInitial = brandName.charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-muted/20 font-sans flex flex-col">
      {/* Top Navigation - Desktop Only */}
      <header className="hidden lg:block sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/panel-gtk" className="flex items-center gap-2">
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg text-white font-bold shadow-sm overflow-hidden",
                brandLogo ? "bg-transparent shadow-none" : "bg-primary"
              )}>
                {brandLogo ? (
                  <img src={brandLogo} alt={brandName} className="h-full w-full object-contain" loading="lazy" decoding="async" />
                ) : (
                  <span className="text-primary-foreground font-bold text-lg">{brandInitial}</span>
                )}
              </div>
            </Link>

            <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide max-w-[calc(100vw-300px)] lg:max-w-[50vw] xl:max-w-none">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/panel-gtk" && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-colors",
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
            {aiData && (
              <button 
                onClick={() => setIsTopupOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
                title="Top up Token AI"
              >
                <Coins className="h-4 w-4" />
                <span className="text-xs font-bold">{aiData.userTokens.toLocaleString("id-ID")}</span>
              </button>
            )}

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

      {aiData && (
        <AiTopupDialog 
          open={isTopupOpen}
          onOpenChange={setIsTopupOpen}
          userTokens={aiData.userTokens}
          aiPackages={aiData.aiPackages}
          paymentChannels={aiData.paymentChannels}
          manualPayment={aiData.manualPayment}
        />
      )}

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
