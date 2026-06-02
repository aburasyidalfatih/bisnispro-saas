"use client"

import { useEffect, useState } from"react"
import { useSession } from"next-auth/react"
import { Card, CardContent } from"@/components/ui/card"
import { Users, UserCheck, ClipboardList, Wallet, Calendar, ArrowRight, UserPlus, Settings2 } from"lucide-react"
import Link from"next/link"
import { Button } from"@/components/ui/button"

export default function PPDBOverviewPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<any>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)

  useEffect(() => {
    const sessionTenantId = session?.user?.tenants?.[0]?.id
    if (sessionTenantId) setTenantId(sessionTenantId)
  }, [session])

  useEffect(() => {
    if (!tenantId) return
    fetch(`/api/ppdb/stats?tenantId=${tenantId}`)
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
  }, [tenantId])

  const statCards = [
    { label:"Total Pendaftar", value: stats?.totalPendaftar ??"—", icon: Users, color:"text-blue-500", bg:"bg-blue-500/10" },
    { label:"Menunggu Verifikasi", value: stats?.menungguVerifikasi ??"—", icon: ClipboardList, color:"text-amber-500", bg:"bg-amber-500/10" },
    { label:"Diterima", value: stats?.diterima ??"—", icon: UserCheck, color:"text-emerald-500", bg:"bg-emerald-500/10" },
    {
      label:"Pendapatan Pendaftaran",
      value: new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", maximumFractionDigits: 0 }).format(stats?.pendapatanPendaftaran ?? 0),
      icon: Wallet, color:"text-violet-500", bg:"bg-violet-500/10"
    },
  ]

  const quickLinks = [
    { title:"Buka Gelombang Pendaftaran", desc:"Buat periode pembukaan pendaftaran dengan kuota & biaya.", href:"/admin/ppdb/periode", icon: Calendar, done: false },
    { title:"Atur Persyaratan Berkas", desc:"Tentukan dokumen yang wajib diunggah calon siswa.", href:"/admin/ppdb/persyaratan", icon: Settings2, done: false },
    { title:"Pantau Meja Pendaftar", desc:"Lihat & verifikasi data seluruh calon siswa yang mendaftar.", href:"/admin/ppdb/pendaftar", icon: Users, done: false },
    { title:"Kelola Tagihan & Bayar", desc:"Verifikasi bukti transfer pembayaran dari pendaftar.", href:"/admin/ppdb/tagihan", icon: Wallet, done: false },
  ]

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">PPDB Online</h1>
          <p className="text-muted-foreground mt-1 text-sm">Pantau perkembangan pendaftaran siswa baru secara real-time.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-xl" asChild>
            <Link href="/admin/ppdb/periode">
              <Calendar className="mr-2 h-4 w-4" /> Kelola Gelombang
            </Link>
          </Button>
          <Button className="rounded-xl btn-gradient text-white border-0 shadow-lg shadow-primary/20" asChild>
            <Link href="/admin/ppdb/pendaftar">
              <Users className="mr-2 h-4 w-4" /> Meja Pendaftar
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label} className="glass border-0">
            <CardContent className="p-6">
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${s.bg} mb-4`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div className="text-3xl font-extrabold tracking-tight">{s.value}</div>
              <p className="text-xs text-muted-foreground mt-1 font-medium">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-base font-bold mb-4">Pengaturan & Navigasi Cepat</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {quickLinks.map((item, i) => (
            <Link key={i} href={item.href}
              className="group flex items-center gap-4 p-5 glass rounded-2xl border border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all duration-200"
            >
              <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                <item.icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 -translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
