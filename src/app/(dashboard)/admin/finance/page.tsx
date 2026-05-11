"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  TrendingUp, TrendingDown, Wallet, Receipt, AlertCircle,
  ArrowRight, Loader2, BadgeDollarSign, PieChart
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

export default function FinanceDashboardPage() {
  const { data: session } = useSession()
  const tenant = session?.user?.tenants?.[0]
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [financeSummary, setFinanceSummary] = useState<any>(null)

  useEffect(() => {
    if (!tenant) return
    Promise.all([
      fetch(`/api/finance/invoices?tenantId=${tenant.id}&take=5`).then(r => r.json()),
      fetch(`/api/finance/billing-types?tenantId=${tenant.id}`).then(r => r.json()),
      fetch(`/api/finance/summary?tenantId=${tenant.id}`).then(r => r.json()),
    ]).then(([invoicesData, typesData, summaryData]) => {
      setData({ invoices: invoicesData, billingTypes: typesData })
      setFinanceSummary(summaryData)
    }).catch(console.error).finally(() => setLoading(false))
  }, [tenant])

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>

  const invoices = data?.invoices?.data || []
  const totalDue = financeSummary?.totalDue || 0
  const totalCollected = financeSummary?.totalRevenue || 0

  const quickLinks = [
    { label: "Tagihan Siswa", href: "/admin/finance/invoice", icon: Receipt, color: "text-primary bg-primary/10", desc: "Kelola semua tagihan" },
    { label: "Jenis Tagihan", href: "/admin/finance/billing-types", icon: BadgeDollarSign, color: "text-indigo-600 bg-indigo-500/10", desc: `${data?.billingTypes?.length || 0} template aktif` },
    { label: "Buat Tagihan", href: "/admin/finance/invoice/create", icon: Receipt, color: "text-emerald-600 bg-emerald-500/10", desc: "Buat tagihan baru" },
    { label: "Cashflow", href: "/admin/finance/cashflow", icon: PieChart, color: "text-amber-600 bg-amber-500/10", desc: "Laporan arus kas" },
  ]

  const statusCfg: Record<string, { label: string; color: string }> = {
    UNPAID: { label: "Belum Bayar", color: "bg-red-500/10 text-red-600 border-red-200" },
    PARTIAL: { label: "Sebagian", color: "bg-amber-500/10 text-amber-600 border-amber-200" },
    PAID: { label: "Lunas", color: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
    OVERDUE: { label: "Jatuh Tempo", color: "bg-red-600/20 text-red-700 border-red-300" },
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Keuangan Sekolah</h1>
        <p className="text-sm text-muted-foreground">Pantau arus kas, tagihan, dan kesehatan keuangan.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Tagihan", value: financeSummary?.totalInvoices ?? 0, icon: Receipt, color: "text-primary bg-primary/10", trend: null },
          { label: "Menunggak", value: `Rp ${totalDue.toLocaleString("id-ID")}`, icon: AlertCircle, color: "text-red-600 bg-red-500/10", trend: "down" },
          { label: "Terkumpul", value: `Rp ${totalCollected.toLocaleString("id-ID")}`, icon: TrendingUp, color: "text-emerald-600 bg-emerald-500/10", trend: "up" },
          { label: "Jenis Tagihan", value: data?.billingTypes?.length || 0, icon: BadgeDollarSign, color: "text-indigo-600 bg-indigo-500/10", trend: null },
        ].map((s, i) => (
          <Card key={i} className="glass border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                {s.trend === "up" && <TrendingUp className="h-4 w-4 text-emerald-500" />}
                {s.trend === "down" && <TrendingDown className="h-4 w-4 text-red-500" />}
              </div>
              <p className="text-xs text-muted-foreground font-medium mb-1">{s.label}</p>
              <p className="font-black text-lg leading-tight">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alert menunggak */}
      {(financeSummary?.unpaidCount > 0 || financeSummary?.overdueCount > 0) && (
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-red-500/10 border border-red-200">
          <AlertCircle className="h-8 w-8 text-red-500 shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-red-700">{(financeSummary?.unpaidCount || 0) + (financeSummary?.overdueCount || 0)} tagihan menunggak</p>
            <p className="text-sm text-red-600">Total Rp {totalDue.toLocaleString("id-ID")} belum dilunasi.</p>
          </div>
          <Link href="/admin/finance/invoice?status=UNPAID">
            <Button size="sm" className="rounded-xl bg-red-500 hover:bg-red-600 shrink-0">Tinjau</Button>
          </Link>
        </div>
      )}

      {/* Quick Navigation */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickLinks.map((link, i) => (
          <Link key={i} href={link.href}>
            <Card className="glass border-0 hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group h-full">
              <CardContent className="p-4 h-full flex flex-col">
                <div className={`h-11 w-11 rounded-2xl flex items-center justify-center ${link.color} mb-3 group-hover:scale-110 transition-transform`}>
                  <link.icon className="h-6 w-6" />
                </div>
                <p className="font-bold text-sm">{link.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 flex-1">{link.desc}</p>
                <div className="flex items-center text-xs text-primary mt-3 font-semibold">
                  Buka <ArrowRight className="ml-1 h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Tagihan Terbaru */}
      <Card className="glass border-0">
        <CardHeader className="flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Tagihan Terbaru</CardTitle>
          <Link href="/admin/finance/invoice" className="text-xs text-primary hover:underline">Lihat Semua →</Link>
        </CardHeader>
        <div className="overflow-x-auto">
          {invoices.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">Belum ada tagihan.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  {["Siswa", "Tagihan", "Nominal", "Status"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {invoices.slice(0, 5).map((inv: any) => {
                  const cfg = statusCfg[inv.status] || statusCfg.UNPAID
                  return (
                    <tr key={inv.id} className="hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-semibold text-sm">{inv.student?.name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{inv.title}</td>
                      <td className="px-4 py-3 font-bold">Rp {inv.amount.toLocaleString("id-ID")}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] px-2 py-1 rounded-full border ${cfg.color}`}>{cfg.label}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  )
}
