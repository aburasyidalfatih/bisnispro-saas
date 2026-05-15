"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
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
  Image,
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
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useTenantBranding } from "@/components/providers/tenant-branding-provider"

// ============================================================
// MENU DEFINITIONS
// ============================================================

interface MenuItem {
  label: string
  href: string
  icon: LucideIcon
  badge?: number | string
  children?: { label: string; href: string; icon: LucideIcon; badge?: number | string }[]
}

interface MenuSection {
  title?: string
  items: MenuItem[]
}

import { useFreePlanAccess } from "@/hooks/use-free-plan-access"

// --- TENANT ADMIN MENU ---
function getTenantMenu(basePath: string, plan: string = "free", access: Record<string, boolean>): MenuSection[] {
  const isFree = plan === "free"

  const menu: MenuSection[] = [
    {
      items: [
        { label: "Dashboard", href: basePath, icon: LayoutDashboard },
      ],
    },
    {
      title: "Konten Website",
      items: [
        {
          label: "Beranda & Slider",
          href: `${basePath}/website`,
          icon: Home,
          children: [
            { label: "Overview Website", href: `${basePath}/website`, icon: Home },
            { label: "Slider Beranda", href: `${basePath}/website/sliders`, icon: LayoutTemplate },
            { label: "Popup Pengumuman", href: `${basePath}/website/popups`, icon: Megaphone },
          ],
        },
        {
          label: "Informasi & Berita",
          href: `${basePath}/website/posts`,
          icon: FileText,
          children: [
            { label: "Artikel & Pos", href: `${basePath}/website/posts`, icon: FileText },
            { label: "Pengumuman", href: `${basePath}/website/posts?type=PENGUMUMAN`, icon: Megaphone },
            { label: "Kategori Artikel", href: `${basePath}/website/categories`, icon: Tag },
            { label: "Agenda & Acara", href: `${basePath}/website/events`, icon: Calendar },
            { label: "Pusat Unduhan", href: `${basePath}/website/documents`, icon: Download },
          ],
        },
        {
          label: "Profil & GTK",
          href: `${basePath}/website/about`,
          icon: Building2,
          children: [
            { label: "Profil Lembaga", href: `${basePath}/website/about`, icon: Info },
            { label: "Guru & Staf (GTK)", href: `${basePath}/website/gtk`, icon: Users },
            { label: "Fasilitas Sekolah", href: `${basePath}/website/facilities`, icon: Building2 },
            { label: "Program Unggulan", href: `${basePath}/website/programs`, icon: BookOpen },
            { label: "Ekskul", href: `${basePath}/website/extracurriculars`, icon: Activity },
            { label: "Kerjasama", href: `${basePath}/website/partners`, icon: Briefcase },
          ],
        },
        {
          label: "Galeri & Alumni",
          href: `${basePath}/website/gallery`,
          icon: Image,
          children: [
            { label: "Galeri Foto", href: `${basePath}/website/gallery`, icon: Image },
            { label: "Prestasi Siswa", href: `${basePath}/website/achievements`, icon: Award },
            { label: "Alumni Success", href: `${basePath}/website/alumni`, icon: GraduationCap },
          ],
        },
      ],
    },
    {
      title: "Manajemen",
      items: [
        {
          label: "PPDB Online",
          href: `${basePath}/ppdb`,
          icon: UserPlus,
          children: [
            { label: "Overview PPDB", href: `${basePath}/ppdb`, icon: LayoutDashboard },
            { label: "Gelombang / Periode", href: `${basePath}/ppdb/periode`, icon: Calendar },
            { label: "Persyaratan Berkas", href: `${basePath}/ppdb/persyaratan`, icon: FileText },
            { label: "Meja Pendaftar", href: `${basePath}/ppdb/pendaftar`, icon: Users },
            { label: "Tagihan & Bayar", href: `${basePath}/ppdb/tagihan`, icon: Wallet },
          ],
        },
        ...(isFree ? [] : [
          {
            label: "Akademik",
            href: `${basePath}/schedules`,
            icon: GraduationCap,
            children: [
              { label: "Jadwal Pelajaran", href: `${basePath}/schedules`, icon: Calendar },
              { label: "E-Rapor", href: `${basePath}/grades`, icon: FileText },
              { label: "Catatan Perilaku (BK)", href: `${basePath}/discipline`, icon: ShieldCheck },
            ],
          }
        ]),
        ...(isFree ? [] : [
          {
            label: "Kehadiran",
            href: `${basePath}/attendance`,
            icon: CalendarCheck,
            children: [
              { label: "Overview Presensi", href: `${basePath}/attendance`, icon: LayoutDashboard },
              { label: "Absensi Siswa", href: `${basePath}/attendance/students`, icon: GraduationCap },
              { label: "Absensi Guru (GTK)", href: `${basePath}/attendance/gtk`, icon: Users },
              { label: "Pengajuan Izin", href: `${basePath}/attendance/permits`, icon: FileCheck },
            ],
          }
        ]),
        {
          label: "Keuangan & Kas",
          href: `${basePath}/finance`,
          icon: Wallet,
          children: [
            { label: "Dashboard Keuangan", href: `${basePath}/finance`, icon: PieChart },
            { label: "Kelola Tabungan", href: `${basePath}/finance/wallet`, icon: Wallet },
            { label: "Tagihan Siswa", href: `${basePath}/finance/invoice`, icon: Receipt },
            { label: "Jenis Tagihan", href: `${basePath}/finance/billing-types`, icon: BadgeDollarSign },
            { label: "Cashflow", href: `${basePath}/finance/cashflow`, icon: TrendingUp },
          ],
        },
        {
          label: "E-Kantin",
          href: `${basePath}/canteen`,
          icon: Store,
          children: [
            { label: "Overview Kantin", href: `${basePath}/canteen`, icon: LayoutDashboard },
            { label: "Merchant", href: `${basePath}/canteen/merchants`, icon: Store },
          ],
        },
        {
          label: "Donasi & Infaq",
          href: `${basePath}/donation/campaigns`,
          icon: Heart,
          children: [
            { label: "Kampanye Donasi", href: `${basePath}/donation/campaigns`, icon: Heart },
          ],
        },
        {
          label: "Data Master",
          href: `${basePath}/users`,
          icon: Database,
          children: [
            { label: "Data Admin", href: `${basePath}/users/admin`, icon: ShieldCheck },
            { label: "Data Guru", href: `${basePath}/users/guru`, icon: Users },
            { label: "Data Siswa", href: `${basePath}/students`, icon: GraduationCap },
            { label: "Data Orang Tua", href: `${basePath}/users/orangtua`, icon: Users },
            { label: "Manajemen Kelas", href: `${basePath}/students/classrooms`, icon: BookOpen },
            { label: "Mata Pelajaran", href: `${basePath}/subjects`, icon: BookOpen },
          ],
        },
      ],
    },
    {
      title: "Laporan",
      items: [
        { label: "Laporan Umum", href: `${basePath}/reports`, icon: FileText },
      ]
    },
    {
      title: "Aktivitas & Pesan",
      items: [
        { label: "Notifikasi", href: `${basePath}/notifications`, icon: Bell },
        { label: "Pesan", href: `${basePath}/my-messages`, icon: Mail },
        { label: "Broadcast WA", href: `${basePath}/broadcast`, icon: Megaphone },
      ],
    },
    {
      title: "Konfigurasi",
      items: [
        {
          label: "Pengaturan",
          href: `${basePath}/settings`,
          icon: Settings,
          children: [
            { label: "Umum", href: `${basePath}/settings`, icon: Building2 },
            { label: "Custom Domain", href: `${basePath}/settings/domain`, icon: Globe },
            { label: "Tampilan & Tema", href: `${basePath}/settings/appearance`, icon: Palette },
            { label: "Kecerdasan Buatan (AI)", href: `${basePath}/settings/ai`, icon: BrainCircuit },
            { label: "Email (SMTP)", href: `${basePath}/settings/email`, icon: Mail },
            { label: "WhatsApp Gateway", href: `${basePath}/settings/whatsapp`, icon: Megaphone },
            { label: "Payment Gateway", href: `${basePath}/settings/payment`, icon: CreditCard },
          ],
        },
        { label: "Audit Log", href: `${basePath}/audit`, icon: FileText },
        {
          label: "Langganan",
          href: `${basePath}/billing`,
          icon: CreditCard,
          children: [
            { label: "Paket Langganan", href: `${basePath}/billing`, icon: Wallet },
            { label: "Riwayat Pembayaran", href: `${basePath}/billing/history`, icon: Receipt },
          ],
        },
      ],
    },
  ]

  if (isFree) {
    // Sembunyikan menu Dashboard Utama untuk paket free
    const dashboardSectionIndex = menu.findIndex(s => s.items.some(i => i.label === "Dashboard"));
    if (dashboardSectionIndex !== -1) {
      menu[dashboardSectionIndex].items = menu[dashboardSectionIndex].items.filter(i => i.label !== "Dashboard");
    }

    menu.forEach(section => {
      // Manajemen
      if (section.title === "Manajemen") {
        section.items = section.items.filter(item => {
          if (item.label === "PPDB Online") return access.enable_ppdb === true;
          if (item.label === "Keuangan & Kas") return access.enable_finance === true;
          if (item.label === "E-Kantin") return access.enable_finance === true; // kantin terkait finance
          if (item.label === "Donasi & Infaq") return false; // Fitur PRO saja
          if (item.label === "Akademik & Siswa") return false; // always false for free? Actually, we didn't add this toggle. Let's make it false or true depending on requirements. Let's make it false for free plan to encourage upgrade, or just true. Let's keep it true.
          return true; // Data master dll
        });
      }
      
      // Laporan
      if (section.title === "Laporan") {
        section.items = section.items.filter(item => {
          if (item.label === "Laporan Umum") return access.enable_analytics === true;
          return true;
        });
      }
      
      // Aktivitas & Pesan
      if (section.title === "Aktivitas & Pesan") {
        section.items = section.items.filter(item => {
          if (item.label === "Broadcast WA") return false; // Fitur PRO saja
          return true;
        });
      }

      // Konfigurasi
      if (section.title === "Konfigurasi") {
        section.items.forEach(item => {
          if (item.label === "Pengaturan" && item.children) {
            item.children = item.children.filter(child => {
              if (child.label === "Custom Domain") return access.enable_custom_domain === true;
              if (child.label === "WhatsApp Gateway") return access.enable_whatsapp === true;
              if (child.label === "Payment Gateway") return access.enable_finance === true;
              if (child.label === "Kecerdasan Buatan (AI)") return false; // Fitur PRO
              if (child.label === "Email (SMTP)") return false; // Fitur PRO
              return true;
            });
          }
        });
        section.items = section.items.filter(item => {
          if (item.label === "Audit Log") return false; // Pro only
          return true;
        });
      }
    });

    // Remove empty sections
    return menu.filter(section => section.items && section.items.length > 0);
  }

  return menu;
}

// --- GTK MENU ---
function getGTKMenu(basePath: string): MenuSection[] {
  return [
    {
      items: [
        { label: "Dashboard", href: basePath, icon: LayoutDashboard },
      ],
    },
    {
      title: "Kehadiran",
      items: [
        { label: "Absensi Saya", href: `${basePath}/absensi`, icon: CalendarCheck, badge: "Pro" },
      ],
    },
    {
      title: "Kelas & KBM",
      items: [
        { label: "Jurnal & Presensi", href: `${basePath}/jurnal`, icon: FileText, badge: "Pro" },
        { label: "Input Nilai", href: `${basePath}/nilai`, icon: Award, badge: "Pro" },
      ],
    },
    {
      title: "Ujian CBT (Pro)",
      items: [
        { label: "Bank Soal", href: `${basePath}/cbt/bank-soal`, icon: FileText, badge: "Pro" },
        { label: "Jadwal CBT", href: `${basePath}/cbt/jadwal`, icon: CalendarCheck, badge: "Pro" },
      ],
    },
    {
      title: "Konten & Informasi",
      items: [
        { label: "Tulis Artikel", href: `${basePath}/posts`, icon: FileText, badge: "Pending" },
        { label: "Pesan Internal", href: `${basePath}/messages`, icon: MessageSquare, badge: "Pro" },
      ],
    },
    {
      title: "Akun",
      items: [
        { label: "Profil Saya", href: `${basePath}/profil`, icon: User },
      ]
    }
  ]
}

// --- MEMBER (USER BIASA) MENU ---
function getMemberMenu(basePath: string): MenuSection[] {
  return [
    {
      items: [
        { label: "Dashboard", href: basePath, icon: LayoutDashboard },
      ],
    },
    {
      title: "Layanan Siswa",
      items: [
        { label: "Nilai & Rapor", href: `${basePath}/rapor`, icon: Award },
        { label: "Riwayat Kantin", href: `${basePath}/kantin`, icon: Store },
        { label: "Pesan", href: `${basePath}/my-messages`, icon: MessageSquare },
      ],
    },
    {
      title: "Informasi",
      items: [
        { label: "Notifikasi", href: `${basePath}/notifications`, icon: Bell },
      ],
    },
    {
      title: "Akun",
      items: [
        {
          label: "Pengaturan",
          href: `${basePath}/settings`,
          icon: Settings,
          children: [
            { label: "Profil Saya", href: `${basePath}/settings`, icon: User },
            { label: "Keamanan", href: `${basePath}/settings/security`, icon: Lock },
          ],
        },
      ],
    },
  ]
}

// --- SUPER ADMIN MENU ---
function getSuperAdminMenu(pendingPayments = 0): MenuSection[] {
  return [
    {
      items: [
        { label: "Dashboard", href: "/super-admin", icon: LayoutDashboard },
      ],
    },
    {
      title: "Platform",
      items: [
        {
          label: "Tenant",
          href: "/super-admin/tenants",
          icon: Building2,
          children: [
            { label: "Semua Tenant", href: "/super-admin/tenants", icon: Globe },
            { label: "Paket & Harga", href: "/super-admin/tenants/plans", icon: Tag },
            { label: "Kode Diskon", href: "/super-admin/tenants/discounts", icon: Tag },
            { label: "Pengajuan Sekolah", href: "/super-admin/applications", icon: FileText },
          ],
        },
        {
          label: "Data Master",
          href: "/super-admin/users",
          icon: Database,
          children: [
            { label: "Semua Pengguna", href: "/super-admin/users", icon: UserCog },
            { label: "Super Admin", href: "/super-admin/users/admins", icon: ShieldCheck },
          ],
        },
      ],
    },
    {
      title: "Keuangan",
      items: [
        {
          label: "Pembayaran",
          href: "/super-admin/payments",
          icon: CreditCard,
          badge: pendingPayments,
          children: [
            { label: "Semua Transaksi", href: "/super-admin/payments", icon: Receipt },
            { label: "Pendapatan", href: "/super-admin/payments/revenue", icon: Wallet },
          ],
        },
      ],
    },
    {
      title: "Analitik",
      items: [
        {
          label: "Analitik Platform",
          href: "/super-admin/analytics",
          icon: BarChart3,
        },
      ],
    },
    {
      title: "Kemitraan",
      items: [
        {
          label: "Manajemen Afiliasi",
          href: "/super-admin/affiliates",
          icon: UserPlus,
        },
      ],
    },
    {
      title: "Komunikasi",
      items: [
        {
          label: "Broadcast Pesan",
          href: "/super-admin/broadcast",
          icon: Megaphone,
        },
        {
          label: "Email Edukasi",
          href: "/super-admin/educational-emails",
          icon: Mail,
        },
      ],
    },
    {
      title: "Monitoring",
      items: [
        { label: "Riwayat Notifikasi", href: "/super-admin/notifications", icon: BellRing },
        { label: "Audit Log Global", href: "/super-admin/audit", icon: FileText },
      ],
    },
    {
      title: "Sistem",
      items: [
        {
          label: "Pengaturan",
          href: "/super-admin/settings",
          icon: Settings,
          children: [
            { label: "Platform", href: "/super-admin/settings", icon: Building2 },
            { label: "Profil Saya", href: "/super-admin/profile", icon: User },
          ]
        },
      ],
    },
  ]
}

// ============================================================
// SIDEBAR COMPONENT
// ============================================================

interface SidebarProps {
  isSuperAdmin?: boolean
}

export function Sidebar({ isSuperAdmin }: SidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentQuery = searchParams.toString()
  const fullPath = currentQuery ? `${pathname}?${currentQuery}` : pathname

  const { data: session } = useSession()
  const { branding } = useTenantBranding()
  const [collapsed, setCollapsed] = useState(false)
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({})
  const [pendingPayments, setPendingPayments] = useState(0)
  const [platformLogo, setPlatformLogo] = useState("/logo-schoolpro.png")

  useEffect(() => {
    fetch("/api/public/platform-info")
      .then(res => res.json())
      .then(data => {
        if (data && data.app_logo) setPlatformLogo(data.app_logo)
      })
      .catch(console.error)
  }, [])

  const basePath = "/admin"
  const isSuperAdminPath = pathname.startsWith("/super-admin")
  const isGTK = pathname.startsWith("/panel-gtk")

  // Fetch pending payments count for super admin badge
  useEffect(() => {
    if (!isSuperAdminPath) return
    fetch("/api/super-admin/stats")
      .then(r => r.json())
      .then(d => setPendingPayments(d.pendingPayments || 0))
      .catch(() => {})
  }, [isSuperAdminPath])

  // Detect role dari session
  const currentTenantSlug = session?.user?.tenants?.[0]?.slug
  const currentTenant = session?.user?.tenants?.find((t) => t.slug === currentTenantSlug) || session?.user?.tenants?.[0]
  const currentRole = currentTenant?.role || "orangtua"
  const currentPlan = (session?.user as any)?.tenants?.[0]?.plan || "free"

  const { access: freeAccess } = useFreePlanAccess()

  // Branding: pakai context (update instan) untuk nama & logo, fallback ke session
  const brandName = isSuperAdminPath ? "SchoolPro" : (branding.name || currentTenant?.name || "SchoolPro")
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
    sections = getTenantMenu(basePath, currentPlan, freeAccess)
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
                return fullPath === child.href
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
                "flex h-9 w-9 items-center justify-center rounded-xl text-white font-bold text-sm shadow-lg overflow-hidden",
                finalBrandLogo || isSuperAdminPath ? "bg-transparent shadow-none" : "btn-gradient"
              )}>
                {isSuperAdminPath
                  ? <img src={platformLogo} alt="SchoolPro Logo" className="h-full w-full object-contain" />
                  : finalBrandLogo
                    ? <img src={finalBrandLogo} alt={brandName} className="h-full w-full object-contain" />
                    : brandInitial
                }
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm tracking-tight leading-tight truncate max-w-[140px]">{brandName} v1.1</span>
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
              "flex h-9 w-9 mx-auto items-center justify-center rounded-xl text-white font-bold text-sm shadow-lg hover:opacity-90 transition-opacity overflow-hidden",
              finalBrandLogo || isSuperAdminPath ? "bg-transparent shadow-none" : "btn-gradient"
            )}
          >
            {isSuperAdminPath
              ? <img src={platformLogo} alt="SchoolPro Logo" className="h-full w-full object-contain" />
              : finalBrandLogo
                ? <img src={finalBrandLogo} alt={brandName} className="h-full w-full object-contain" />
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
                const isExactActive = item.href.includes("?") ? fullPath === item.href : pathname === item.href
                const isChildActive = item.children?.some(
                  (child) => {
                    if (child.href.includes("?")) return fullPath === child.href
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
                          <span className="flex-1 text-left flex items-center gap-2">
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
                            const isSubActive = child.href.includes("?") ? fullPath === child.href : (pathname === child.href || pathname.startsWith(child.href + "/"))
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
          &copy; {new Date().getFullYear()} <a href="https://schoolpro.id" target="_blank" rel="noopener noreferrer" className="hover:underline text-foreground">SchoolPro.id</a>
        </p>
        <p className="text-[10px] text-muted-foreground font-mono" title="Application Version">
          v1.0.5 {process.env.NEXT_PUBLIC_APP_VERSION ? `(rev: ${process.env.NEXT_PUBLIC_APP_VERSION.substring(0, 7)})` : "(dev)"}
        </p>
      </div>
    </aside>
  )
}
