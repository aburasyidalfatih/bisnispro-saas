import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Target, MapPin, GraduationCap, Receipt, Heart, Timer, BookOpen } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts"
import { cn } from "@/lib/utils"
import { AnalyticsData, COLORS } from "./types"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"

export function GrowthTab() {
  const [data, setData] = useState<Partial<AnalyticsData> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/super-admin/analytics?tab=growth")
      .then(res => res.json())
      .then(d => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!data || !data.conversionFunnel) return <div>Gagal memuat data growth.</div>
  return (
    <div className="space-y-8 mt-6">
      {/* SECTION 9: CONVERSION FUNNEL */}
      <div>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Target className="h-5 w-5 text-blue-500" /> Corong Konversi</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="glass border-0">
            <CardHeader><CardTitle className="text-base">Alur Pengajuan &rarr; Upgrade</CardTitle><CardDescription>Dari pendaftaran hingga menjadi tenant berbayar.</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'Pengajuan Masuk', value: data.conversionFunnel.totalApplications, color: 'bg-blue-500', pct: 100 },
                { label: 'Disetujui', value: data.conversionFunnel.approvedApplications, color: 'bg-emerald-500', pct: data.conversionFunnel.totalApplications > 0 ? (data.conversionFunnel.approvedApplications / data.conversionFunnel.totalApplications * 100) : 0 },
                { label: 'Paket Free', value: data.conversionFunnel.freeTenants, color: 'bg-slate-400', pct: data.conversionFunnel.totalApplications > 0 ? (data.conversionFunnel.freeTenants / data.conversionFunnel.totalApplications * 100) : 0 },
                { label: 'Upgrade Lite', value: data.conversionFunnel.liteTenants, color: 'bg-blue-600', pct: data.conversionFunnel.totalApplications > 0 ? Math.max(8, data.conversionFunnel.liteTenants / data.conversionFunnel.totalApplications * 100) : 0 },
                { label: 'Upgrade Pro', value: data.conversionFunnel.proTenants, color: 'bg-violet-500', pct: data.conversionFunnel.totalApplications > 0 ? Math.max(6, data.conversionFunnel.proTenants / data.conversionFunnel.totalApplications * 100) : 0 },
              ].map((step) => (
                <div key={step.label}>
                  <div className="flex items-center justify-between mb-1"><span className="text-xs font-medium">{step.label}</span><span className="text-xs font-bold">{step.value}</span></div>
                  <div className="h-7 rounded-lg bg-muted overflow-hidden" style={{ width: `${step.pct}%` }}>
                    <div className={cn('h-full rounded-lg flex items-center px-2', step.color)}>
                      <span className="text-[10px] text-white font-bold">{data.conversionFunnel.totalApplications > 0 ? `${(step.value / data.conversionFunnel.totalApplications * 100).toFixed(1)}%` : '0%'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="glass border-0">
            <CardHeader><CardTitle className="text-base">Metrik Konversi</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-4 rounded-xl border bg-card"><p className="text-3xl font-bold text-emerald-600">{data.conversionFunnel.approvalRate.toFixed(1)}%</p><p className="text-[10px] text-muted-foreground mt-1">Approval Rate</p></div>
                <div className="text-center p-4 rounded-xl border bg-card"><p className="text-3xl font-bold text-violet-600">{data.conversionFunnel.upgradeRate}%</p><p className="text-[10px] text-muted-foreground mt-1">Upgrade Rate</p></div>
              </div>
              <div className="space-y-2 pt-3 border-t">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Pending Review</span><Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">{data.conversionFunnel.pendingApplications}</Badge></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Ditolak</span><Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-200">{data.conversionFunnel.rejectedApplications}</Badge></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tenant FREE</span><span className="font-bold">{data.conversionFunnel.freeTenants}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tenant LITE</span><span className="font-bold text-blue-600">{data.conversionFunnel.liteTenants}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tenant PRO</span><span className="font-bold text-violet-600">{data.conversionFunnel.proTenants}</span></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SECTION 13: GEOGRAPHIC DISTRIBUTION */}
      <div>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><MapPin className="h-5 w-5 text-rose-500" /> Sebaran Geografis ({data.geoStats.totalProvinces} Provinsi)</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="glass border-0">
            <CardHeader><CardTitle className="text-base">Top Provinsi</CardTitle><CardDescription>Provinsi dengan jumlah sekolah terbanyak.</CardDescription></CardHeader>
            <CardContent>{data.geoStats.provinces.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-8 text-center">Belum ada data.</p>
            ) : (
              <div className="h-[360px] w-full"><ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.geoStats.provinces.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} stroke="#e5e7eb" />
                  <XAxis type="number" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" stroke="#6b7280" fontSize={9} tickLine={false} axisLine={false} width={130} />
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="value" name="Sekolah" radius={[0, 6, 6, 0]} barSize={18}>
                    {data.geoStats.provinces.slice(0, 10).map((_, index) => (<Cell key={index} fill={COLORS[index % COLORS.length]} />))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer></div>
            )}</CardContent>
          </Card>
          <Card className="glass border-0">
            <CardHeader><CardTitle className="text-base">Top Kota/Kabupaten</CardTitle><CardDescription>10 kota/kabupaten dengan sekolah terbanyak.</CardDescription></CardHeader>
            <CardContent>{data.geoStats.topRegencies.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-8 text-center">Belum ada data.</p>
            ) : (
              <div className="space-y-2">{data.geoStats.topRegencies.map((r, i) => {
                const maxVal = data.geoStats.topRegencies[0]?.value || 1
                return (
                  <div key={r.name} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-5 text-right">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1"><span className="text-xs font-medium truncate">{r.name}</span><span className="text-xs font-bold text-primary">{r.value}</span></div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-rose-500 transition-all" style={{ width: `${(r.value / maxVal) * 100}%` }} /></div>
                    </div>
                  </div>
                )
              })}</div>
            )}</CardContent>
          </Card>
        </div>
      </div>

      {/* SECTION 5 & 6: PPDB + FINANCE INSIGHTS */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* PPDB */}
        <Card className="glass border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <GraduationCap className="h-5 w-5 text-blue-500" /> Insight PPDB
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Pendaftar</span>
              <span className="text-lg font-bold">{data.ppdbStats.totalPendaftar.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Periode PPDB Aktif</span>
              <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">{data.ppdbStats.activePeriods} periode</Badge>
            </div>
            <div className="space-y-2 pt-2 border-t">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Breakdown Status</p>
              {data.ppdbStats.statusBreakdown.map(s => (
                <div key={s.name} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{s.name}</span>
                  <span className="font-bold">{s.value}</span>
                </div>
              ))}
              {data.ppdbStats.statusBreakdown.length === 0 && (
                <p className="text-xs text-muted-foreground italic">Belum ada data PPDB.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Finance */}
        <Card className="glass border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Receipt className="h-5 w-5 text-amber-500" /> Insight Keuangan Tenant
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Donasi Terkumpul</span>
              <span className="text-lg font-bold text-emerald-600">Rp {data.financeStats.totalDonations.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Kampanye Donasi Aktif</span>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">
                <Heart className="h-3 w-3 mr-1" /> {data.financeStats.activeCampaigns}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Invoice SPP Belum Lunas</span>
              <Badge variant="outline" className={cn(
                data.financeStats.unpaidInvoices > 0 
                  ? "bg-amber-50 text-amber-600 border-amber-200" 
                  : "bg-muted text-muted-foreground"
              )}>
                <Timer className="h-3 w-3 mr-1" /> {data.financeStats.unpaidInvoices}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Content Trend 30 days */}
        <Card className="glass border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-5 w-5 text-violet-500" /> Tren Konten Baru
            </CardTitle>
            <CardDescription>Post baru per minggu (4 minggu terakhir).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.contentTrend30Days}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="week" stroke="#6b7280" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="count" name="Post Baru" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
