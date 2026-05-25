"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  DollarSign, TrendingUp, Users, Loader2,
  Megaphone, Eye, UserPlus, BarChart3,
  Zap, Link2, Unlink, MousePointerClick,
  Layers, Activity, RefreshCcw, Pause, Play,
  Lightbulb, Target, AlertTriangle, CheckCircle,
  Info, PencilLine, ChevronDown, ChevronUp,
  BrainCircuit, FileText, Calendar, Sparkles,
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, LineChart, Line,
} from "recharts"
import { toast } from "@/hooks/use-toast"

// ====== Types ======
interface MetaConnection { connected: boolean; accountName: string; accountId: string; hasToken: boolean }
interface MetaCampaign {
  id: string; name: string; status: string; objective: string
  dailyBudget: number; lifetimeBudget: number; spend: number
  impressions: number; clicks: number; cpc: number; ctr: number
  reach: number; frequency: number; leads: number; costPerLead: number
}
interface DailyTrend { date: string; spend: number; impressions: number; clicks: number; reach: number; leads: number }
interface AgeGender { age: string; gender: string; spend: number; impressions: number; clicks: number; reach: number; leads: number }
interface Placement { platform: string; position: string; spend: number; impressions: number; clicks: number; reach: number }
interface Recommendation { type: string; title: string; message: string; campaignName?: string }
interface AiReport { date: string; generatedAt: string; analysis: string; dataSummary: { totalSpend: number; totalClicks: number; weeklyRegistrations: number; weeklyRevenue: number } }
interface MetaData {
  campaigns: MetaCampaign[]
  summary: { totalSpend: number; totalImpressions: number; totalClicks: number; totalReach: number; avgCpc: number; avgCtr: number; totalLeads: number; frequency: number }
  dailyTrend: DailyTrend[]; ageGenderBreakdown: AgeGender[]; placementBreakdown: Placement[]
  recommendations: Recommendation[]; datePreset: string
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#f97316']
const DATE_PRESETS = [
  { value: 'today', label: 'Hari Ini' }, { value: 'yesterday', label: 'Kemarin' },
  { value: 'last_7d', label: '7 Hari' }, { value: 'last_14d', label: '14 Hari' },
  { value: 'this_month', label: 'Bulan Ini' }, { value: 'last_month', label: 'Bulan Lalu' },
  { value: 'last_30d', label: '30 Hari' }, { value: 'this_year', label: 'Tahun Ini' },
]

export default function AdsAnalyticsPage() {
  const [metaConn, setMetaConn] = useState<MetaConnection | null>(null)
  const [metaData, setMetaData] = useState<MetaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [metaLoading, setMetaLoading] = useState(false)
  const [datePreset, setDatePreset] = useState('this_month')
  const [showConnect, setShowConnect] = useState(false)
  const [connectForm, setConnectForm] = useState({ accessToken: '', accountId: '' })
  const [connecting, setConnecting] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [editBudgetId, setEditBudgetId] = useState<string | null>(null)
  const [newBudget, setNewBudget] = useState('')
  const [expandedSection, setExpandedSection] = useState<string | null>('campaigns')
  // AI Analysis
  const [aiReports, setAiReports] = useState<AiReport[]>([])
  const [aiGenerating, setAiGenerating] = useState(false)
  const [showAiReport, setShowAiReport] = useState<string | null>(null)

  // Check connection
  useEffect(() => {
    fetch("/api/super-admin/meta-ads/connect")
      .then(r => r.json()).then(setMetaConn).catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Fetch campaigns
  const fetchCampaigns = useCallback(async (preset: string) => {
    setMetaLoading(true)
    try {
      const res = await fetch(`/api/super-admin/meta-ads/campaigns?date_preset=${preset}`)
      if (!res.ok) throw new Error("Gagal memuat")
      setMetaData(await res.json())
    } catch { /* ignore */ }
    finally { setMetaLoading(false) }
  }, [])

  useEffect(() => {
    if (metaConn?.connected) {
      fetchCampaigns(datePreset)
      // Fetch AI reports
      fetch("/api/super-admin/meta-ads/ai-analysis")
        .then(r => r.json()).then(d => { if (d.reports) setAiReports(d.reports) }).catch(() => {})
    }
  }, [metaConn?.connected, datePreset, fetchCampaigns])

  // Generate AI Analysis
  const handleGenerateAi = async () => {
    setAiGenerating(true)
    try {
      const res = await fetch("/api/super-admin/meta-ads/ai-analysis", { method: "POST" })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)
      toast({ title: "Analisa AI Selesai!", description: "Laporan berhasil di-generate." })
      setAiReports(prev => [result.report, ...prev].slice(0, 12))
      setShowAiReport(result.report.date)
    } catch (e: any) {
      toast({ title: "Gagal", description: e.message, variant: "destructive" })
    } finally { setAiGenerating(false) }
  }

  // Connect
  const handleConnect = async () => {
    if (!connectForm.accessToken || !connectForm.accountId) {
      toast({ title: "Error", description: "Semua field wajib diisi", variant: "destructive" }); return
    }
    setConnecting(true)
    try {
      const res = await fetch("/api/super-admin/meta-ads/connect", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(connectForm),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)
      toast({ title: "Berhasil!", description: result.message })
      setMetaConn({ connected: true, accountName: result.accountName, accountId: connectForm.accountId, hasToken: true })
      setShowConnect(false); setConnectForm({ accessToken: '', accountId: '' })
    } catch (e: any) {
      toast({ title: "Gagal", description: e.message, variant: "destructive" })
    } finally { setConnecting(false) }
  }

  // Disconnect
  const handleDisconnect = async () => {
    await fetch("/api/super-admin/meta-ads/connect", { method: "DELETE" })
    setMetaConn({ connected: false, accountName: '', accountId: '', hasToken: false })
    setMetaData(null)
    toast({ title: "Berhasil", description: "Meta Ads diputus" })
  }

  // Campaign action
  const handleAction = async (campaignId: string, action: 'pause' | 'resume', name: string) => {
    setActionLoading(campaignId)
    try {
      const res = await fetch("/api/super-admin/meta-ads/actions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, campaignId }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)
      toast({ title: "Berhasil", description: `"${name}" berhasil di-${action === 'pause' ? 'jeda' : 'aktifkan'}.` })
      fetchCampaigns(datePreset)
    } catch (e: any) {
      toast({ title: "Gagal", description: e.message, variant: "destructive" })
    } finally { setActionLoading(null) }
  }

  // Update budget
  const handleUpdateBudget = async (campaignId: string, name: string) => {
    if (!newBudget || parseFloat(newBudget) <= 0) {
      toast({ title: "Error", description: "Budget harus lebih dari 0", variant: "destructive" }); return
    }
    setActionLoading(campaignId)
    try {
      const res = await fetch("/api/super-admin/meta-ads/actions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: 'update_budget', campaignId, budget: parseFloat(newBudget) }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)
      toast({ title: "Berhasil", description: `Budget "${name}" diubah ke Rp ${parseFloat(newBudget).toLocaleString('id-ID')}` })
      setEditBudgetId(null); setNewBudget('')
      fetchCampaigns(datePreset)
    } catch (e: any) {
      toast({ title: "Gagal", description: e.message, variant: "destructive" })
    } finally { setActionLoading(null) }
  }

  const fmtRp = (v: number) => `Rp ${Math.round(v).toLocaleString('id-ID')}`
  const fmtNum = (v: number) => v.toLocaleString('id-ID')
  const toggleSection = (s: string) => setExpandedSection(expandedSection === s ? null : s)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Memuat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <Megaphone className="h-5 sm:h-6 w-5 sm:w-6 text-blue-500" /> Analisa Meta Ads
        </h1>
        <p className="text-muted-foreground text-xs sm:text-sm mt-1">Kelola dan analisa kampanye iklan Facebook & Instagram langsung dari SchoolPro.</p>
      </div>

      {/* ======== CONNECTION ======== */}
      <Card className={cn("glass border-0", metaConn?.connected && "ring-1 ring-emerald-500/20")}>
        <CardContent className="p-5">
          {metaConn?.connected ? (
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10">
                  <Link2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{metaConn.accountName}</span>
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-0 text-[10px]">Terhubung</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">ID: {metaConn.accountId}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleDisconnect} className="rounded-xl text-rose-600 border-rose-200 hover:bg-rose-50">
                <Unlink className="h-3.5 w-3.5 mr-1.5" /> Putuskan
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10">
                    <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" fill="#1877F2"/></svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold">Hubungkan Meta Ads</p>
                    <p className="text-xs text-muted-foreground">Lihat & kelola kampanye Facebook/Instagram Ads.</p>
                  </div>
                </div>
                <Button onClick={() => setShowConnect(!showConnect)} className="rounded-xl btn-gradient text-white">
                  <Link2 className="h-4 w-4 mr-1.5" /> Hubungkan
                </Button>
              </div>
              {showConnect && (
                <div className="border rounded-xl p-4 space-y-3 bg-card">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Access Token</Label>
                    <Input type="password" placeholder="Dari Graph API Explorer atau System User"
                      value={connectForm.accessToken} onChange={e => setConnectForm(p => ({ ...p, accessToken: e.target.value }))}
                      className="rounded-xl font-mono text-xs" />
                    <p className="text-[10px] text-muted-foreground">
                      Buat di <a href="https://developers.facebook.com/tools/explorer/" target="_blank" className="text-blue-600 underline">Graph API Explorer</a> dengan izin ads_read + ads_management
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Ad Account ID</Label>
                    <Input placeholder="Contoh: 123456789" value={connectForm.accountId}
                      onChange={e => setConnectForm(p => ({ ...p, accountId: e.target.value }))} className="rounded-xl" />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleConnect} disabled={connecting} className="rounded-xl btn-gradient text-white flex-1">
                      {connecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Link2 className="h-4 w-4 mr-2" />}
                      Verifikasi & Hubungkan
                    </Button>
                    <Button variant="outline" onClick={() => setShowConnect(false)} className="rounded-xl">Batal</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ======== MAIN CONTENT (Connected) ======== */}
      {metaConn?.connected && (
        <>
          {/* Date Filter */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
              {DATE_PRESETS.map(p => (
                <button key={p.value} onClick={() => setDatePreset(p.value)}
                  className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0",
                    datePreset === p.value ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}>{p.label}</button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={() => fetchCampaigns(datePreset)} disabled={metaLoading} className="rounded-xl h-8 shrink-0">
              <RefreshCcw className={cn("h-3.5 w-3.5 mr-1.5", metaLoading && "animate-spin")} /> Refresh
            </Button>
          </div>

          {metaLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              <span className="ml-2 text-sm text-muted-foreground">Mengambil data dari Meta Ads...</span>
            </div>
          ) : metaData ? (
            <>
              {/* ======== SUMMARY CARDS ======== */}
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 xl:grid-cols-8">
                <StatCard label="Spend" value={fmtRp(metaData.summary.totalSpend)} icon={DollarSign} color="rose" />
                <StatCard label="Impressions" value={fmtNum(metaData.summary.totalImpressions)} icon={Eye} color="blue" />
                <StatCard label="Reach" value={fmtNum(metaData.summary.totalReach)} icon={Users} color="violet" />
                <StatCard label="Clicks" value={fmtNum(metaData.summary.totalClicks)} icon={MousePointerClick} color="emerald" />
                <StatCard label="CPC" value={fmtRp(metaData.summary.avgCpc)} icon={DollarSign} color="amber" />
                <StatCard label="CTR" value={`${metaData.summary.avgCtr.toFixed(2)}%`} icon={TrendingUp} color="cyan" />
                <StatCard label="Frequency" value={metaData.summary.frequency.toFixed(1)} icon={RefreshCcw} color="orange" />
                <StatCard label="Leads" value={fmtNum(metaData.summary.totalLeads)} icon={UserPlus} color="emerald" />
              </div>

              {/* ======== RECOMMENDATIONS ======== */}
              {metaData.recommendations.length > 0 && (
                <Card className="glass border-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-amber-500" /> Rekomendasi & Insight ({metaData.recommendations.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {metaData.recommendations.map((r, i) => (
                      <div key={i} className={cn("p-3 rounded-xl border text-sm flex items-start gap-3",
                        r.type === 'success' && "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900",
                        r.type === 'warning' && "bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900",
                        r.type === 'info' && "bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900",
                      )}>
                        {r.type === 'success' && <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />}
                        {r.type === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />}
                        {r.type === 'info' && <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />}
                        <div>
                          <p className="font-bold text-xs">{r.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{r.message}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* ======== DAILY TREND CHART ======== */}
              {metaData.dailyTrend.length > 1 && (
                <Card className="glass border-0">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-500" /> Tren Harian
                    </CardTitle>
                    <CardDescription>Performa iklan per hari — spend vs clicks</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[280px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={metaData.dailyTrend}>
                          <defs>
                            <linearGradient id="gradSpend" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="gradClicks" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                          <XAxis dataKey="date" stroke="#6b7280" fontSize={9} tickLine={false} axisLine={false}
                            tickFormatter={(v) => { const d = new Date(v); return `${d.getDate()}/${d.getMonth()+1}` }} />
                          <YAxis yAxisId="spend" stroke="#ef4444" fontSize={10} tickLine={false} axisLine={false}
                            tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                          <YAxis yAxisId="clicks" orientation="right" stroke="#10b981" fontSize={10} tickLine={false} axisLine={false} />
                          <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px' }}
                            formatter={(value: any, name: string) => [name === 'Spend' ? fmtRp(value) : fmtNum(value), name]} />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                          <Area yAxisId="spend" type="monotone" dataKey="spend" name="Spend" stroke="#ef4444" fill="url(#gradSpend)" strokeWidth={2} />
                          <Area yAxisId="clicks" type="monotone" dataKey="clicks" name="Clicks" stroke="#10b981" fill="url(#gradClicks)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ======== CAMPAIGNS TABLE ======== */}
              <Card className="glass border-0">
                <CardHeader className="cursor-pointer" onClick={() => toggleSection('campaigns')}>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Layers className="h-5 w-5 text-muted-foreground" /> Kampanye ({metaData.campaigns.length})
                    </CardTitle>
                    {expandedSection === 'campaigns' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CardHeader>
                {expandedSection === 'campaigns' && (
                  <CardContent>
                    {metaData.campaigns.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic text-center py-8">Tidak ada kampanye.</p>
                    ) : (
                      <>
                        {/* Desktop table */}
                        <div className="hidden md:block overflow-x-auto">
                          <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b bg-muted/30">
                              <th className="px-2 py-2 text-left font-bold text-muted-foreground uppercase">Kampanye</th>
                              <th className="px-2 py-2 text-center font-bold text-muted-foreground uppercase">Status</th>
                              <th className="px-2 py-2 text-right font-bold text-muted-foreground uppercase">Budget/Hari</th>
                              <th className="px-2 py-2 text-right font-bold text-muted-foreground uppercase">Spend</th>
                              <th className="px-2 py-2 text-right font-bold text-muted-foreground uppercase">Impr.</th>
                              <th className="px-2 py-2 text-right font-bold text-muted-foreground uppercase">Clicks</th>
                              <th className="px-2 py-2 text-right font-bold text-muted-foreground uppercase">CPC</th>
                              <th className="px-2 py-2 text-right font-bold text-muted-foreground uppercase">CTR</th>
                              <th className="px-2 py-2 text-right font-bold text-muted-foreground uppercase">Leads</th>
                              <th className="px-2 py-2 text-center font-bold text-muted-foreground uppercase">Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {metaData.campaigns.map(c => (
                              <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                <td className="px-2 py-2">
                                  <p className="font-medium">{c.name}</p>
                                  <p className="text-[9px] text-muted-foreground capitalize">{c.objective?.replace(/_/g, ' ').toLowerCase()}</p>
                                </td>
                                <td className="px-2 py-2 text-center">
                                  <Badge variant="outline" className={cn("text-[9px]",
                                    c.status === 'ACTIVE' && 'bg-emerald-50 text-emerald-600 border-emerald-200',
                                    c.status === 'PAUSED' && 'bg-amber-50 text-amber-600 border-amber-200',
                                    !['ACTIVE','PAUSED'].includes(c.status) && 'bg-gray-50 text-gray-500 border-gray-200',
                                  )}>{c.status === 'ACTIVE' ? 'Aktif' : c.status === 'PAUSED' ? 'Jeda' : c.status}</Badge>
                                </td>
                                <td className="px-2 py-2 text-right">
                                  {editBudgetId === c.id ? (
                                    <div className="flex items-center gap-1 justify-end">
                                      <Input type="number" value={newBudget} onChange={e => setNewBudget(e.target.value)}
                                        className="h-7 w-24 rounded-lg text-xs" placeholder="Budget" />
                                      <Button size="sm" className="h-7 px-2 rounded-lg text-[10px]"
                                        onClick={() => handleUpdateBudget(c.id, c.name)}
                                        disabled={actionLoading === c.id}>
                                        {actionLoading === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'OK'}
                                      </Button>
                                      <Button size="sm" variant="ghost" className="h-7 px-1 rounded-lg text-[10px]"
                                        onClick={() => setEditBudgetId(null)}>✕</Button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1 justify-end">
                                      <span>{c.dailyBudget > 0 ? fmtRp(c.dailyBudget) : '-'}</span>
                                      {c.status === 'ACTIVE' && (
                                        <button onClick={() => { setEditBudgetId(c.id); setNewBudget(c.dailyBudget.toString()) }}
                                          className="text-muted-foreground hover:text-primary transition-colors">
                                          <PencilLine className="h-3 w-3" />
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </td>
                                <td className="px-2 py-2 text-right font-bold text-rose-600">{c.spend > 0 ? fmtRp(c.spend) : '-'}</td>
                                <td className="px-2 py-2 text-right">{c.impressions > 0 ? fmtNum(c.impressions) : '-'}</td>
                                <td className="px-2 py-2 text-right font-semibold">{c.clicks > 0 ? fmtNum(c.clicks) : '-'}</td>
                                <td className="px-2 py-2 text-right">{c.cpc > 0 ? fmtRp(c.cpc) : '-'}</td>
                                <td className="px-2 py-2 text-right">{c.ctr > 0 ? `${c.ctr.toFixed(2)}%` : '-'}</td>
                                <td className="px-2 py-2 text-right font-bold text-emerald-600">{c.leads > 0 ? c.leads : '-'}</td>
                                <td className="px-2 py-2 text-center">
                                  {(c.status === 'ACTIVE' || c.status === 'PAUSED') && (
                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-lg"
                                      onClick={() => handleAction(c.id, c.status === 'ACTIVE' ? 'pause' : 'resume', c.name)}
                                      disabled={actionLoading === c.id}>
                                      {actionLoading === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
                                        c.status === 'ACTIVE' ? <Pause className="h-3.5 w-3.5 text-amber-500" /> : <Play className="h-3.5 w-3.5 text-emerald-500" />}
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile campaign cards */}
                      <div className="md:hidden divide-y divide-border/40">
                        {metaData.campaigns.map(c => (
                          <div key={c.id} className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-sm font-bold truncate">{c.name}</p>
                                <p className="text-[9px] text-muted-foreground capitalize">{c.objective?.replace(/_/g, ' ').toLowerCase()}</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <Badge variant="outline" className={cn("text-[9px]",
                                  c.status === 'ACTIVE' && 'bg-emerald-50 text-emerald-600 border-emerald-200',
                                  c.status === 'PAUSED' && 'bg-amber-50 text-amber-600 border-amber-200',
                                  !['ACTIVE','PAUSED'].includes(c.status) && 'bg-gray-50 text-gray-500 border-gray-200',
                                )}>{c.status === 'ACTIVE' ? 'Aktif' : c.status === 'PAUSED' ? 'Jeda' : c.status}</Badge>
                                {(c.status === 'ACTIVE' || c.status === 'PAUSED') && (
                                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-lg"
                                    onClick={() => handleAction(c.id, c.status === 'ACTIVE' ? 'pause' : 'resume', c.name)}
                                    disabled={actionLoading === c.id}>
                                    {actionLoading === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
                                      c.status === 'ACTIVE' ? <Pause className="h-3.5 w-3.5 text-amber-500" /> : <Play className="h-3.5 w-3.5 text-emerald-500" />}
                                  </Button>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div><span className="text-muted-foreground block text-[9px]">Spend</span><span className="font-bold text-rose-600">{c.spend > 0 ? fmtRp(c.spend) : '-'}</span></div>
                              <div><span className="text-muted-foreground block text-[9px]">Clicks</span><span className="font-bold">{c.clicks > 0 ? fmtNum(c.clicks) : '-'}</span></div>
                              <div><span className="text-muted-foreground block text-[9px]">CTR</span><span className="font-bold">{c.ctr > 0 ? `${c.ctr.toFixed(2)}%` : '-'}</span></div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div><span className="text-muted-foreground block text-[9px]">CPC</span><span>{c.cpc > 0 ? fmtRp(c.cpc) : '-'}</span></div>
                              <div><span className="text-muted-foreground block text-[9px]">Leads</span><span className="font-bold text-emerald-600">{c.leads > 0 ? c.leads : '-'}</span></div>
                              <div><span className="text-muted-foreground block text-[9px]">Budget</span><span>{c.dailyBudget > 0 ? fmtRp(c.dailyBudget) : '-'}</span></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                    )}
                  </CardContent>
                )}
              </Card>

              {/* ======== BREAKDOWN: AGE & GENDER + PLACEMENT ======== */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Age & Gender */}
                {metaData.ageGenderBreakdown.length > 0 && (
                  <Card className="glass border-0">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Users className="h-5 w-5 text-violet-500" /> Demografi
                      </CardTitle>
                      <CardDescription>Breakdown usia & gender audience iklan</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          {(() => {
                            // Group by age, sum clicks per gender
                            const ageMap = new Map<string, { age: string; Pria: number; Wanita: number }>()
                            metaData.ageGenderBreakdown.forEach(d => {
                              const existing = ageMap.get(d.age) || { age: d.age, Pria: 0, Wanita: 0 }
                              if (d.gender === 'Pria') existing.Pria += d.clicks
                              else existing.Wanita += d.clicks
                              ageMap.set(d.age, existing)
                            })
                            const chartData = [...ageMap.values()].sort((a, b) => a.age.localeCompare(b.age))
                            return (
                              <BarChart data={chartData} barCategoryGap="15%">
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis dataKey="age" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis fontSize={10} tickLine={false} axisLine={false} />
                                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px' }} />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                                <Bar dataKey="Pria" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Wanita" fill="#ec4899" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            )
                          })()}
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Placement Breakdown */}
                {metaData.placementBreakdown.length > 0 && (
                  <Card className="glass border-0">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Target className="h-5 w-5 text-blue-500" /> Performa Placement
                      </CardTitle>
                      <CardDescription>Clicks per platform & posisi penempatan</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          {(() => {
                            // Group by platform
                            const platMap = new Map<string, number>()
                            metaData.placementBreakdown.forEach(d => {
                              const label = d.platform === 'facebook' ? 'Facebook' :
                                d.platform === 'instagram' ? 'Instagram' :
                                d.platform === 'audience_network' ? 'Audience Network' :
                                d.platform === 'messenger' ? 'Messenger' : d.platform
                              platMap.set(label, (platMap.get(label) || 0) + d.clicks)
                            })
                            const pieData = [...platMap.entries()].map(([name, value]) => ({ name, value })).filter(d => d.value > 0)
                            return (
                              <PieChart>
                                <Pie data={pieData} cx="50%" cy="45%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value"
                                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <RechartsTooltip />
                              </PieChart>
                            )
                          })()}
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* ======== AI ANALYSIS ======== */}
              <Card className="glass border-0 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-violet-500/5 via-blue-500/5 to-emerald-500/5">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <BrainCircuit className="h-5 w-5 text-violet-500" /> Analisa AI Mendalam
                      </CardTitle>
                      <CardDescription>AI menganalisa data Meta Ads + data internal SchoolPro untuk rekomendasi optimasi biaya.</CardDescription>
                    </div>
                    <Button onClick={handleGenerateAi} disabled={aiGenerating} className="rounded-xl btn-gradient text-white">
                      {aiGenerating ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Menganalisa...</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate Analisa</>}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {aiReports.length === 0 ? (
                    <div className="text-center py-12">
                      <BrainCircuit className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                      <p className="text-sm font-medium mb-1">Belum ada laporan AI</p>
                      <p className="text-xs text-muted-foreground mb-4">Klik "Generate Analisa" untuk membuat laporan pertama, atau tunggu laporan otomatis setiap Senin.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Report List */}
                      {aiReports.map(r => (
                        <div key={r.date} className={cn("border rounded-xl overflow-hidden transition-all", showAiReport === r.date && "ring-1 ring-violet-500/30")}>
                          <button onClick={() => setShowAiReport(showAiReport === r.date ? null : r.date)}
                            className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors text-left">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
                                <FileText className="h-4 w-4 text-violet-600" />
                              </div>
                              <div>
                                <p className="text-sm font-bold">Laporan {new Date(r.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                <p className="text-[10px] text-muted-foreground flex items-center gap-2">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(r.generatedAt).toLocaleString('id-ID')}
                                  <span>·</span>
                                  Spend: Rp {Math.round(r.dataSummary.totalSpend).toLocaleString('id-ID')}
                                  <span>·</span>
                                  {r.dataSummary.totalClicks} clicks
                                </p>
                              </div>
                            </div>
                            {showAiReport === r.date ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                          {showAiReport === r.date && (
                            <div className="border-t p-4 bg-card">
                              <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-sm prose-headings:font-bold prose-p:text-xs prose-li:text-xs prose-strong:text-foreground">
                                <ReactMarkdown>{r.analysis}</ReactMarkdown>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : null}
        </>
      )}

      {/* ======== NOT CONNECTED ======== */}
      {!metaConn?.connected && (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <svg className="h-16 w-16 mx-auto mb-4 opacity-20" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" fill="currentColor"/></svg>
            <h3 className="text-lg font-bold mb-2">Hubungkan Meta Ads</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Hubungkan akun Facebook Ads Anda untuk melihat data kampanye, spending, demografi, dan mengelola iklan langsung dari dashboard ini.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ======== Stat Card ========
function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-500/10 text-emerald-600', blue: 'bg-blue-500/10 text-blue-600',
    violet: 'bg-violet-500/10 text-violet-600', amber: 'bg-amber-500/10 text-amber-600',
    rose: 'bg-rose-500/10 text-rose-600', cyan: 'bg-cyan-500/10 text-cyan-600',
    orange: 'bg-orange-500/10 text-orange-600',
  }
  return (
    <Card className="glass border-0">
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", colorMap[color] || colorMap.blue)}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] text-muted-foreground font-medium">{label}</p>
            <p className="text-sm font-bold truncate">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
