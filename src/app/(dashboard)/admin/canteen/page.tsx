"use client"

import { useEffect, useState } from"react"
import { useSession } from"next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { Badge } from"@/components/ui/badge"
import {
  Store, ShoppingCart, Users, TrendingUp, Wallet,
  ArrowRight, Loader2, BarChart3
} from"lucide-react"
import Link from"next/link"

export default function AdminCanteenPage() {
  const { data: session } = useSession()
  const tenant = session?.user?.tenants?.[0]
  const [merchants, setMerchants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenant) return
    fetch(`/api/canteen/merchants?tenantId=${tenant.id}`)
      .then(r => r.json())
      .then(d => setMerchants(d.merchants || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [tenant])

  const totalBalance = merchants.reduce((a, m) => a + (m.balance || 0), 0)
  const activeMerchants = merchants.filter(m => m.isActive).length

  const navCards = [
    {
      label:"Daftar Merchant",
      href:"/admin/canteen/merchants",
      icon: Store,
      desc: `${activeMerchants} merchant aktif`,
      color:"from-orange-500 to-amber-500",
    },
    {
      label:"Penarikan Dana",
      href:"/admin/canteen/withdrawals",
      icon: Wallet,
      desc:"Proses pengajuan penarikan",
      color:"from-indigo-500 to-violet-500",
    },
    {
      label:"Riwayat Transaksi",
      href:"/admin/canteen/transactions",
      icon: ShoppingCart,
      desc:"Semua transaksi kantin",
      color:"from-emerald-500 to-teal-500",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">E-Kantin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Kelola sistem kantin cashless berbasis wallet.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:"Total Merchant", value: merchants.length, icon: Store, color:"text-amber-600 bg-amber-500/10" },
          { label:"Merchant Aktif", value: activeMerchants, icon: TrendingUp, color:"text-emerald-600 bg-emerald-500/10" },
          { label:"Saldo Total", value: `Rp ${totalBalance.toLocaleString("id-ID")}`, icon: Wallet, color:"text-indigo-600 bg-indigo-500/10" },
          { label:"Transaksi Hari Ini", value:"—", icon: ShoppingCart, color:"text-primary bg-primary/10" },
        ].map((s, i) => (
          <Card key={i} className="glass border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="font-black text-lg">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Nav Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {navCards.map((c, i) => (
          <Link key={i} href={c.href}>
            <Card className="glass border-0 hover:shadow-lg transition-all cursor-pointer group overflow-hidden">
              <CardContent className="p-0">
                <div className={`bg-gradient-to-br ${c.color} p-6 text-white`}>
                  <c.icon className="h-8 w-8 mb-3" />
                  <p className="font-bold text-lg">{c.label}</p>
                  <p className="text-white/80 text-sm mt-1">{c.desc}</p>
                </div>
                <div className="p-4 flex items-center text-sm text-muted-foreground group-hover:text-primary transition-colors">
                  Buka <ArrowRight className="ml-auto h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Merchant List */}
      <Card className="glass border-0">
        <CardHeader className="flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Daftar Merchant</CardTitle>
          <Link href="/admin/canteen/merchants">
            <Button size="sm" variant="ghost" className="rounded-xl text-xs">Lihat Semua →</Button>
          </Link>
        </CardHeader>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : merchants.length === 0 ? (
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            <Store className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>Belum ada merchant terdaftar.</p>
            <Link href="/admin/canteen/merchants">
              <Button size="sm" className="mt-3 rounded-xl">Tambah Merchant</Button>
            </Link>
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  {["Nama Merchant","Pemilik","Saldo","Status"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {merchants.slice(0, 5).map((m: any) => (
                  <tr key={m.id} className="hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-semibold">{m.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.user?.name ||"—"}</td>
                    <td className="px-4 py-3 font-bold text-emerald-600">Rp {(m.balance || 0).toLocaleString("id-ID")}</td>
                    <td className="px-4 py-3">
                      <Badge className={m.isActive ?"bg-emerald-500/10 text-emerald-600 border-emerald-200 border text-[10px]" :"bg-slate-500/10 text-slate-500 border text-[10px]"}>
                        {m.isActive ?"Aktif" :"Nonaktif"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
