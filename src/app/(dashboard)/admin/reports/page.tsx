"use client"

import { useEffect, useState } from"react"
import { useSession } from"next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from"@/components/ui/select"
import { Download, Loader2, TrendingUp, TrendingDown, Users, GraduationCap, Receipt, AlertCircle } from"lucide-react"
import { toast } from"@/hooks/use-toast"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from"recharts"

export default function ReportsPage() {
  const { data: session } = useSession()
  const [exporting, setExporting] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [financeSummary, setFinanceSummary] = useState<any>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = session?.user?.tenants?.[0]?.id
    if (!id) return
    setTenantId(id)
    setLoading(true)
    Promise.all([
      fetch(`/api/tenant/stats?tenantId=${id}`).then(r => r.json()),
      fetch(`/api/finance/summary?tenantId=${id}`).then(r => r.json()),
    ]).then(([statsData, summaryData]) => {
      setStats(statsData)
      setFinanceSummary(summaryData)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [session])

  const chartData = stats?.chartData || []

  const pieData = [
    { name:"Lunas", value: financeSummary?.paidCount || 0, color:"#10b981" },
    { name:"Belum Bayar", value: financeSummary?.unpaidCount || 0, color:"#f59e0b" },
    { name:"Jatuh Tempo", value: financeSummary?.overdueCount || 0, color:"#ef4444" },
  ].filter(d => d.value > 0)

  const handleExport = async () => {
    if (!tenantId) return
    setExporting(true)
    try {
      const res = await fetch("/api/export", {
        method:"POST",
        headers: {"Content-Type":"application/json" },
        body: JSON.stringify({
          filename: `laporan-${new Date().toISOString().slice(0, 10)}`,
          columns: [
            { header:"Metrik", key:"metric" },
            { header:"Nilai", key:"value" },
          ],
          data: [
            { metric:"Total Siswa Aktif", value: stats?.studentCount ?? 0 },
            { metric:"Total Pengguna", value: stats?.userCount ?? 0 },
            { metric:"Total Pendapatan (Rp)", value: financeSummary?.totalRevenue ?? 0 },
            { metric:"Total Tunggakan (Rp)", value: financeSummary?.totalDue ?? 0 },
            { metric:"Tagihan Lunas", value: financeSummary?.paidCount ?? 0 },
            { metric:"Tagihan Belum Bayar", value: financeSummary?.unpaidCount ?? 0 },
            { metric:"Tagihan Jatuh Tempo", value: financeSummary?.overdueCount ?? 0 },
            { metric:"Notifikasi Belum Dibaca", value: stats?.notifCount ?? 0 },
            { metric:"Total Aktivitas", value: stats?.auditCount ?? 0 },
          ],
        }),
      })
      if (!res.ok) throw new Error("Export gagal")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `laporan-${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
      toast({ title:"Export berhasil", description:"File Excel berhasil diunduh." })
    } catch {
      toast({ title:"Gagal export", description:"Terjadi kesalahan saat mengekspor data.", variant:"destructive" })
    }
    setExporting(false)
  }

  const formatCurrency = (value: number) => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}jt`
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}rb`
    return `${value}`
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Laporan & Analitik</h1>
          <p className="text-muted-foreground">Ringkasan data keuangan dan operasional lembaga Anda.</p>
        </div>
        <Button variant="outline" className="gap-2 rounded-xl" onClick={handleExport} disabled={exporting}>
          {exporting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" /> : <Download className="h-4 w-4" />}
          {exporting ?"Mengekspor..." :"Export Excel"}
        </Button>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Total Pendapatan", value: `Rp ${(financeSummary?.totalRevenue ?? 0).toLocaleString("id-ID")}`, icon: TrendingUp, color:"text-emerald-600 bg-emerald-500/10" },
          { label:"Total Tunggakan", value: `Rp ${(financeSummary?.totalDue ?? 0).toLocaleString("id-ID")}`, icon: AlertCircle, color:"text-red-600 bg-red-500/10" },
          { label:"Total Siswa", value: stats?.studentCount ??"—", icon: GraduationCap, color:"text-blue-600 bg-blue-500/10" },
          { label:"Total Pengguna", value: stats?.userCount ??"—", icon: Users, color:"text-violet-600 bg-violet-500/10" },
        ].map((s) => (
          <Card key={s.label} className="glass border-0">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Tren Pendapatan</CardTitle>
              <span className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-2 py-1">6 bulan terakhir</span>
            </div>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" vertical={false} />
                  <XAxis dataKey="bulan" className="text-xs" axisLine={false} tickLine={false} />
                  <YAxis className="text-xs" axisLine={false} tickLine={false} tickFormatter={formatCurrency} />
                  <Tooltip
                    contentStyle={{ borderRadius:"12px", border:"none", boxShadow:"0 8px 32px rgba(0,0,0,0.1)" }}
                    formatter={(value: number) => [`Rp ${value.toLocaleString("id-ID")}`,"Pendapatan"]}
                  />
                  <Bar dataKey="pendapatan" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                Belum ada data pembayaran
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass border-0">
          <CardHeader><CardTitle className="text-lg">Status Tagihan</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius:"12px", border:"none" }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                Belum ada data tagihan
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

