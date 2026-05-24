"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  Target, DollarSign, TrendingUp, Users, Loader2,
  Megaphone, ArrowUpRight, ArrowDownRight, Eye,
  UserPlus, UserCheck, Wallet, BarChart3, Calendar,
  Save, ExternalLink, Zap, Filter,
} from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from "recharts"
import { toast } from "@/hooks/use-toast"

interface AdsData {
  summary: {
    totalApplications: number
    adsLeads: number
    organicLeads: number
    affiliateLeads: number
    adsApproved: number
    totalTenants: number
    paidTenants: number
    totalRevenue: number
  }
  funnel: {
    metaLeads: number
    metaApproved: number
    metaUpgraded: number
  }
  bySource: { source: string; total: number; approved: number; rejected: number; pending: number }[]
  byCampaign: { campaign: string; total: number; approved: number; conversionRate: number }[]
  byMedium: { medium: string; count: number }[]
  monthlyTrend: { month: string; ads: number; organic: number; affiliate: number }[]
  roi: {
    currentMonthBudget: number
    totalAdSpend: number
    thisMonthAdsLeads: number
    thisMonthAdsApproved: number
    costPerLead: number
    costPerAcquisition: number
    thisMonthRevenue: number
    roas: number
  }
  adBudgets: { id: string; month: string; year: number; platform: string; budget: number; notes: string | null }[]
  recentAdsLeads: { schoolName: string; status: string; source: string; medium: string; campaign: string; content: string; date: string }[]
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4']
const SOURCE_COLORS: Record<string, string> = {
  facebook: '#1877F2', meta: '#1877F2', fb: '#1877F2',
  instagram: '#E4405F', google: '#4285F4',
  tiktok: '#000000', Afiliasi: '#8b5cf6', Organik: '#94a3b8',
}

export default function AdsAnalyticsPage() {
  const [data, setData] = useState<AdsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const now = new Date()
  const [budgetForm, setBudgetForm] = useState({
    month: (now.getMonth() + 1).toString().padStart(2, '0'),
    year: now.getFullYear().toString(),
    budget: '',
    notes: '',
  })

  useEffect(() => {
    fetch("/api/super-admin/ads-analytics")
      .then(res => {
        if (!res.ok) throw new Error("API error")
        return res.json()
      })
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSaveBudget = async () => {
    if (!budgetForm.budget) {
      toast({ title: "Error", description: "Budget wajib diisi", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/super-admin/ads-analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(budgetForm),
      })
      if (!res.ok) throw new Error("Gagal menyimpan")
      toast({ title: "Berhasil", description: "Budget iklan berhasil disimpan" })
      // Reload data
      const newData = await fetch("/api/super-admin/ads-analytics").then(r => r.json())
      setData(newData)
      setBudgetForm(prev => ({ ...prev, budget: '', notes: '' }))
    } catch {
      toast({ title: "Error", description: "Gagal menyimpan budget", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Memuat data iklan...</p>
        </div>
      </div>
    )
  }

  if (!data) return <p className="text-center py-12 text-muted-foreground">Gagal memuat data.</p>

  const fmtRp = (v: number) => `Rp ${v.toLocaleString('id-ID')}`

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-blue-500" /> Analisa Efektivitas Iklan
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Pantau ROI iklan, conversion funnel, dan atribusi sumber pendaftaran.
        </p>
      </div>

      {/* ============================================ */}
      {/* SECTION 1: ROI OVERVIEW                      */}
      {/* ============================================ */}
      <div>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-emerald-500" /> ROI Bulan Ini
        </h2>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <RoiCard
            label="Budget Iklan"
            value={fmtRp(data.roi.currentMonthBudget)}
            subtitle="Bulan ini"
            icon={Wallet}
            color="blue"
          />
          <RoiCard
            label="Cost per Lead"
            value={data.roi.costPerLead > 0 ? fmtRp(data.roi.costPerLead) : '-'}
            subtitle={`${data.roi.thisMonthAdsLeads} leads dari iklan`}
            icon={UserPlus}
            color="violet"
          />
          <RoiCard
            label="Cost per Acquisition"
            value={data.roi.costPerAcquisition > 0 ? fmtRp(data.roi.costPerAcquisition) : '-'}
            subtitle={`${data.roi.thisMonthAdsApproved} disetujui`}
            icon={UserCheck}
            color="amber"
          />
          <RoiCard
            label="ROAS"
            value={data.roi.roas > 0 ? `${data.roi.roas}x` : '-'}
            subtitle={`Revenue: ${fmtRp(data.roi.thisMonthRevenue)}`}
            icon={TrendingUp}
            color={data.roi.roas >= 1 ? "emerald" : "rose"}
            highlight={data.roi.roas >= 1}
          />
        </div>
      </div>

      {/* ============================================ */}
      {/* SECTION 2: CONVERSION FUNNEL                 */}
      {/* ============================================ */}
      <div>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Target className="h-5 w-5 text-violet-500" /> Conversion Funnel (Keseluruhan)
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="glass border-0">
            <CardHeader>
              <CardTitle className="text-base">Alur Konversi Semua Sumber</CardTitle>
              <CardDescription>Dari pendaftaran hingga menjadi pelanggan berbayar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Total Pendaftaran', value: data.summary.totalApplications, color: 'bg-blue-500', pct: 100 },
                { label: 'Dari Iklan (Tracked)', value: data.summary.adsLeads, color: 'bg-violet-500', pct: data.summary.totalApplications > 0 ? (data.summary.adsLeads / data.summary.totalApplications * 100) : 0 },
                { label: 'Disetujui (Iklan)', value: data.summary.adsApproved, color: 'bg-emerald-500', pct: data.summary.totalApplications > 0 ? Math.max(5, data.summary.adsApproved / data.summary.totalApplications * 100) : 0 },
                { label: 'Total Tenant Aktif', value: data.summary.totalTenants, color: 'bg-blue-600', pct: data.summary.totalApplications > 0 ? (data.summary.totalTenants / data.summary.totalApplications * 100) : 0 },
                { label: 'Tenant Berbayar', value: data.summary.paidTenants, color: 'bg-amber-500', pct: data.summary.totalApplications > 0 ? Math.max(3, data.summary.paidTenants / data.summary.totalApplications * 100) : 0 },
              ].map(step => (
                <div key={step.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">{step.label}</span>
                    <span className="text-xs font-bold">{step.value}</span>
                  </div>
                  <div className="h-8 rounded-lg bg-muted overflow-hidden" style={{ width: `${step.pct}%` }}>
                    <div className={cn('h-full rounded-lg flex items-center px-2', step.color)}>
                      <span className="text-[10px] text-white font-bold">
                        {data.summary.totalApplications > 0 ? `${(step.value / data.summary.totalApplications * 100).toFixed(1)}%` : '0%'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="glass border-0">
            <CardHeader>
              <CardTitle className="text-base">Meta Ads Funnel</CardTitle>
              <CardDescription>Khusus leads dari Facebook/Instagram Ads.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-4 rounded-xl border bg-card">
                  <p className="text-3xl font-bold text-blue-600">{data.funnel.metaLeads}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Leads</p>
                </div>
                <div className="text-center p-4 rounded-xl border bg-card">
                  <p className="text-3xl font-bold text-emerald-600">{data.funnel.metaApproved}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Disetujui</p>
                </div>
                <div className="text-center p-4 rounded-xl border bg-card">
                  <p className="text-3xl font-bold text-violet-600">{data.funnel.metaUpgraded}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Upgrade</p>
                </div>
              </div>
              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Lead → Approve Rate</span>
                  <span className="font-bold">
                    {data.funnel.metaLeads > 0 ? `${(data.funnel.metaApproved / data.funnel.metaLeads * 100).toFixed(1)}%` : '-'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Approve → Upgrade Rate</span>
                  <span className="font-bold text-violet-600">
                    {data.funnel.metaApproved > 0 ? `${(data.funnel.metaUpgraded / data.funnel.metaApproved * 100).toFixed(1)}%` : '-'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Overall Conversion</span>
                  <span className="font-bold text-emerald-600">
                    {data.funnel.metaLeads > 0 ? `${(data.funnel.metaUpgraded / data.funnel.metaLeads * 100).toFixed(1)}%` : '-'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ============================================ */}
      {/* SECTION 3: SOURCE ATTRIBUTION                */}
      {/* ============================================ */}
      <div>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Filter className="h-5 w-5 text-blue-500" /> Atribusi Sumber Pendaftaran
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="glass border-0">
            <CardHeader>
              <CardTitle className="text-base">Leads per Sumber</CardTitle>
              <CardDescription>Dari mana calon tenant datang.</CardDescription>
            </CardHeader>
            <CardContent>
              {data.bySource.length === 0 ? (
                <p className="text-sm text-muted-foreground italic text-center py-8">Belum ada data UTM.</p>
              ) : (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.bySource.map(s => ({ name: s.source, value: s.total }))}
                        cx="50%" cy="45%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={false}>
                        {data.bySource.map((s, i) => (
                          <Cell key={i} fill={SOURCE_COLORS[s.source.toLowerCase()] || COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass border-0">
            <CardHeader>
              <CardTitle className="text-base">Detail per Sumber</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.bySource.map(s => (
                  <div key={s.source} className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:shadow-md transition-shadow">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${SOURCE_COLORS[s.source.toLowerCase()] || '#64748b'}20`, color: SOURCE_COLORS[s.source.toLowerCase()] || '#64748b' }}>
                      <Megaphone className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold capitalize">{s.source}</span>
                        <span className="text-sm font-bold">{s.total}</span>
                      </div>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-600 border-emerald-200">{s.approved} approved</Badge>
                        <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-600 border-amber-200">{s.pending} pending</Badge>
                        {s.rejected > 0 && <Badge variant="outline" className="text-[9px] bg-rose-50 text-rose-600 border-rose-200">{s.rejected} rejected</Badge>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ============================================ */}
      {/* SECTION 4: CAMPAIGN PERFORMANCE              */}
      {/* ============================================ */}
      {data.byCampaign.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-amber-500" /> Performa Kampanye
          </h2>
          <Card className="glass border-0">
            <CardHeader>
              <CardTitle className="text-base">Leads & Konversi per Kampanye Iklan</CardTitle>
              <CardDescription>Data berdasarkan utm_campaign dari URL iklan.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="px-3 py-2 text-left text-xs font-bold text-muted-foreground uppercase">Kampanye</th>
                      <th className="px-3 py-2 text-center text-xs font-bold text-muted-foreground uppercase">Leads</th>
                      <th className="px-3 py-2 text-center text-xs font-bold text-muted-foreground uppercase">Approved</th>
                      <th className="px-3 py-2 text-center text-xs font-bold text-muted-foreground uppercase">Conv. Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byCampaign.map(c => (
                      <tr key={c.campaign} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-3 py-2.5 font-medium">{c.campaign}</td>
                        <td className="px-3 py-2.5 text-center font-bold">{c.total}</td>
                        <td className="px-3 py-2.5 text-center">
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">{c.approved}</Badge>
                        </td>
                        <td className="px-3 py-2.5 text-center font-bold text-violet-600">{c.conversionRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ============================================ */}
      {/* SECTION 5: MONTHLY TREND                     */}
      {/* ============================================ */}
      <div>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-emerald-500" /> Tren Pendaftaran (6 Bulan)
        </h2>
        <Card className="glass border-0">
          <CardHeader>
            <CardTitle className="text-base">Leads: Iklan vs Organik vs Afiliasi</CardTitle>
            <CardDescription>Perbandingan sumber leads per bulan.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthlyTrend} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="ads" name="Iklan" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="organic" name="Organik" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="affiliate" name="Afiliasi" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================================ */}
      {/* SECTION 6: BUDGET INPUT                      */}
      {/* ============================================ */}
      <div>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Wallet className="h-5 w-5 text-blue-500" /> Input Budget Iklan
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="glass border-0">
            <CardHeader>
              <CardTitle className="text-base">Catat Budget Bulanan</CardTitle>
              <CardDescription>Masukkan biaya iklan untuk menghitung ROI secara otomatis.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Bulan</Label>
                  <select
                    value={budgetForm.month}
                    onChange={e => setBudgetForm(prev => ({ ...prev, month: e.target.value }))}
                    className="w-full h-10 rounded-xl border bg-background px-3 text-sm"
                  >
                    {['01','02','03','04','05','06','07','08','09','10','11','12'].map(m => (
                      <option key={m} value={m}>{new Date(2024, parseInt(m) - 1).toLocaleDateString('id-ID', { month: 'long' })}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tahun</Label>
                  <Input value={budgetForm.year} onChange={e => setBudgetForm(prev => ({ ...prev, year: e.target.value }))} className="rounded-xl" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Budget Iklan (Rp)</Label>
                <Input type="number" placeholder="Contoh: 500000" value={budgetForm.budget}
                  onChange={e => setBudgetForm(prev => ({ ...prev, budget: e.target.value }))}
                  className="rounded-xl text-lg font-bold" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Catatan (Opsional)</Label>
                <Input placeholder="Misal: Kampanye promo Ramadhan" value={budgetForm.notes}
                  onChange={e => setBudgetForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="rounded-xl" />
              </div>
              <Button onClick={handleSaveBudget} disabled={saving} className="w-full rounded-xl btn-gradient text-white">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Simpan Budget
              </Button>
            </CardContent>
          </Card>

          <Card className="glass border-0">
            <CardHeader>
              <CardTitle className="text-base">Riwayat Budget</CardTitle>
              <CardDescription>Total spending: {fmtRp(data.roi.totalAdSpend)}</CardDescription>
            </CardHeader>
            <CardContent>
              {data.adBudgets.length === 0 ? (
                <p className="text-sm text-muted-foreground italic text-center py-8">Belum ada data budget.</p>
              ) : (
                <div className="space-y-2">
                  {data.adBudgets.map(b => (
                    <div key={b.id} className="flex items-center justify-between p-3 rounded-xl border bg-card">
                      <div>
                        <p className="text-sm font-bold">
                          {new Date(parseInt(b.year.toString()), parseInt(b.month) - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                        </p>
                        {b.notes && <p className="text-[10px] text-muted-foreground">{b.notes}</p>}
                      </div>
                      <span className="text-sm font-bold text-blue-600">{fmtRp(b.budget)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ============================================ */}
      {/* SECTION 7: RECENT ADS LEADS                  */}
      {/* ============================================ */}
      {data.recentAdsLeads.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Eye className="h-5 w-5 text-cyan-500" /> Lead Terbaru dari Iklan
          </h2>
          <Card className="glass border-0">
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="px-3 py-2 text-left text-xs font-bold text-muted-foreground uppercase">Sekolah</th>
                      <th className="px-3 py-2 text-center text-xs font-bold text-muted-foreground uppercase">Status</th>
                      <th className="px-3 py-2 text-center text-xs font-bold text-muted-foreground uppercase">Sumber</th>
                      <th className="px-3 py-2 text-center text-xs font-bold text-muted-foreground uppercase">Kampanye</th>
                      <th className="px-3 py-2 text-right text-xs font-bold text-muted-foreground uppercase">Tanggal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentAdsLeads.map((l, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-3 py-2.5 font-medium">{l.schoolName}</td>
                        <td className="px-3 py-2.5 text-center">
                          <Badge variant="outline" className={cn(
                            "text-[10px]",
                            l.status === 'APPROVED' && 'bg-emerald-50 text-emerald-600 border-emerald-200',
                            l.status === 'PENDING' && 'bg-amber-50 text-amber-600 border-amber-200',
                            l.status === 'REJECTED' && 'bg-rose-50 text-rose-600 border-rose-200',
                          )}>{l.status}</Badge>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <Badge variant="outline" className="text-[10px] capitalize"
                            style={{ borderColor: SOURCE_COLORS[l.source.toLowerCase()] || '#94a3b8', color: SOURCE_COLORS[l.source.toLowerCase()] || '#64748b' }}>
                            {l.source}/{l.medium}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 text-center text-xs text-muted-foreground">{l.campaign || '-'}</td>
                        <td className="px-3 py-2.5 text-right text-xs text-muted-foreground">
                          {new Date(l.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tips */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <h3 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
            <Zap className="h-4 w-4" /> Tips Penggunaan
          </h3>
          <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
            <li>Pastikan URL iklan menyertakan UTM params: <code className="bg-blue-100 px-1 rounded">?utm_source=facebook&utm_medium=cpc&utm_campaign=nama_kampanye</code></li>
            <li>Data akan muncul setelah ada calon tenant yang mendaftar melalui link iklan Anda.</li>
            <li>Input budget iklan bulanan untuk menghitung Cost per Lead dan ROAS secara otomatis.</li>
            <li>Gunakan Meta Events Manager untuk verifikasi event Lead dan Purchase sudah tertrigger.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================
// Component: ROI Card
// ============================================
function RoiCard({ label, value, subtitle, icon: Icon, color, highlight }: {
  label: string; value: string; subtitle: string; icon: any; color: string; highlight?: boolean
}) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-500/10 text-emerald-600',
    blue: 'bg-blue-500/10 text-blue-600',
    violet: 'bg-violet-500/10 text-violet-600',
    amber: 'bg-amber-500/10 text-amber-600',
    rose: 'bg-rose-500/10 text-rose-600',
  }

  return (
    <Card className={cn("glass border-0", highlight && "ring-2 ring-emerald-500/30")}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", colorMap[color] || colorMap.blue)}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground font-medium">{label}</p>
            <h3 className="text-lg font-bold">{value}</h3>
            <p className="text-[9px] text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
