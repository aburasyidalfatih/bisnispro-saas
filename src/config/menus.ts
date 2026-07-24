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
  Bug,
  Clock,
  Moon,
  type LucideIcon,
} from "lucide-react"
import { cn, normalizeImageUrl } from "@/lib/utils"
// ============================================================
// MENU DEFINITIONS
// ============================================================

export interface MenuItem {
  label: string
  href: string
  icon: LucideIcon
  badge?: number | string
  children?: { 
    label: string; 
    href: string; 
    icon: LucideIcon; 
    badge?: number | string;
    children?: { label: string; href: string; icon: LucideIcon; badge?: number | string }[] 
  }[]
}

export interface MenuSection {
  title?: string
  items: MenuItem[]
}

import { usePlanAccess } from "@/hooks/use-free-plan-access"

// --- TENANT ADMIN MENU ---
export function getTenantMenu(basePath: string, plan: string = "free", access: Record<string, boolean>): MenuSection[] {
  // Feature access dari database (diset oleh super admin)
  const pa = (access as any)?._plan_access || {} as Record<string, boolean>
  const has = (feature: string) => pa[feature] === true

  return [
    {
      items: [
        { label: "Dashboard", href: basePath, icon: LayoutDashboard },
      ],
    },
    {
      title: "Kelola Website",
      items: [
        { label: "Overview", href: `${basePath}/website`, icon: Globe },
        { label: "Tentang Kami", href: `${basePath}/website/about`, icon: Info },
        { label: "Layanan", href: `${basePath}/website/services`, icon: Briefcase },
        { label: "Portofolio", href: `${basePath}/website/portfolio`, icon: ImageIcon },
        { label: "Tim Kami", href: `${basePath}/website/team`, icon: Users },
        { label: "Testimoni", href: `${basePath}/website/testimonials`, icon: MessageSquare },
        { label: "Blog/Artikel", href: `${basePath}/website/posts`, icon: FileText },
        { label: "Agenda/Event", href: `${basePath}/website/events`, icon: Calendar },
        { label: "Galeri", href: `${basePath}/website/gallery`, icon: ImageIcon },
        { label: "Partner & Klien", href: `${basePath}/website/partners`, icon: Building2 },
        { label: "Kantor Cabang", href: `${basePath}/website/offices`, icon: Store },
        { label: "FAQ", href: `${basePath}/website/faq`, icon: HelpCircle },
        { label: "Halaman Custom", href: `${basePath}/website/pages`, icon: LayoutTemplate },
        { label: "Dokumen/Download", href: `${basePath}/website/documents`, icon: Download },
        { label: "Slider/Banner", href: `${basePath}/website/sliders`, icon: MonitorSmartphone },
        { label: "Popup", href: `${basePath}/website/popups`, icon: Megaphone },
        { label: "Menu Navigasi", href: `${basePath}/website/menu`, icon: LayoutDashboard },
        { label: "Kategori", href: `${basePath}/website/categories`, icon: Tag },
      ],
    },
    {
      title: "Interaksi",
      items: [
        { label: "Kontak Masuk", href: `${basePath}/contact-submissions`, icon: Mail },
        { label: "Pesan Internal", href: `${basePath}/my-messages`, icon: MessageSquare },
        { label: "Notifikasi", href: `${basePath}/notifications`, icon: Bell },
        { label: "Broadcast WA", href: `${basePath}/broadcast`, icon: Megaphone },
        { label: "Log WA", href: `${basePath}/wa-logs`, icon: ClipboardList },
      ],
    },
    {
      title: "AI Assistant",
      items: [
        { label: "AI Assistant", href: `${basePath}/ai`, icon: BrainCircuit },
      ],
    },
    {
      title: "Laporan",
      items: [
        { label: "Laporan", href: `${basePath}/reports`, icon: BarChart3 },
      ],
    },
    {
      title: "Pengaturan",
      items: [
        { label: "Umum", href: `${basePath}/settings`, icon: Settings },
        { label: "Domain", href: `${basePath}/settings/domain`, icon: Globe },
        { label: "Tampilan", href: `${basePath}/settings/appearance`, icon: Palette },
        { label: "AI", href: `${basePath}/settings/ai`, icon: BrainCircuit },
        { label: "Email", href: `${basePath}/settings/email`, icon: Mail },
        { label: "WhatsApp", href: `${basePath}/settings/whatsapp`, icon: MessageSquare },
        { label: "Keamanan", href: `${basePath}/settings/security`, icon: Lock },
        { label: "Audit Log", href: `${basePath}/audit`, icon: FileText },
        { label: "Billing", href: `${basePath}/billing`, icon: CreditCard },
      ],
    },
    {
      title: "Manajemen User",
      items: [
        { label: "Admin/Tim", href: `${basePath}/users/admin`, icon: UserCog },
      ],
    },
  ]
}

// --- SUPER ADMIN MENU ---
export function getSuperAdminMenu(pendingPayments = 0): MenuSection[] {
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
          label: "Bisnis",
          href: "/super-admin/tenants",
          icon: Building2,
          children: [
            { label: "Semua Bisnis", href: "/super-admin/tenants", icon: Globe },
            { label: "Paket & Harga", href: "/super-admin/tenants/plans", icon: Tag },
            { label: "Paket Token AI", href: "/super-admin/tenants/ai-packages", icon: Zap },
            { label: "Kode Diskon", href: "/super-admin/tenants/discounts", icon: Tag },
            { label: "Pengajuan Perusahaan", href: "/super-admin/applications", icon: FileText },
            { label: "Perusahaan Dormant", href: "/super-admin/dormant", icon: Moon },
            { label: "Retensi Bisnis", href: "/super-admin/retention", icon: Megaphone },
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
        {
          label: "Theme Engine",
          href: "/super-admin/themes",
          icon: Palette,
        },
        {
          label: "Feedback Laporan",
          href: "/super-admin/feedback",
          icon: MessageSquare,
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
        {
          label: "Analisa Iklan",
          href: "/super-admin/ads-analytics",
          icon: Megaphone,
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
      title: "Academy (LMS)",
      items: [
        {
          label: "Manajemen Divisi",
          href: "/super-admin/academy",
          icon: GraduationCap,
        },
      ],
    },
    {
      title: "Monitoring",
      items: [
        { label: "Riwayat Notifikasi", href: "/super-admin/notifications", icon: BellRing },
        { label: "Log Antrean WA", href: "/super-admin/wa-logs", icon: Megaphone },
        { label: "Pusat Log & Audit", href: "/super-admin/audit", icon: FileText },
      ],
    },
    {
      title: "Sistem",
      items: [
        {
          label: "Kendali Fitur",
          href: "/super-admin/features",
          icon: Shield,
        },
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


export function getGTKMenu(basePath: string): MenuSection[] { return []; }
export function getMemberMenu(basePath: string): MenuSection[] { return []; }
