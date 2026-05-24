"use client"

import { useEffect, useState, useCallback } from "react"
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
  Save, ExternalLink, Zap, Filter, Link2, Unlink,
  MousePointerClick, Layers, Activity, RefreshCcw,
} from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
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
  funnel: { metaLeads: number; metaApproved: number; metaUpgraded: number }
  bySource: { source: string; total: number; approved: number; rejected: number; pending: number }[]
  byCampaign: { campaign: string; total: number; approved: number; conversionRate: number }[]
  byMedium: { medium: string; count: number }[]
  monthlyTrend: { month: string; ads: number; organic: number; affiliate: number }[]
  roi: {
    currentMonthBudget: number; totalAdSpend: number; thisMonthAdsLeads: number;
    thisMonthAdsApproved: number; costPerLead: number; costPerAcquisition: number;
    thisMonthRevenue: number; roas: number
  }
  adBudgets: { id: string; month: string; year: number; platform: string; budget: number; notes: string | null }[]
  recentAdsLeads: { schoolName: string; status: string; source: string; medium: string; campaign: string; content: string; date: string }[]
}

interface MetaConnection {
  connected: boolean; accountName: string; accountId: string; hasToken: boolean
}

interface MetaCampaign {
  id: string; name: string; status: string; objective: string
  dailyBudget: number; lifetimeBudget: number; startTime: string; stopTime: string
  spend: number; impressions: number; clicks: number; cpc: number; ctr: number
  reach: number; leads: number; pageViews: number
}

interface MetaCampaignData {
  campaigns: MetaCampaign[]
  summary: {
    totalSpend: number; totalImpressions: number; totalClicks: number
    totalReach: number; avgCpc: number; avgCtr: number; totalLeads: number
  }
  datePreset: string
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4']
const SOURCE_COLORS: Record<string, string> = {
  facebook: '#1877F2', meta: '#1877F2', fb: '#1877F2',
  instagram: '#E4405F', google: '#4285F4',
  tiktok: '#000000', Afiliasi: '#8b5cf6', Organik: '#94a3b8',
}

const DATE_PRESETS = [
  { value: 'today', label: 'Hari Ini' },
  { value: 'yesterday', label: 'Kemarin' },
  { value: 'this_month', label: 'Bulan Ini' },
  { value: 'last_month', label: 'Bulan Lalu' },
  { value: 'last_7d', label: '7 Hari' },
  { value: 'last_30d', label: '30 Hari' },
  { value: 'this_year', label: 'Tahun Ini' },
]

export default function AdsAnalyticsPage() {
  const [data, setData] = useState<AdsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Meta integration state
  const [metaConnection, setMetaConnection] = useState<MetaConnection | null>(null)
  const [metaCampaigns, setMetaCampaigns] = useState<MetaCampaignData | null>(null)
  const [metaLoading, setMetaLoading] = useState(false)
  const [datePreset, setDatePreset] = useState('this_month')
  const [showConnectForm, setShowConnectForm] = useState(false)
  const [connectForm, setConnectForm] = useState({ accessToken: '', accountId: '' })
  const [connecting, setConnecting] = useState(false)

  const now = new Date()
  const [budgetForm, setBudgetForm] = useState({
    month: (now.getMonth() + 1).toString().padStart(2, '0'),
    year: now.getFullYear().toString(),
    budget: '', notes: '',
  })

  // Fetch internal ads data
  useEffect(() => {
    fetch("/api/super-admin/ads-analytics")
      .then(res => { if (!res.ok) throw new Error("API error"); return res.json() })
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Fetch Meta connection status
  useEffect(() => {
    fetch("/api/super-admin/meta-ads/connect")
      .then(res => res.json())
      .then(setMetaConnection)
      .catch(console.error)
  }, [])

  // Fetch Meta campaigns
  const fetchMetaCampaigns = useCallback(async (preset: string) => {
    setMetaLoading(true)
    try {
      const res = await fetch(`/api/super-admin/meta-ads/campaigns?date_preset=${preset}`)
      if (!res.ok) throw new Error("Gagal memuat kampanye")
      const d = await res.json()
      setMetaCampaigns(d)
    } catch (e) {
      console.error(e)
    } finally {
      setMetaLoading(false)
    }
  }, [])

  useEffect(() => {
    if (metaConnection?.connected) fetchMetaCampaigns(datePreset)
  }, [metaConnection?.connected, datePreset, fetchMetaCampaigns])

  // Connect Meta
  const handleConnect = async () => {
    if (!connectForm.accessToken || !connectForm.accountId) {
      toast({ title: "Error", description: "Semua field wajib diisi", variant: "destructive" })
      return
    }
    setConnecting(true)
    try {
      const res = await fetch("/api/super-admin/meta-ads/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(connectForm),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)
      toast({ title: "Berhasil!", description: result.message })
      setMetaConnection({ connected: true, accountName: result.accountName, accountId: connectForm.accountId, hasToken: true })
      setShowConnectForm(false)
      setConnectForm({ accessToken: '', accountId: '' })
    } catch (e: any) {
      toast({ title: "Gagal Terhubung", description: e.message, variant: "destructive" })
    } finally {
      setConnecting(false)
    }
  }

  // Disconnect Meta
  const handleDisconnect = async () => {
    try {
      await fetch("/api/super-admin/meta-ads/connect", { method: "DELETE" })
      setMetaConnection({ connected: false, accountName: '', accountId: '', hasToken: false })
      setMetaCampaigns(null)
      toast({ title: "Berhasil", description: "Meta Ads berhasil diputus" })
    } catch {
      toast({ title: "Error", description: "Gagal memutuskan", variant: "destructive" })
    }
  }

  const handleSaveBudget = async () => {
    if (!budgetForm.budget) {
      toast({ title: "Error", description: "Budget wajib diisi", variant: "destructive" }); return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/super-admin/ads-analytics", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(budgetForm),
      })
      if (!res.ok) throw new Error("Gagal menyimpan")
      toast({ title: "Berhasil", description: "Budget iklan berhasil disimpan" })
      const newData = await fetch("/api/super-admin/ads-analytics").then(r => r.json())
      setData(newData)
      setBudgetForm(prev => ({ ...prev, budget: '', notes: '' }))
    } catch {
      toast({ title: "Error", description: "Gagal menyimpan budget", variant: "destructive" })
    } finally { setSaving(false) }
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
  const fmtNum = (v: number) => v.toLocaleString('id-ID')

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-blue-500" /> Analisa Efektivitas Iklan
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Pantau ROI iklan, conversion funnel, dan data kampanye Meta Ads.
          </p>
        </div>
      </div>

      {/* ============================================ */}
      {/* META ADS INTEGRATION                        */}
      {/* ============================================ */}
      <div>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" fill="#1877F2"/></svg>
          Integrasi Meta Ads
        </h2>

        {/* Connection Status Card */}
        <Card className={cn("glass border-0 transition-all", metaConnection?.connected ? "ring-2 ring-emerald-500/20" : "")}>
          <CardContent className="p-5">
            {metaConnection?.connected ? (
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10">
                    <Link2 className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">Terhubung</span>
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-0 text-[10px]">Aktif</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Akun: <span className="font-semibold text-foreground">{metaConnection.accountName}</span> · ID: {metaConnection.accountId}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleDisconnect} className="rounded-xl text-rose-600 border-rose-200 hover:bg-rose-50">
                  <Unlink className="h-4 w-4 mr-1.5" /> Putuskan
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10">
                      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" fill="#1877F2"/></svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold">Hubungkan Meta Ads</p>
                      <p className="text-xs text-muted-foreground">Hubungkan akun Facebook Ads untuk melihat data kampanye, spending, dan performa secara otomatis.</p>
                    </div>
                  </div>
                  <Button onClick={() => setShowConnectForm(!showConnectForm)} className="rounded-xl btn-gradient text-white">
                    <Link2 className="h-4 w-4 mr-1.5" /> Hubungkan Sekarang
                  </Button>
                </div>

                {showConnectForm && (
                  <div className="border rounded-xl p-4 space-y-4 bg-card">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">Access Token</Label>
                      <Input
                        type="password"
                        placeholder="Paste access token dari Facebook Business Settings"
                        value={connectForm.accessToken}
                        onChange={e => setConnectForm(prev => ({ ...prev, accessToken: e.target.value }))}
                        className="rounded-xl font-mono text-xs"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Dapatkan dari: <a href="https://business.facebook.com/settings/system-users" target="_blank" rel="noopener" className="text-blue-600 underline">Business Settings → System Users → Generate Token</a> (izin: ads_read)
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">Ad Account ID</Label>
                      <Input
                        placeholder="Contoh: 123456789"
                        value={connectForm.accountId}
                        onChange={e => setConnectForm(prev => ({ ...prev, accountId: e.target.value }))}
                        className="rounded-xl"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Dapatkan dari: <a href="https://business.facebook.com/settings/ad-accounts" target="_blank" rel="noopener" className="text-blue-600 underline">Business Settings → Ad Accounts</a> → salin ID akun
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleConnect} disabled={connecting} className="rounded-xl btn-gradient text-white flex-1">
                        {connecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Link2 className="h-4 w-4 mr-2" />}
                        Verifikasi & Hubungkan
                      </Button>
                      <Button variant="outline" onClick={() => setShowConnectForm(false)} className="rounded-xl">Batal</Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ============================================ */}
      {/* META ADS CAMPAIGNS (if connected)           */}
      {/* ============================================ */}
      {metaConnection?.connected && (
        <div>
          <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" /> Data Kampanye Meta Ads
            </h2>
            <div className="flex items-center gap-2">
              <select
                value={datePreset}
                onChange={e => setDatePreset(e.target.value)}
                className="h-9 rounded-xl border bg-background px-3 text-xs font-medium"
              >
                {DATE_PRESETS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
              <Button variant="outline" size="sm" onClick={() => fetchMetaCampaigns(datePreset)} disabled={metaLoading} className="rounded-xl h-9">
                <RefreshCcw className={cn("h-3.5 w-3.5", metaLoading && "animate-spin")} />
              </Button>
            </div>
          </div>

          {metaLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              <span className="ml-2 text-sm text-muted-foreground">Mengambil data dari Meta...</span>
            </div>
          ) : metaCampaigns ? (
            <div className="space-y-6">
              {/* Meta Summary Cards */}
              <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
                <MetaStatCard label="Total Spend" value={fmtRp(metaCampaigns.summary.totalSpend)} icon={DollarSign} color="rose" />
                <MetaStatCard label="Impressions" value={fmtNum(metaCampaigns.summary.totalImpressions)} icon={Eye} color="blue" />
                <MetaStatCard label="Reach" value={fmtNum(metaCampaigns.summary.totalReach)} icon={Users} color="violet" />
                <MetaStatCard label="Clicks" value={fmtNum(metaCampaigns.summary.totalClicks)} icon={MousePointerClick} color="emerald" />
                <MetaStatCard label="CPC" value={fmtRp(metaCampaigns.summary.avgCpc)} icon={DollarSign} color="amber" />
                <MetaStatCard label="CTR" value={`${metaCampaigns.summary.avgCtr.toFixed(2)}%`} icon={TrendingUp} color="cyan" />
                <MetaStatCard label="Leads" value={fmtNum(metaCampaigns.summary.totalLeads)} icon={UserPlus} color="emerald" />
              </div>

              {/* Campaign Table */}
              <Card className="glass border-0">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Layers className="h-5 w-5 text-muted-foreground" /> Daftar Kampanye ({metaCampaigns.campaigns.length})
                  </CardTitle>
                  <CardDescription>Data langsung dari Meta Ads Manager — {DATE_PRESETS.find(p => p.value === datePreset)?.label}</CardDescription>
                </CardHeader>
                <CardContent>
                  {metaCampaigns.campaigns.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic text-center py-8">Tidak ada kampanye aktif untuk periode ini.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/30">
                            <th className="px-3 py-2 text-left text-xs font-bold text-muted-foreground uppercase">Kampanye</th>
                            <th className="px-3 py-2 text-center text-xs font-bold text-muted-foreground uppercase">Status</th>
                            <th className="px-3 py-2 text-right text-xs font-bold text-muted-foreground uppercase">Spend</th>
                            <th className="px-3 py-2 text-right text-xs font-bold text-muted-foreground uppercase">Impr.</th>
                            <th className="px-3 py-2 text-right text-xs font-bold text-muted-foreground uppercase">Reach</th>
                            <th className="px-3 py-2 text-right text-xs font-bold text-muted-foreground uppercase">Clicks</th>
                            <th className="px-3 py-2 text-right text-xs font-bold text-muted-foreground uppercase">CPC</th>
                            <th className="px-3 py-2 text-right text-xs font-bold text-muted-foreground uppercase">CTR</th>
                            <th className="px-3 py-2 text-right text-xs font-bold text-muted-foreground uppercase">Leads</th>
                          </tr>
                        </thead>
                        <tbody>
                          {metaCampaigns.campaigns.map(c => (
                            <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                              <td className="px-3 py-2.5">
                                <div>
                                  <p className="font-medium text-xs">{c.name}</p>
                                  <p className="text-[10px] text-muted-foreground capitalize">{c.objective?.replace(/_/g, ' ').toLowerCase()}</p>
                                </div>
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <Badge variant="outline" className={cn("text-[10px]",
                                  c.status === 'ACTIVE' && 'bg-emerald-50 text-emerald-600 border-emerald-200',
                                  c.status === 'PAUSED' && 'bg-amber-50 text-amber-600 border-amber-200',
                                  (c.status !== 'ACTIVE' && c.status !== 'PAUSED') && 'bg-gray-50 text-gray-600 border-gray-200',
                                )}>{c.status === 'ACTIVE' ? 'Aktif' : c.status === 'PAUSED' ? 'Jeda' : c.status}</Badge>
                              </td>
                              <td className="px-3 py-2.5 text-right font-bold text-rose-600 text-xs">{c.spend > 0 ? fmtRp(c.spend) : '-'}</td>
                              <td className="px-3 py-2.5 text-right text-xs">{c.impressions > 0 ? fmtNum(c.impressions) : '-'}</td>
                              <td className="px-3 py-2.5 text-right text-xs">{c.reach > 0 ? fmtNum(c.reach) : '-'}</td>
                              <td className="px-3 py-2.5 text-right font-semibold text-xs">{c.clicks > 0 ? fmtNum(c.clicks) : '-'}</td>
                              <td className="px-3 py-2.5 text-right text-xs">{c.cpc > 0 ? fmtRp(c.cpc) : '-'}</td>
                              <td className="px-3 py-2.5 text-right text-xs">{c.ctr > 0 ? `${c.ctr.toFixed(2)}%` : '-'}</td>
                              <td className="px-3 py-2.5 text-right font-bold text-emerald-600 text-xs">{c.leads > 0 ? c.leads : '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-muted/50 font-bold text-xs">
                            <td className="px-3 py-2.5" colSpan={2}>TOTAL</td>
                            <td className="px-3 py-2.5 text-right text-rose-600">{fmtRp(metaCampaigns.summary.totalSpend)}</td>
                            <td className="px-3 py-2.5 text-right">{fmtNum(metaCampaigns.summary.totalImpressions)}</td>
                            <td className="px-3 py-2.5 text-right">{fmtNum(metaCampaigns.summary.totalReach)}</td>
                            <td className="px-3 py-2.5 text-right">{fmtNum(metaCampaigns.summary.totalClicks)}</td>
                            <td className="px-3 py-2.5 text-right">{fmtRp(metaCampaigns.summary.avgCpc)}</td>
                            <td className="px-3 py-2.5 text-right">{metaCampaigns.summary.avgCtr.toFixed(2)}%</td>
                            <td className="px-3 py-2.5 text-right text-emerald-600">{metaCampaigns.summary.totalLeads}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>
      )}

      {/* ============================================ */}
      {/* SECTION 1: ROI OVERVIEW                      */}
      {/* ============================================ */}
      <div>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-emerald-500" /> ROI Bulan Ini
        </h2>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <RoiCard label="Budget Iklan" value={fmtRp(data.roi.currentMonthBudget)} subtitle="Bulan ini" icon={Wallet} color="blue" />
          <RoiCard label="Cost per Lead" value={data.roi.costPerLead > 0 ? fmtRp(data.roi.costPerLead) : '-'} subtitle={`${data.roi.thisMonthAdsLeads} leads dari iklan`} icon={UserPlus} color="violet" />
          <RoiCard label="Cost per Acquisition" value={data.roi.costPerAcquisition > 0 ? fmtRp(data.roi.costPerAcquisition) : '-'} subtitle={`${data.roi.thisMonthAdsApproved} disetujui`} icon={UserCheck} color="amber" />
          <RoiCard label="ROAS" value={data.roi.roas > 0 ? `${data.roi.roas}x` : '-'} subtitle={`Revenue: ${fmtRp(data.roi.thisMonthRevenue)}`} icon={TrendingUp} color={data.roi.roas >= 1 ? "emerald" : "rose"} highlight={data.roi.roas >= 1} />
        </div>
      </div>

      {/* ============================================ */}
      {/* SECTION 2: CONVERSION FUNNEL                 */}
      {/* ============================================ */}
      <div>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Target className="h-5 w-5 text-violet-500" /> Conversion Funnel
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
                  <span className="font-bold">{data.funnel.metaLeads > 0 ? `${(data.funnel.metaApproved / data.funnel.metaLeads * 100).toFixed(1)}%` : '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Approve → Upgrade Rate</span>
                  <span className="font-bold text-violet-600">{data.funnel.metaApproved > 0 ? `${(data.funnel.metaUpgraded / data.funnel.metaApproved * 100).toFixed(1)}%` : '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Overall Conversion</span>
                  <span className="font-bold text-emerald-600">{data.funnel.metaLeads > 0 ? `${(data.funnel.metaUpgraded / data.funnel.metaLeads * 100).toFixed(1)}%` : '-'}</span>
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
                <p className="text-sm text-muted-foreground italic text-center py-8">Belum ada data.</p>
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
      {/* SECTION 4: CAMPAIGN PERFORMANCE (UTM)        */}
      {/* ============================================ */}
      {data.byCampaign.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-amber-500" /> Performa Kampanye (UTM)
          </h2>
          <Card className="glass border-0">
            <CardHeader>
              <CardTitle className="text-base">Leads & Konversi per Kampanye</CardTitle>
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
                  <select value={budgetForm.month} onChange={e => setBudgetForm(prev => ({ ...prev, month: e.target.value }))}
                    className="w-full h-10 rounded-xl border bg-background px-3 text-sm">
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
                  onChange={e => setBudgetForm(prev => ({ ...prev, budget: e.target.value }))} className="rounded-xl text-lg font-bold" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Catatan (Opsional)</Label>
                <Input placeholder="Misal: Kampanye promo Ramadhan" value={budgetForm.notes}
                  onChange={e => setBudgetForm(prev => ({ ...prev, notes: e.target.value }))} className="rounded-xl" />
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
                          <Badge variant="outline" className={cn("text-[10px]",
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
      <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900">
        <CardContent className="p-4">
          <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
            <Zap className="h-4 w-4" /> Tips Penggunaan
          </h3>
          <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
            <li><strong>Meta Ads:</strong> Hubungkan akun untuk melihat data kampanye (spend, clicks, impressions) secara otomatis.</li>
            <li><strong>UTM:</strong> Tambahkan <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">?utm_source=facebook&utm_medium=cpc&utm_campaign=nama</code> di URL iklan untuk tracking detail.</li>
            <li>Input budget iklan bulanan untuk menghitung Cost per Lead dan ROAS secara otomatis.</li>
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

// ============================================
// Component: Meta Stat Card
// ============================================
function MetaStatCard({ label, value, icon: Icon, color }: {
  label: string; value: string; icon: any; color: string
}) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-500/10 text-emerald-600',
    blue: 'bg-blue-500/10 text-blue-600',
    violet: 'bg-violet-500/10 text-violet-600',
    amber: 'bg-amber-500/10 text-amber-600',
    rose: 'bg-rose-500/10 text-rose-600',
    cyan: 'bg-cyan-500/10 text-cyan-600',
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
