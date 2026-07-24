"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Settings,
  CreditCard,
  Bell,
  BellRing,
  FileText,
  BarChart3,
  Shield,
  ChevronLeft,
  ChevronDown,
  UserPlus,
  UserCog,
  ShieldCheck,
  Receipt,
  Wallet,
  PieChart,
  TrendingUp,
  ClipboardList,
  Building2,
  BrainCircuit,
  Palette,
  Lock,
  Globe,
  Server,
  Activity,
  Mail,
  Megaphone,
  Tag,
  BookOpen,
  MessageSquare,
  Calendar,
  FolderOpen,
  Download,
  User,
  LayoutTemplate,
  Home,
  Image as ImageIcon,
  Briefcase,
  Phone,
  Info,
  Award,
  GraduationCap,
  HelpCircle,
  Database,
  Store,
  Sparkles,
  MonitorSmartphone,
  Heart,
  CalendarCheck,
  FileCheck,
  BadgeDollarSign,
  Zap,
  type LucideIcon,
} from "lucide-react"
import { cn, normalizeImageUrl } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useTenantBranding } from "@/components/providers/tenant-branding-provider"
import Image from "next/image"

import { getTenantMenu, getGTKMenu, getMemberMenu, getSuperAdminMenu, type MenuSection } from "@/config/menus"
import { usePlanAccess } from "@/hooks/use-free-plan-access"

// ============================================================
// SIDEBAR COMPONENT
// ============================================================

interface SidebarProps {
  isSuperAdmin?: boolean
}

export function Sidebar({ isSuperAdmin }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({})
  const [pendingPayments, setPendingPayments] = useState(0)
  const [platformLogo, setPlatformLogo] = useState("/logo-bisnispro.png")

  const { data: session } = useSession()
  const { branding } = useTenantBranding()

  useEffect(() => {
    const controller = new AbortController()
    fetch("/api/public/platform-info", { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (data && data.app_logo) setPlatformLogo(data.app_logo)
      })
      .catch((err) => {
        if (err.name !== "AbortError") console.error(err)
      })
      
    return () => controller.abort()
  }, [])

  const basePath = "/admin"
  const isSuperAdminPath = pathname.startsWith("/super-admin")
  const isGTK = pathname.startsWith("/panel-gtk")

  // Fetch pending payments count for super admin badge
  useEffect(() => {
    if (!isSuperAdminPath) return
    const controller = new AbortController()
    fetch("/api/super-admin/stats", { signal: controller.signal })
      .then(r => r.json())
      .then(d => setPendingPayments(d.pendingPayments || 0))
      .catch((err) => {
        if (err.name !== "AbortError") console.error(err)
      })
      
    return () => controller.abort()
  }, [isSuperAdminPath])

  // Detect role dari session
  const currentTenantSlug = session?.user?.tenants?.[0]?.slug
  const currentTenant = session?.user?.tenants?.find((t) => t.slug === currentTenantSlug) || session?.user?.tenants?.[0]
  const currentRole = currentTenant?.role || "orangtua"
  const currentPlan = (branding as any).plan || (session?.user as any)?.tenants?.[0]?.plan || "free"

  const { access: planAccess } = usePlanAccess(currentPlan)

  // Branding: pakai context (update instan) untuk nama & logo, fallback ke session
  const brandName = isSuperAdminPath ? "BisnisPro" : (branding.name || currentTenant?.name || "BisnisPro")
  const brandLogo = isSuperAdminPath ? null : (branding.logo || (currentTenant as any)?.logo || null)
  const finalBrandLogo = brandLogo || platformLogo
  const brandInitial = brandName.charAt(0).toUpperCase()

  // Saat impersonate, super admin dianggap admin tenant
  const isImpersonating = typeof document !== "undefined" && document.cookie.includes("impersonate-tenant=")
  const isImpersonatingUser = typeof document !== "undefined" && document.cookie.includes("impersonate-user=")
  const isAdminRole = !isImpersonatingUser && (currentRole === "owner" || currentRole === "admin" || (session?.user?.isSuperAdmin && isImpersonating))

  // Pilih menu berdasarkan role
  let sections: MenuSection[]
  let homeHref = basePath

  if (isSuperAdminPath) {
    sections = getSuperAdminMenu(pendingPayments)
    homeHref = "/super-admin"
  } else if (isAdminRole) {
    sections = getTenantMenu(basePath, currentPlan, planAccess as any)
  } else if (isGTK) {
    sections = getGTKMenu("/panel-gtk")
    homeHref = "/panel-gtk"
  } else {
    sections = getMemberMenu("/ortu")
    homeHref = "/ortu"
  }

  // Auto-open parent menu if child is active
  const getInitialOpen = () => {
    const open: Record<string, boolean> = {}
    sections.forEach((section) => {
      section.items.forEach((item) => {
        if (item.children) {
          const isChildActive = item.children.some(
            (child) => {
              if (child.href.includes("?")) {
                return pathname === child.href
              }
              return pathname === child.href || pathname.startsWith(child.href + "/")
            }
          )
          if (isChildActive) open[item.label] = true
        }
      })
    })
    return open
  }

  const effectiveOpen = { ...getInitialOpen(), ...openMenus }

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !effectiveOpen[label] }))
  }

  return (
    <aside
      className={cn(
        "relative flex h-screen flex-col glass border-r transition-all duration-300",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Logo + Collapse */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border/50">
        {!collapsed ? (
          <>
            <Link href={homeHref} className="flex items-center gap-2.5">
              <div className={cn(
                "relative flex h-9 w-9 items-center justify-center rounded-xl text-white font-bold text-sm shadow-lg overflow-hidden shrink-0",
                finalBrandLogo || isSuperAdminPath ? "bg-transparent shadow-none" : "btn-gradient"
              )}>
                {isSuperAdminPath
                  ? <Image src={normalizeImageUrl(platformLogo) || platformLogo} alt="BisnisPro Logo" fill sizes="48px" className="object-contain p-0.5" />
                  : finalBrandLogo
                    ? <Image src={normalizeImageUrl(finalBrandLogo) || finalBrandLogo} alt={brandName} fill sizes="48px" className="object-contain p-0.5" />
                    : brandInitial
                }
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm tracking-tight leading-tight truncate max-w-[140px] max-w-full">{brandName} v1.1</span>
                <span className={cn(
                  "text-[10px] font-medium leading-tight",
                  isSuperAdminPath ? "text-red-500" : "text-muted-foreground"
                )}>
                  {isSuperAdminPath ? "Super Admin" : isAdminRole ? "Admin Panel" : isGTK ? "GTK Panel" : "User Panel"}
                </span>
              </div>
            </Link>
            <Button variant="ghost" size="icon" onClick={() => setCollapsed(true)} className="h-8 w-8 rounded-lg shrink-0">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <button
            onClick={() => setCollapsed(false)}
            className={cn(
              "relative flex h-9 w-9 mx-auto items-center justify-center rounded-xl text-white font-bold text-sm shadow-lg hover:opacity-90 transition-opacity overflow-hidden shrink-0",
              finalBrandLogo || isSuperAdminPath ? "bg-transparent shadow-none" : "btn-gradient"
            )}
          >
            {isSuperAdminPath
              ? <Image src={normalizeImageUrl(platformLogo) || platformLogo} alt="BisnisPro Logo" fill sizes="48px" className="object-contain p-0.5" />
              : finalBrandLogo
                ? <Image src={normalizeImageUrl(finalBrandLogo) || finalBrandLogo} alt={brandName} fill sizes="48px" className="object-contain p-0.5" />
                : brandInitial
            }
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {sections.map((section, si) => (
          <div key={si} className={si > 0 ? "mt-4" : ""}>
            {/* Section title */}
            {section.title && !collapsed && (
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                {section.title}
              </p>
            )}
            {section.title && collapsed && <div className="mx-auto my-2 h-px w-6 bg-border/50" />}

            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isExactActive = pathname === item.href
                const isChildActive = item.children?.some(
                  (child) => {
                    if (child.href.includes("?")) return pathname === child.href
                    return pathname === child.href || pathname.startsWith(child.href + "/")
                  }
                )
                const isActive = isExactActive || (!item.children && !item.href.includes("?") && pathname.startsWith(item.href + "/"))
                const isOpen = effectiveOpen[item.label] && !collapsed
                const hasChildren = item.children && item.children.length > 0

                return (
                  <div key={item.label}>
                    {hasChildren ? (
                      <div className="relative group">
                        <Link
                          href={item.href}
                          className={cn(
                            "flex flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                            isActive || isChildActive
                              ? "bg-gradient-to-r from-primary/15 to-primary/5 text-primary shadow-sm"
                              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                          )}
                        >
                          <div className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
                            isActive || isChildActive ? "bg-primary/10 text-primary" : "text-muted-foreground group-hover:bg-accent group-hover:text-foreground"
                          )}>
                            <item.icon className="h-[18px] w-[18px]" />
                          </div>
                          {!collapsed && (
                          <span className="flex-1 text-left flex items-center gap-2 pr-8">
                            {item.label}
                            {item.badge !== undefined && !collapsed && (
                              <span className={cn(
                                "ml-auto inline-flex items-center justify-center rounded-full font-bold px-1.5",
                                typeof item.badge === "number" ? "h-5 min-w-[20px] bg-amber-500 text-[10px] text-white" : "h-4 text-[9px] border border-amber-500/30 text-amber-600 bg-amber-500/10"
                              )}>
                                {item.badge}
                              </span>
                            )}
                          </span>
                        )}
                        </Link>
                        {!collapsed && (
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              toggleMenu(item.label)
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground transition-colors"
                          >
                            <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-180")} />
                          </button>
                        )}
                      </div>
                    ) : (
                      <Link
                        href={item.href}
                        className={cn(
                          "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                          isActive
                            ? "bg-gradient-to-r from-primary/15 to-primary/5 text-primary shadow-sm"
                            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                        )}
                      >
                        <div className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
                          isActive ? "bg-primary/10 text-primary" : "text-muted-foreground group-hover:bg-accent group-hover:text-foreground"
                        )}>
                          <item.icon className="h-[18px] w-[18px]" />
                        </div>
                        {!collapsed && (
                          <span className="flex items-center gap-2">
                            {item.label}
                            {item.badge !== undefined && (
                              <span className={cn(
                                "inline-flex items-center justify-center rounded-full font-bold px-1.5",
                                typeof item.badge === "number" ? "h-5 min-w-[20px] bg-amber-500 text-[10px] text-white" : "h-4 text-[9px] border border-amber-500/30 text-amber-600 bg-amber-500/10"
                              )}>
                                {item.badge}
                              </span>
                            )}
                          </span>
                        )}
                      </Link>
                    )}

                    {/* Sub-menu */}
                    {hasChildren && !collapsed && (
                      <div className={cn("overflow-hidden transition-all duration-200 ease-in-out", isOpen ? "max-h-96 opacity-100 mt-0.5" : "max-h-0 opacity-0")}>
                        <div className="ml-[22px] border-l border-border/50 pl-4 space-y-0.5 py-0.5">
                          {item.children!.map((child) => {
                            const isSubActive = pathname === child.href || pathname.startsWith(child.href + "/")
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                className={cn(
                                  "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-200",
                                  isSubActive ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                                )}
                              >
                                <child.icon className={cn("h-4 w-4 shrink-0", isSubActive ? "text-primary" : "text-muted-foreground/70")} />
                                <div className="flex flex-1 items-center gap-2">
                                  <span>{child.label}</span>
                                  {child.badge !== undefined && (
                                    <span className="ml-auto inline-flex items-center justify-center rounded-full font-bold px-1.5 h-4 text-[8px] border border-amber-500/30 text-amber-600 bg-amber-500/10 uppercase tracking-widest">
                                      {child.badge}
                                    </span>
                                  )}
                                </div>
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </nav>



      {/* App Version */}
      <div className={cn("p-4 text-center border-t border-border mt-auto flex flex-col gap-1", collapsed ? "hidden" : "block")}>
        <p className="text-[10px] text-muted-foreground font-mono">
          &copy; {new Date().getFullYear()} <a href="https://bisnispro.id" target="_blank" rel="noopener noreferrer" className="hover:underline text-foreground">BisnisPro.id</a>
        </p>
        <p className="text-[10px] text-muted-foreground font-mono" title="Application Version">
          v1.0.5 {process.env.NEXT_PUBLIC_APP_VERSION ? `(rev: ${process.env.NEXT_PUBLIC_APP_VERSION.substring(0, 7)})` : "(dev)"}
        </p>
      </div>
    </aside>
  )
}
