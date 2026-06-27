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
  children?: { label: string; href: string; icon: LucideIcon; badge?: number | string }[]
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

  const menu: MenuSection[] = [
    ...(has("dashboard_analytics") ? [{
      items: [
        { label: "Dashboard", href: basePath, icon: LayoutDashboard },
      ],
    }] : []),
    ...(has("website_content") ? [{
      title: "Konten Website",
      items: [
        {
          label: "Beranda & Slider",
          href: `${basePath}/website`,
          icon: Home,
          children: [
            { label: "Overview Website", href: `${basePath}/website`, icon: Home },
            { label: "Menu Navigasi", href: `${basePath}/website/menu`, icon: LayoutTemplate },
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
            { label: "Pengumuman", href: `${basePath}/website/pengumuman`, icon: Megaphone },
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
          label: "Galeri",
          href: `${basePath}/website/gallery`,
          icon: ImageIcon,
          children: [
            { label: "Galeri Foto", href: `${basePath}/website/gallery`, icon: ImageIcon },
            { label: "Prestasi", href: `${basePath}/website/achievements`, icon: Award },
            { label: "Alumni Success", href: `${basePath}/website/alumni`, icon: GraduationCap },
          ],
        },
      ],
    }] : []),
    {
      title: "Manajemen",
      items: [
        ...(has("ppdb") ? [
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
        ] : []),
        ...(has("akademik") ? [
          {
            label: "Akademik",
            href: `${basePath}/schedules`,
            icon: GraduationCap,
            children: [
              { label: "Jadwal Pelajaran", href: `${basePath}/schedules`, icon: Calendar },
              { 
                label: "E-Rapor Kurmer", 
                href: `${basePath}/erapor/tp`, 
                icon: FileText,
                children: [
                  { label: "Tujuan Pembelajaran", href: `${basePath}/erapor/tp`, icon: Tag },
                  { label: "Nilai Formatif", href: `${basePath}/erapor/nilai-formatif`, icon: FileText },
                  { label: "Nilai Sumatif", href: `${basePath}/erapor/nilai-sumatif`, icon: Award },
                  { label: "Cetak Rapor", href: `${basePath}/erapor/cetak`, icon: Download },
                ]
              },
              { label: "Catatan Perilaku (BK)", href: `${basePath}/discipline`, icon: ShieldCheck },
            ],
          }
        ] : []),
        ...(has("kehadiran_guru") ? [
          {
            label: "Kehadiran Guru",
            href: `${basePath}/attendance/gtk/overview`,
            icon: Users,
            children: [
              { label: "Overview", href: `${basePath}/attendance/gtk/overview`, icon: TrendingUp },
              { label: "Presensi Guru", href: `${basePath}/attendance/gtk/presence`, icon: CalendarCheck },
              { label: "Perizinan", href: `${basePath}/attendance/gtk/permits`, icon: Clock },
              { label: "Pengaturan", href: `${basePath}/attendance/gtk/settings`, icon: Settings },
            ],
          }
        ] : []),
        ...(has("kehadiran_siswa") ? [
          {
            label: "Kehadiran Siswa",
            href: `${basePath}/attendance/students/overview`,
            icon: GraduationCap,
            children: [
              { label: "Overview", href: `${basePath}/attendance/students/overview`, icon: LayoutDashboard },
              { label: "Presensi Siswa", href: `${basePath}/attendance/students/presence`, icon: GraduationCap },
              { label: "Perizinan Siswa", href: `${basePath}/attendance/students/permits`, icon: FileCheck },
            ],
          }
        ] : []),
        ...(has("keuangan") ? [
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
        ] : []),
        ...(has("e_kantin") ? [
          {
            label: "E-Kantin",
            href: `${basePath}/canteen`,
            icon: Store,
            children: [
              { label: "Overview Kantin", href: `${basePath}/canteen`, icon: LayoutDashboard },
              { label: "Merchant", href: `${basePath}/canteen/merchants`, icon: Store },
            ],
          },
        ] : []),
        ...(has("donasi") ? [
          {
            label: "Donasi & Infaq",
            href: `${basePath}/donation/campaigns`,
            icon: Heart,
            children: [
              { label: "Kampanye Donasi", href: `${basePath}/donation/campaigns`, icon: Heart },
            ],
          },
        ] : []),
        ...(has("data_master") ? [{
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
        }] : []),
      ],
    },
    ...(has("academy") ? [{
      title: "Academy (LMS)",
      items: [
        { label: "Katalog Kelas", href: `${basePath}/academy`, icon: GraduationCap },
        { label: "Kelas Saya", href: `${basePath}/academy/my-courses`, icon: BookOpen },
      ]
    }] : []),
    ...(has("laporan") ? [{
      title: "Laporan",
      items: [
        { label: "Laporan Umum", href: `${basePath}/reports`, icon: FileText },
      ]
    }] : []),
    {
      title: "Aktivitas & Pesan",
      items: [
        { label: "Notifikasi", href: `${basePath}/notifications`, icon: Bell },
        { label: "Pesan", href: `${basePath}/my-messages`, icon: Mail },
        ...(has("broadcast_wa") ? [{ label: "Broadcast WA", href: `${basePath}/broadcast`, icon: Megaphone }] : []),
        ...(has("whatsapp_gateway") ? [{ label: "Log Antrean WA", href: `${basePath}/wa-logs`, icon: ClipboardList }] : []),
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
            ...(has("custom_domain") ? [{ label: "Custom Domain", href: `${basePath}/settings/domain`, icon: Globe }] : []),
            { label: "Tampilan & Tema", href: `${basePath}/settings/appearance`, icon: Palette },
            ...(has("ai_settings") ? [{ label: "Kecerdasan Buatan (AI)", href: `${basePath}/settings/ai`, icon: BrainCircuit }] : []),
            ...(has("email_smtp") ? [{ label: "Email (SMTP)", href: `${basePath}/settings/email`, icon: Mail }] : []),
            ...(has("whatsapp_gateway") ? [{ label: "WhatsApp Gateway", href: `${basePath}/settings/whatsapp`, icon: Megaphone }] : []),
            ...(has("payment_gateway") ? [{ label: "Payment Gateway", href: `${basePath}/settings/payment`, icon: CreditCard }] : []),
          ],
        },
        ...(has("audit_log") ? [{ label: "Audit Log", href: `${basePath}/audit`, icon: FileText }] : []),
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

  // Filter menu berdasarkan feature access dari database
  // Dashboard hanya untuk plan yang punya dashboard_analytics
  if (!has("dashboard_analytics")) {
    const dashboardSectionIndex = menu.findIndex(s => s.items.some(i => i.label === "Dashboard"));
    if (dashboardSectionIndex !== -1) {
      menu[dashboardSectionIndex].items = menu[dashboardSectionIndex].items.filter(i => i.label !== "Dashboard");
    }
  }

  menu.forEach(section => {
    // Data Master
    if (section.title === "Manajemen") {
      section.items = section.items.filter(item => {
        if (item.label === "Data Master") return has("data_master");
        return true;
      });
    }

    // Laporan
    if (section.title === "Laporan") {
      section.items = section.items.filter(item => {
        if (item.label === "Laporan Umum") return has("laporan");
        return true;
      });
    }

    // Aktivitas & Pesan
    if (section.title === "Aktivitas & Pesan") {
      section.items = section.items.filter(item => {
        if (item.label === "Broadcast WA") return has("broadcast_wa");
        if (item.label === "Log Antrean WA") return has("broadcast_wa");
        return true;
      });
    }

    // Konfigurasi
    if (section.title === "Konfigurasi") {
      section.items.forEach(item => {
        if (item.label === "Pengaturan" && item.children) {
          item.children = item.children.filter(child => {
            if (child.label === "Custom Domain") return has("custom_domain");
            if (child.label === "WhatsApp Gateway") return has("whatsapp_gateway");
            if (child.label === "Payment Gateway") return has("payment_gateway");
            if (child.label === "Kecerdasan Buatan (AI)") return has("ai_settings");
            if (child.label === "Email (SMTP)") return has("email_smtp");
            return true;
          });
        }
      });
      section.items = section.items.filter(item => {
        if (item.label === "Audit Log") return has("audit_log");
        return true;
      });
    }
  });

  // Remove empty sections
  return menu.filter(section => section.items && section.items.length > 0);
}

// --- GTK MENU ---
export function getGTKMenu(basePath: string): MenuSection[] {
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
export function getMemberMenu(basePath: string): MenuSection[] {
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
export function getSuperAdminMenu(pendingPayments = 0): MenuSection[] {
  return [
    {
      items: [
        { label: "Dashboard", href: "/super-admin", icon: LayoutDashboard },
        { label: "AI Copilot (Analyst)", href: "/super-admin/ai-analyst", icon: BrainCircuit },
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
            { label: "Paket Token AI", href: "/super-admin/tenants/ai-packages", icon: Zap },
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
          label: "Manajemen Kelas",
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

