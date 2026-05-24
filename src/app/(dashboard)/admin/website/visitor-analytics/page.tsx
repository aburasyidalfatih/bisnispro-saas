"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Eye, Users, Globe, TrendingUp, Loader2,
  Smartphone, Monitor, Tablet, ArrowUpRight, ArrowDownRight,
} from "lucide-react"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts"
import { cn } from "@/lib/utils"

interface AnalyticsData {
  totalViews: number
  uniqueVisitors: number
  todayViews: number
  todayVisitors: number
  trafficSources: { name: string; views: number }[]
  trafficMediums: { name: string; views: number }[]
  topPages: { path: string; views: number }[]
  devices: { name: string; views: number }[]
  browsers: { name: string; views: number }[]
  dailyTrend: { date: string; views: number; visitors: number }[]
  period: number
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1']

const SOURCE_ICONS: Record<string, string> = {
  google: "🔍", facebook: "📘", instagram: "📸", threads: "🧵",
  "x-twitter": "𝕏", tiktok: "🎵", youtube: "▶️", whatsapp: "💬",
  telegram: "✈️", linkedin: "💼", bing: "🔎", direct: "🔗",
  schoolpro: "🏫", pinterest: "📌", other: "🌐",
}

const MEDIUM_LABELS: Record<string, string> = {
  organic: "Pencarian Organik",
  social: "Media Sosial",
  messaging: "Pesan / Chat",
  direct: "Langsung (Direct)",
  referral: "Rujukan (Referral)",
  internal: "Internal Platform",
  unknown: "Tidak Diketahui",
}

export default function VisitorAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState(30)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/tenant/visitor-analytics?days=${period}`)
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [period])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!data) return <div className="text-muted-foreground text-center py-20">Gagal memuat data analitik.</div>

  const avgDaily = data.period > 0 ? Math.round(data.totalViews / Math.min(data.period, 30)) : 0

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analitik Pengunjung</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Lacak dari mana pengunjung website Anda berasal dan halaman mana yang paling populer.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {[7, 14, 30].map(d => (
            <Button
              key={d}
              variant={period === d ? "default" : "outline"}
              size="sm"
              className={cn("rounded-xl text-xs", period === d && "btn-gradient text-white border-0")}
              onClick={() => setPeriod(d)}
            >
              {d} Hari
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <SummaryCard icon={Eye} label="Total Tampilan" value={data.totalViews} color="blue" />
        <SummaryCard icon={Users} label="Pengunjung Unik" value={data.uniqueVisitors} color="emerald" />
        <SummaryCard icon={TrendingUp} label="Hari Ini" value={data.todayViews} subtitle={`${data.todayVisitors} pengunjung`} color="violet" />
        <SummaryCard icon={Globe} label="Rata-rata/Hari" value={avgDaily} color="amber" />
      </div>

      {/* Trend Chart */}
      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" /> Tren Pengunjung ({period} Hari Terakhir)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            {data.dailyTrend.every(d => d.views === 0) ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm italic">
                Belum ada data pengunjung. Data akan muncul setelah website Anda dikunjungi.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.dailyTrend}>
                  <defs>
                    <linearGradient id="viewGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="visitorGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="top" height={36} />
                  <Area type="monotone" dataKey="views" name="Tampilan" stroke="#3b82f6" strokeWidth={2} fill="url(#viewGrad)" dot={{ r: 3 }} />
                  <Area type="monotone" dataKey="visitors" name="Pengunjung Unik" stroke="#10b981" strokeWidth={2} fill="url(#visitorGrad)" dot={{ r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Traffic Sources */}
        <Card className="glass border-0">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-500" /> Sumber Traffic
            </CardTitle>
            <CardDescription>Dari mana pengunjung website Anda berasal.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.trafficSources.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-8 text-center">Belum ada data.</p>
            ) : (
              <div className="space-y-2">
                {data.trafficSources.map((src, i) => {
                  const pct = data.totalViews > 0 ? (src.views / data.totalViews * 100) : 0
                  return (
                    <div key={src.name} className="flex items-center gap-3">
                      <span className="text-lg w-7 text-center">{SOURCE_ICONS[src.name] || "🌐"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium capitalize truncate">{src.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">{src.views} ({pct.toFixed(1)}%)</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Traffic Medium */}
        <Card className="glass border-0">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" /> Kategori Traffic
            </CardTitle>
            <CardDescription>Organik, sosial media, langsung, atau rujukan.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.trafficMediums.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-8 text-center">Belum ada data.</p>
            ) : (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.trafficMediums.map(m => ({ ...m, name: MEDIUM_LABELS[m.name] || m.name }))}
                      cx="50%" cy="45%"
                      innerRadius={60} outerRadius={95}
                      paddingAngle={4}
                      dataKey="views"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {data.trafficMediums.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Pages */}
        <Card className="glass border-0">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="h-5 w-5 text-violet-500" /> Halaman Populer
            </CardTitle>
            <CardDescription>15 halaman yang paling sering dikunjungi.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topPages.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-8 text-center">Belum ada data.</p>
            ) : (
              <div className="space-y-1.5 max-h-[320px] overflow-y-auto">
                {data.topPages.map((page, i) => (
                  <div key={page.path} className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-muted/50 transition-colors">
                    <span className="text-xs font-bold text-muted-foreground w-5 text-right">{i + 1}</span>
                    <span className="flex-1 text-xs font-mono truncate text-foreground">{page.path}</span>
                    <span className="text-xs font-bold text-primary">{page.views}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Devices & Browsers */}
        <Card className="glass border-0">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Monitor className="h-5 w-5 text-amber-500" /> Perangkat & Browser
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Devices */}
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Perangkat</p>
              <div className="grid grid-cols-3 gap-3">
                {data.devices.map(d => {
                  const DeviceIcon = d.name === "mobile" ? Smartphone : d.name === "tablet" ? Tablet : Monitor
                  const pct = data.totalViews > 0 ? (d.views / data.totalViews * 100).toFixed(0) : "0"
                  return (
                    <div key={d.name} className="text-center p-3 rounded-xl border bg-card">
                      <DeviceIcon className="h-6 w-6 mx-auto mb-1.5 text-muted-foreground" />
                      <p className="text-lg font-bold">{pct}%</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{d.name}</p>
                    </div>
                  )
                })}
              </div>
            </div>
            {/* Browsers */}
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Browser</p>
              <div className="space-y-2">
                {data.browsers.slice(0, 5).map((b, i) => {
                  const pct = data.totalViews > 0 ? (b.views / data.totalViews * 100) : 0
                  return (
                    <div key={b.name} className="flex items-center gap-3">
                      <span className="text-xs font-medium w-16 truncate">{b.name}</span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-12 text-right">{pct.toFixed(0)}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Box */}
      <Card className="glass border-0 bg-blue-50/50 dark:bg-blue-950/20">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 mt-0.5">
              <Globe className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold">Tips Meningkatkan Traffic</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tambahkan parameter UTM ke link yang Anda bagikan untuk tracking yang lebih detail. Contoh:
              </p>
              <code className="block text-[10px] bg-muted/80 rounded-lg p-2 font-mono text-foreground mt-2 break-all">
                https://sekolah.schoolpro.id?utm_source=facebook&utm_medium=ads&utm_campaign=ppdb2026
              </code>
              <p className="text-[10px] text-muted-foreground mt-1">
                Sumber otomatis terdeteksi: Google, Facebook, Instagram, Threads, TikTok, YouTube, WhatsApp, Telegram, dan lainnya.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryCard({ icon: Icon, label, value, color, subtitle }: {
  icon: any; label: string; value: number; color: string; subtitle?: string
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-600",
    emerald: "bg-emerald-500/10 text-emerald-600",
    violet: "bg-violet-500/10 text-violet-600",
    amber: "bg-amber-500/10 text-amber-600",
  }
  return (
    <Card className="glass border-0">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", colorMap[color])}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-medium">{label}</p>
            <h3 className="text-xl font-bold">{value.toLocaleString("id-ID")}</h3>
            {subtitle && <p className="text-[9px] text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
