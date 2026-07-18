import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DollarSign, TrendingUp, Users, Target, ArrowUpRight, ArrowDownRight, UserPlus, Eye } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { cn } from "@/lib/utils"
import { AnalyticsData, COLORS, PLAN_COLORS } from "./types"
import { SummaryCard } from "./shared-components"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"

export function FinanceTab() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/super-admin/analytics?tab=finance")
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

  if (!data || !data.revenueStats) return <div>Gagal memuat data finance.</div>
  return (
    <div className="space-y-8 mt-6">
      {/* SECTION 8: REVENUE & PENDAPATAN */}
      <div>
        <h2 className="text-base sm:text-lg font-bold mb-3 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-emerald-500" /> Revenue &amp; Pendapatan
        </h2>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card className="glass border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600"><DollarSign className="h-5 w-5" /></div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium">Total Revenue</p>
                  <h3 className="text-lg font-bold">Rp {(data.revenueStats.totalRevenue / 1000).toFixed(0)}K</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600"><TrendingUp className="h-5 w-5" /></div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium">Bulan Ini</p>
                  <div className="flex items-baseline gap-1.5">
                    <h3 className="text-lg font-bold">Rp {(data.revenueStats.thisMonthRevenue / 1000).toFixed(0)}K</h3>
                    {data.revenueStats.revenueGrowth !== 0 && (
                      <span className={cn("text-[10px] font-bold flex items-center", data.revenueStats.revenueGrowth > 0 ? "text-emerald-600" : "text-rose-600")}>
                        {data.revenueStats.revenueGrowth > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {Math.abs(data.revenueStats.revenueGrowth).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600"><Users className="h-5 w-5" /></div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium">ARPU</p>
                  <h3 className="text-lg font-bold">Rp {data.revenueStats.arpu.toLocaleString('id-ID')}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600"><Target className="h-5 w-5" /></div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium">Lembaga Bayar</p>
                  <h3 className="text-lg font-bold">{data.revenueStats.payingTenantCount}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="glass border-0">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-5 w-5 text-emerald-500" /> Tren Pendapatan (6 Bulan)</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[220px] sm:h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.revenueStats.revenueTrend}>
                    <defs><linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
                    <RechartsTooltip formatter={(v: any) => `Rp ${Number(v).toLocaleString('id-ID')}`} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Area type="monotone" dataKey="amount" name="Pendapatan" stroke="#10b981" strokeWidth={2.5} fill="url(#revenueGrad)" dot={{ r: 4, fill: '#10b981' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-0">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Layers className="h-5 w-5 text-violet-500" /> Revenue per Paket</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[220px] sm:h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.revenueStats.revenuePerPlan} cx="50%" cy="45%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="amount"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={false}>
                      {data.revenueStats.revenuePerPlan.map((_, i) => (
                        <Cell key={i} fill={[PLAN_COLORS.LITE || '#3b82f6', PLAN_COLORS.PRO || '#8b5cf6', '#f59e0b'][i] || COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(v: any) => `Rp ${Number(v).toLocaleString('id-ID')}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SECTION 11: AFFILIATE PERFORMANCE */}
      <div>
        <h2 className="text-base sm:text-lg font-bold mb-3 flex items-center gap-2"><UserPlus className="h-5 w-5 text-indigo-500" /> Performa Afiliasi</h2>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-4 sm:mb-6">
          <SummaryCard icon={Users} label="Total Afiliasi" value={data.affiliateStats.totalAffiliates} color="blue" subtitle={`${data.affiliateStats.activeAffiliates} aktif`} />
          <SummaryCard icon={Eye} label="Total Klik" value={data.affiliateStats.totalClicks} color="violet" />
          <SummaryCard icon={Target} label="Konversi" value={data.affiliateStats.affiliateApplications} color="emerald" subtitle={`${data.affiliateStats.conversionRate}% rate`} />
          <SummaryCard icon={DollarSign} label="Komisi Dibayar" value={data.affiliateStats.totalCommissionsPaid} color="amber" />
        </div>
        {data.affiliateStats.topAffiliates.length > 0 && (
          <Card className="glass border-0">
            <CardHeader><CardTitle className="text-base">Top 5 Afiliasi</CardTitle><CardDescription>Berdasarkan total pendapatan.</CardDescription></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b bg-muted/30">
                      <TableHead className="px-3 py-2 text-left text-xs font-bold text-muted-foreground uppercase">#</TableHead>
                      <TableHead className="px-3 py-2 text-left text-xs font-bold text-muted-foreground uppercase">Nama</TableHead>
                      <TableHead className="px-3 py-2 text-center text-xs font-bold text-muted-foreground uppercase">Kode</TableHead>
                      <TableHead className="px-3 py-2 text-center text-xs font-bold text-muted-foreground uppercase">Klik</TableHead>
                      <TableHead className="px-3 py-2 text-center text-xs font-bold text-muted-foreground uppercase">Referral</TableHead>
                      <TableHead className="px-3 py-2 text-right text-xs font-bold text-muted-foreground uppercase">Pendapatan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.affiliateStats.topAffiliates.map((a, i) => (
                      <TableRow key={a.code} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <TableCell className="px-3 py-2.5 font-bold text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="px-3 py-2.5 font-medium">{a.name}</TableCell>
                        <TableCell className="px-3 py-2.5 text-center"><code className="text-xs bg-muted px-2 py-0.5 rounded">{a.code}</code></TableCell>
                        <TableCell className="px-3 py-2.5 text-center">{a.clicks}</TableCell>
                        <TableCell className="px-3 py-2.5 text-center">{a.referrals}</TableCell>
                        <TableCell className="px-3 py-2.5 text-right font-bold text-emerald-600">Rp {a.earnings.toLocaleString('id-ID')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function Layers(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 12 12 17 22 12"/><polyline points="2 17 12 22 22 17"/></svg>
}
