"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"

const labelMap: Record<string, string> = {
  dashboard: "Dashboard",
  settings: "Pengaturan",
  appearance: "Tampilan & Tema",
  security: "Keamanan",
  users: "Pengguna",
  invite: "Undang Anggota",
  roles: "Peran & Izin",
  billing: "Langganan",
  history: "Riwayat Pembayaran",
  notifications: "Notifikasi",
  preferences: "Preferensi",
  reports: "Laporan",
  trends: "Tren",
  export: "Export Data",
  audit: "Audit Log",
  "super-admin": "Super Admin",
  payments: "Pembayaran",
  analytics: "Analitik",
  "my-documents": "Dokumen Saya",
  "my-schedule": "Jadwal",
  "my-messages": "Pesan",
  help: "Panduan",
  faq: "FAQ",
  tenants: "Bisnis",
  plans: "Paket & Harga",
  admins: "Super Admin",
  activity: "Aktivitas",
  revenue: "Pendapatan",
  email: "Email & SMTP",
  whatsapp: "WhatsApp",
  payment: "Payment Gateway",
}

export function Breadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  const crumbs = segments.map((seg, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/")
    const label = labelMap[seg] || seg.charAt(0).toUpperCase() + seg.slice(1)
    const isLast = i === segments.length - 1
    return { href, label, isLast }
  })

  if (crumbs.length <= 1) return null

  return (
    <nav className="flex items-center gap-1.5 text-sm mb-4">
      <Link href={`/${segments[0]}`} className="text-muted-foreground hover:text-foreground transition-colors">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {crumbs.slice(1).map((crumb) => (
        <span key={crumb.href} className="flex items-center gap-1.5">
          <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
          {crumb.isLast ? (
            <span className="font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="text-muted-foreground hover:text-foreground transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}
