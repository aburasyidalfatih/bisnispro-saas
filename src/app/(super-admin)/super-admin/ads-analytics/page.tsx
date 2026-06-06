"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Megaphone, Loader2, RefreshCcw } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

import { MetaConnection, MetaData, AiReport } from "./_components/types"
import { AdsConnection } from "./_components/ads-connection"
import { AdsSummaryCards } from "./_components/ads-summary-cards"
import { AdsCharts } from "./_components/ads-charts"
import { AdsTable } from "./_components/ads-table"
import { AiAnalysisReport } from "./_components/ai-analysis-report"

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
  
  // Connection state
  const [showConnect, setShowConnect] = useState(false)
  const [connectForm, setConnectForm] = useState({ accessToken: '', accountId: '' })
  const [connecting, setConnecting] = useState(false)
  
  // Action state
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  // AI Analysis state
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
  const handleUpdateBudget = async (campaignId: string, name: string, newBudget: string) => {
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
      fetchCampaigns(datePreset)
    } catch (e: any) {
      toast({ title: "Gagal", description: e.message, variant: "destructive" })
    } finally { setActionLoading(null) }
  }

  const fmtRp = (v: number) => `Rp ${Math.round(v).toLocaleString('id-ID')}`
  const fmtNum = (v: number) => v.toLocaleString('id-ID')

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

      <AdsConnection 
        metaConn={metaConn}
        showConnect={showConnect}
        setShowConnect={setShowConnect}
        connectForm={connectForm}
        setConnectForm={setConnectForm}
        connecting={connecting}
        handleConnect={handleConnect}
        handleDisconnect={handleDisconnect}
      />

      {/* ======== MAIN CONTENT (Connected) ======== */}
      {metaConn?.connected && (
        <>
          {/* Date Filter */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
              {DATE_PRESETS.map(p => (
                <Button key={p.value} onClick={() => setDatePreset(p.value)}
                  className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0",
                    datePreset === p.value ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}>{p.label}</Button>
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
              <AdsSummaryCards metaData={metaData} fmtRp={fmtRp} fmtNum={fmtNum} />
              
              <AdsCharts metaData={metaData} fmtRp={fmtRp} fmtNum={fmtNum} />

              <AdsTable 
                metaData={metaData} 
                actionLoading={actionLoading} 
                handleAction={handleAction} 
                handleUpdateBudget={handleUpdateBudget} 
                fmtRp={fmtRp} 
                fmtNum={fmtNum} 
              />

              <AiAnalysisReport 
                aiReports={aiReports} 
                aiGenerating={aiGenerating} 
                showAiReport={showAiReport} 
                setShowAiReport={setShowAiReport} 
                handleGenerateAi={handleGenerateAi} 
              />
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
