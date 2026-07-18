import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Globe, Eye, Users, Monitor, Smartphone, Tablet, TrendingUp, UserX, Star, Zap, GraduationCap, MessageSquare, Heart, Store, BrainCircuit } from "lucide-react"
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts"
import { cn } from "@/lib/utils"
import { AnalyticsData, COLORS } from "./types"
import { SummaryCard } from "./shared-components"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"

export function EngagementTab() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/super-admin/analytics?tab=engagement")
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

  if (!data || !data.engagementStats) return <div className="p-8 text-center text-muted-foreground">Gagal memuat data engagement.</div>
  return (
    <div className="space-y-8 mt-6">
      {/* SECTION 7: VISITOR TRACKING */}
      <div>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Globe className="h-5 w-5 text-cyan-500" /> Analitik Pengunjung Website (30 Hari)
        </h2>

        {/* Visitor Summary Cards */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-6">
          <SummaryCard icon={Eye} label="Total Tampilan" value={data.visitorStats.totalPageViews} color="blue" />
          <SummaryCard icon={Users} label="Pengunjung Unik" value={data.visitorStats.uniqueVisitors} color="emerald" />
          <SummaryCard icon={Eye} label="Tampilan Hari Ini" value={data.visitorStats.todayPageViews} color="violet" pulse />
          <SummaryCard icon={Users} label="Pengunjung Hari Ini" value={data.visitorStats.todayUniqueVisitors} color="amber" pulse />
        </div>

        {/* Traffic Trend */}
        <Card className="glass border-0 mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" /> Tren Traffic 7 Hari Terakhir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] sm:h-[280px] w-full">
              {data.visitorStats.trend7Days.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm italic">Belum ada data pengunjung.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.visitorStats.trend7Days}>
                    <defs>
                      <linearGradient id="viewGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
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
                    <Area type="monotone" dataKey="views" name="Tampilan" stroke="#06b6d4" strokeWidth={2} fill="url(#viewGrad)" dot={{ r: 3 }} />
                    <Area type="monotone" dataKey="visitors" name="Pengunjung Unik" stroke="#10b981" strokeWidth={2} fill="url(#visitorGrad)" dot={{ r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Traffic Sources */}
          <Card className="glass border-0">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-500" /> Sumber Traffic
              </CardTitle>
              <CardDescription>Dari mana pengunjung website lembaga berasal.</CardDescription>
            </CardHeader>
            <CardContent>
              {data.visitorStats.sources.length === 0 ? (
                <p className="text-sm text-muted-foreground italic py-8 text-center">Belum ada data.</p>
              ) : (
                <div className="space-y-2">
                  {data.visitorStats.sources.slice(0, 10).map((src, i) => {
                    const pct = data.visitorStats.totalPageViews > 0 ? (src.views / data.visitorStats.totalPageViews * 100) : 0
                    const icons: Record<string, string> = {
                      google: '🔍', facebook: '📘', instagram: '📸', threads: '🧵',
                      'x-twitter': '𝕏', tiktok: '🎵', youtube: '▶️', whatsapp: '💬',
                      telegram: '✈️', direct: '🔗', schoolpro: '🏫', bing: '🔎',
                    }
                    return (
                      <div key={src.name} className="flex items-center gap-3">
                        <span className="text-lg w-7 text-center">{icons[src.name] || '🌐'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium capitalize truncate">{src.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">{src.views} ({pct.toFixed(1)}%)</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
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
              {data.visitorStats.topPages.length === 0 ? (
                <p className="text-sm text-muted-foreground italic py-8 text-center">Belum ada data.</p>
              ) : (
                <div className="space-y-1.5 max-h-[320px] overflow-y-auto">
                  {data.visitorStats.topPages.map((page, i) => (
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
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Perangkat</p>
                <div className="grid grid-cols-3 gap-3">
                  {data.visitorStats.devices.map(d => {
                    const DeviceIcon = d.name === 'mobile' ? Smartphone : d.name === 'tablet' ? Tablet : Monitor
                    const pct = data.visitorStats.totalPageViews > 0 ? (d.views / data.visitorStats.totalPageViews * 100).toFixed(0) : '0'
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
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Browser</p>
                <div className="space-y-2">
                  {data.visitorStats.browsers.slice(0, 5).map((b, i) => {
                    const pct = data.visitorStats.totalPageViews > 0 ? (b.views / data.visitorStats.totalPageViews * 100) : 0
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

        {/* Top Lembaga by Traffic */}
        {data.visitorStats.topTrafficTenants.length > 0 && (
          <Card className="glass border-0 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-5 w-5 text-cyan-500" /> Top 10 Website Lembaga Terbanyak Dikunjungi
              </CardTitle>
              <CardDescription>Berdasarkan total tampilan halaman bulan ini.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[340px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.visitorStats.topTrafficTenants} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} stroke="#e5e7eb" />
                    <XAxis type="number" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} width={120} />
                    <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="views" name="Tampilan" fill="#06b6d4" radius={[0, 6, 6, 0]} barSize={20}>
                      {data.visitorStats.topTrafficTenants.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* SECTION 10: RETENTION & CHURN */}
      <div>
        <h2 className="text-base sm:text-lg font-bold mb-3 flex items-center gap-2"><UserX className="h-5 w-5 text-rose-500" /> Retensi &amp; Churn</h2>
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          <Card className="glass border-0">
            <CardHeader><CardTitle className="text-base">Aktivitas Terakhir</CardTitle><CardDescription>Kapan terakhir tenant login.</CardDescription></CardHeader>
            <CardContent>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { label: 'Aktif (<30h)', value: data.retentionStats.activeRecently },
                    { label: 'Tidur (30-60h)', value: data.retentionStats.inactive30Days },
                    { label: 'Risiko (60-90h)', value: data.retentionStats.inactive60Days },
                    { label: 'Dorman (>90h)', value: data.retentionStats.inactive90Days },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="label" stroke="#6b7280" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="value" name="Lembaga" radius={[6, 6, 0, 0]} barSize={36}>
                      <Cell fill="#10b981" /><Cell fill="#f59e0b" /><Cell fill="#f97316" /><Cell fill="#ef4444" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-0">
            <CardHeader><CardTitle className="text-base">Status Retensi</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 rounded-xl border bg-card">
                <p className="text-3xl font-bold text-rose-600">{data.retentionStats.churnRate}%</p>
                <p className="text-[10px] text-muted-foreground mt-1">Churn Rate</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Aktif</span>
                  <span className="font-bold">{data.retentionStats.retentionActive}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Berisiko</span>
                  <span className="font-bold text-amber-600">{data.retentionStats.retentionAtRisk}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Churned</span>
                  <span className="font-bold text-rose-600">{data.retentionStats.retentionChurned}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-0">
            <CardHeader><CardTitle className="text-base">Langganan Expired</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center justify-center h-[220px]">
              <div className="text-center">
                <p className="text-5xl font-bold text-amber-600">{data.retentionStats.expiredNotRenewed}</p>
                <p className="text-sm text-muted-foreground mt-2">Langganan expired belum diperpanjang</p>
                <p className="text-[10px] text-muted-foreground mt-1 italic">Potensi revenue hilang — follow up!</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SECTION 14: ENGAGEMENT SCORE */}
      <div>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Star className="h-5 w-5 text-yellow-500" /> Skor Engagement Lembaga</h2>
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          <Card className="glass border-0">
            <CardHeader><CardTitle className="text-base">Rata-rata Skor</CardTitle><CardDescription>{data.engagementStats.totalScored} tenant dinilai.</CardDescription></CardHeader>
            <CardContent className="flex items-center justify-center h-[200px]">
              <div className="text-center">
                <div className="relative w-28 h-28 mx-auto mb-3">
                  <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted" />
                    <circle cx="50" cy="50" r="42" fill="none" stroke="url(#scoreGrad2)" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(data.engagementStats.avgTotalScore / 100) * 264} 264`} />
                    <defs><linearGradient id="scoreGrad2"><stop stopColor="#f59e0b" /><stop offset="1" stopColor="#10b981" /></linearGradient></defs>
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold">{data.engagementStats.avgTotalScore}</span>
                </div>
                <p className="text-xs text-muted-foreground">dari 100 poin</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-0">
            <CardHeader><CardTitle className="text-base">Skor per Paket</CardTitle><CardDescription>Rata-rata engagement berdasarkan plan.</CardDescription></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.engagementStats.avgScorePerPlan.map(ps => (
                  <div key={ps.plan}>
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className={cn(
                        ps.plan === 'FREE' && 'bg-slate-50 text-slate-600 border-slate-200',
                        ps.plan === 'LITE' && 'bg-blue-50 text-blue-600 border-blue-200',
                        ps.plan === 'PRO' && 'bg-violet-50 text-violet-600 border-violet-200',
                      )}>{ps.plan}</Badge>
                      <span className="text-sm font-bold">{ps.avgScore}/100 <span className="text-[10px] text-muted-foreground font-normal">({ps.count} lembaga)</span></span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${ps.avgScore}%`, backgroundColor: ps.plan === 'FREE' ? '#94a3b8' : ps.plan === 'LITE' ? '#3b82f6' : '#8b5cf6' }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-0">
            <CardHeader><CardTitle className="text-base">Distribusi Skor</CardTitle><CardDescription>Sebaran skor engagement seluruh lembaga.</CardDescription></CardHeader>
            <CardContent>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.engagementStats.scoreBrackets}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={8} tickLine={false} axisLine={false} />
                    <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="value" name="Lembaga" radius={[6, 6, 0, 0]} barSize={36}>
                      <Cell fill="#ef4444" /><Cell fill="#f97316" /><Cell fill="#f59e0b" /><Cell fill="#3b82f6" /><Cell fill="#10b981" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SECTION 12: FEATURE ADOPTION */}
      <div>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Zap className="h-5 w-5 text-amber-500" /> Adopsi Fitur</h2>
        <Card className="glass border-0">
          <CardHeader><CardTitle className="text-base">Fitur yang Digunakan Lembaga</CardTitle><CardDescription>Berapa banyak lembaga yang mengaktifkan setiap fitur. Data ini menentukan selling point.</CardDescription></CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.featureAdoption.map((f) => {
                const pct = data.totalTenants > 0 ? (f.count / data.totalTenants * 100) : 0
                const featureIcons: Record<string, any> = { ppdb: GraduationCap, wa: MessageSquare, donasi: Heart, kantin: Store, domain: Globe, ai: BrainCircuit }
                const FIcon = featureIcons[f.icon] || Zap
                return (
                  <div key={f.feature} className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:shadow-md transition-shadow">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600"><FIcon className="h-5 w-5" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1"><span className="text-xs font-medium truncate">{f.feature}</span><span className="text-xs font-bold text-primary ml-2">{f.count}</span></div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${pct}%` }} /></div>
                      <p className="text-[9px] text-muted-foreground mt-0.5">{pct.toFixed(1)}% dari {data.totalTenants} lembaga</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
