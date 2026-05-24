"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Users, GraduationCap, Building2, TrendingUp, Loader2,
  Wifi, UserCheck, BookOpen, Megaphone, CalendarDays, Trophy,
  FileText, MessageSquare, School, Layers, BookMarked,
  Search, ArrowUpDown, Heart, Receipt, Timer,
  Eye, Globe, Smartphone, Monitor, Tablet,
  DollarSign, Target, UserX, UserPlus, MapPin,
  Zap, ShieldCheck, Star, ArrowUpRight, ArrowDownRight,
  Store, BrainCircuit,
} from "lucide-react"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from "recharts"
import { cn } from "@/lib/utils"

interface AnalyticsData {
  onlineUsers: number
  onlineStaff: number
  onlineParents: number
  totalTenants: number
  activeTenants: number
  totalUsers: number
  loginsToday: number

  contentStats: {
    totalPosts: number
    totalAnnouncements: number
    totalBlogGuru: number
    totalEvents: number
    totalAchievements: number
    totalDocuments: number
    totalWaMessages: number
    totalStudents: number
    totalStaff: number
    totalClassrooms: number
    totalSubjects: number
  }

  loginTrend7Days: { date: string; count: number }[]
  contentTrend30Days: { week: string; count: number }[]
  planBreakdown: { name: string; value: number }[]
  topActiveTenants: { name: string; logins: number }[]
  schoolStatusBreakdown: { name: string; value: number }[]
  monthlyGrowth: { month: string; count: number }[]
  positionBreakdown: { name: string; value: number }[]

  tenantActivity: {
    id: string
    name: string
    plan: string
    studentCount: number
    staffCount: number
    postCount: number
    loginCount: number
    lastActiveAt: string
    isActive: boolean
  }[]

  ppdbStats: {
    totalPendaftar: number
    statusBreakdown: { name: string; value: number }[]
    activePeriods: number
  }

  financeStats: {
    totalDonations: number
    activeCampaigns: number
    unpaidInvoices: number
  }

  visitorStats: {
    totalPageViews: number
    uniqueVisitors: number
    todayPageViews: number
    todayUniqueVisitors: number
    sources: { name: string; views: number }[]
    mediums: { name: string; views: number }[]
    topPages: { path: string; views: number }[]
    devices: { name: string; views: number }[]
    browsers: { name: string; views: number }[]
    trend7Days: { date: string; views: number; visitors: number }[]
    topTrafficTenants: { name: string; views: number }[]
  }

  revenueStats: {
    totalRevenue: number
    thisMonthRevenue: number
    lastMonthRevenue: number
    revenueGrowth: number
    arpu: number
    revenueTrend: { month: string; amount: number }[]
    revenuePerPlan: { name: string; amount: number }[]
    payingTenantCount: number
  }

  conversionFunnel: {
    totalApplications: number
    approvedApplications: number
    rejectedApplications: number
    pendingApplications: number
    approvalRate: number
    freeTenants: number
    liteTenants: number
    proTenants: number
    upgradeRate: number
  }

  retentionStats: {
    activeRecently: number
    inactive30Days: number
    inactive60Days: number
    inactive90Days: number
    retentionActive: number
    retentionAtRisk: number
    retentionChurned: number
    expiredNotRenewed: number
    churnRate: number
  }

  affiliateStats: {
    totalAffiliates: number
    activeAffiliates: number
    totalClicks: number
    totalCommissionsPaid: number
    pendingCommissions: number
    affiliateApplications: number
    conversionRate: number
    topAffiliates: { name: string; code: string; earnings: number; clicks: number; referrals: number }[]
  }

  featureAdoption: { feature: string; count: number; icon: string }[]

  geoStats: {
    provinces: { name: string; value: number }[]
    topRegencies: { name: string; value: number }[]
    totalProvinces: number
  }

  engagementStats: {
    avgTotalScore: number
    avgScorePerPlan: { plan: string; avgScore: number; count: number }[]
    scoreBrackets: { name: string; value: number }[]
    totalScored: number
  }
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b']
const PLAN_COLORS: Record<string, string> = { FREE: '#94a3b8', LITE: '#3b82f6', PRO: '#8b5cf6' }

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tableSearch, setTableSearch] = useState("")
  const [sortColumn, setSortColumn] = useState<string>("loginCount")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  useEffect(() => {
    fetch("/api/super-admin/analytics")
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSort = (col: string) => {
    if (sortColumn === col) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(col)
      setSortOrder("desc")
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!data) return <div>Gagal memuat data analitik.</div>

  // Sorted & filtered tenants
  const filteredTenants = data.tenantActivity
    .filter(t => t.name.toLowerCase().includes(tableSearch.toLowerCase()))
    .sort((a, b) => {
      const valA = (a as any)[sortColumn] ?? 0
      const valB = (b as any)[sortColumn] ?? 0
      if (typeof valA === 'string') return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA)
      return sortOrder === "asc" ? valA - valB : valB - valA
    })

  // Process position chart
  const sortedPositions = [...data.positionBreakdown].sort((a, b) => b.value - a.value)
  const topPositions = sortedPositions.slice(0, 6).map(p => ({
    name: p.name.length > 15 ? p.name.substring(0, 15) + "..." : p.name,
    value: p.value
  }))
  const othersValue = sortedPositions.slice(6).reduce((acc, curr) => acc + curr.value, 0)
  if (othersValue > 0) topPositions.push({ name: "Lainnya", value: othersValue })

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analitik Platform</h1>
        <p className="text-muted-foreground mt-1">
          Pantau aktivitas real-time, konten, dan pertumbuhan seluruh tenant di platform.
        </p>
      </div>

      {/* ========================= */}
      {/* SECTION 1: LIVE SUMMARY  */}
      {/* ========================= */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
        <SummaryCard icon={Wifi} label="Online Saat Ini" value={data.onlineUsers} color="emerald" pulse />
        <SummaryCard icon={UserCheck} label="Guru/Staff Online" value={data.onlineStaff} color="blue" />
        <SummaryCard icon={Users} label="Ortu/Siswa Online" value={data.onlineParents} color="violet" />
        <SummaryCard icon={Building2} label="Tenant Aktif" value={data.activeTenants} color="primary" subtitle={`/ ${data.totalTenants} total`} />
        <SummaryCard icon={Users} label="Total User" value={data.totalUsers} color="slate" />
        <SummaryCard icon={TrendingUp} label="Login Hari Ini" value={data.loginsToday} color="amber" />
        <SummaryCard icon={MessageSquare} label="WA Terkirim" value={data.contentStats.totalWaMessages} color="green" />
      </div>

      {/* ========================= */}
      {/* SECTION 2: CONTENT STATS */}
      {/* ========================= */}
      <div>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" /> Aktivitas Konten Platform
        </h2>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
          <MiniStat icon={BookOpen} label="Artikel Published" value={data.contentStats.totalPosts} />
          <MiniStat icon={Megaphone} label="Pengumuman" value={data.contentStats.totalAnnouncements} />
          <MiniStat icon={BookMarked} label="Blog Guru" value={data.contentStats.totalBlogGuru} />
          <MiniStat icon={CalendarDays} label="Event/Agenda" value={data.contentStats.totalEvents} />
          <MiniStat icon={Trophy} label="Prestasi" value={data.contentStats.totalAchievements} />
          <MiniStat icon={FileText} label="Dokumen" value={data.contentStats.totalDocuments} />
          <MiniStat icon={GraduationCap} label="Siswa Aktif" value={data.contentStats.totalStudents} />
          <MiniStat icon={Users} label="GTK/Staff" value={data.contentStats.totalStaff} />
          <MiniStat icon={Layers} label="Kelas" value={data.contentStats.totalClassrooms} />
          <MiniStat icon={BookMarked} label="Mata Pelajaran" value={data.contentStats.totalSubjects} />
        </div>
      </div>

      {/* ========================= */}
      {/* SECTION 3: CHARTS        */}
      {/* ========================= */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Login Trend 7 Days */}
        <Card className="glass border-0 md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5 text-blue-500" /> Tren Login Harian (7 Hari Terakhir)
            </CardTitle>
            <CardDescription>Jumlah login unik per hari dari seluruh tenant.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.loginTrend7Days}>
                  <defs>
                    <linearGradient id="loginGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="count" name="Login" stroke="#3b82f6" strokeWidth={3} fill="url(#loginGrad)" dot={{ r: 4, fill: "#3b82f6" }} activeDot={{ r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tren Pendaftaran 6 Bulan */}
        <Card className="glass border-0 md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <School className="h-5 w-5 text-primary" /> Tren Pendaftaran Sekolah (6 Bulan Terakhir)
            </CardTitle>
            <CardDescription>Grafik jumlah lembaga baru yang mendaftar ke platform per bulan.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.monthlyGrowth}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Line type="monotone" dataKey="count" name="Sekolah Baru" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: "#8b5cf6" }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top 10 Tenant Aktif */}
        <Card className="glass border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5 text-emerald-500" /> Top 10 Tenant Paling Aktif
            </CardTitle>
            <CardDescription>Berdasarkan total login bulan ini.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[340px] w-full">
              {data.topActiveTenants.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm italic">Belum ada data login bulan ini.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.topActiveTenants} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} stroke="#e5e7eb" />
                    <XAxis type="number" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} width={120} tick={{ fontSize: 10 }} />
                    <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="logins" name="Login" fill="#10b981" radius={[0, 6, 6, 0]} barSize={20}>
                      {data.topActiveTenants.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Distribusi Paket */}
        <Card className="glass border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="h-5 w-5 text-violet-500" /> Distribusi Paket Berlangganan
            </CardTitle>
            <CardDescription>Proporsi tenant berdasarkan tipe paket saat ini.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-[340px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.planBreakdown}
                    cx="50%"
                    cy="45%"
                    innerRadius={70}
                    outerRadius={105}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {data.planBreakdown.map((entry) => (
                      <Cell key={entry.name} fill={PLAN_COLORS[entry.name] || '#64748b'} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Penetrasi Pasar */}
        <Card className="glass border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-5 w-5 text-emerald-600" /> Penetrasi Pasar
            </CardTitle>
            <CardDescription>Negeri vs Swasta dari total lembaga yang mendaftar.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.schoolStatusBreakdown} cx="50%" cy="45%" innerRadius={70} outerRadius={105} paddingAngle={5} dataKey="value">
                    {data.schoolStatusBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Profil Pendaftar */}
        <Card className="glass border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-purple-600" /> Profil Pembuat Akun
            </CardTitle>
            <CardDescription>Jabatan orang yang mendaftarkan sekolah.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topPositions} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} stroke="#e5e7eb" />
                  <XAxis type="number" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} width={100} />
                  <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="value" name="Jumlah" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={24}>
                    {topPositions.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ======================================== */}
      {/* SECTION 5 & 6: PPDB + FINANCE INSIGHTS  */}
      {/* ======================================== */}
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

      {/* ============================================ */}
      {/* SECTION 7: VISITOR TRACKING                  */}
      {/* ============================================ */}
      <div>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Globe className="h-5 w-5 text-cyan-500" /> Analitik Pengunjung Website (30 Hari)
        </h2>

        {/* Visitor Summary Cards */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-6">
          <SummaryCard icon={Eye} label="Total Tampilan" value={data.visitorStats.totalPageViews} color="blue" />
          <SummaryCard icon={Users} label="Pengunjung Unik" value={data.visitorStats.uniqueVisitors} color="emerald" />
          <SummaryCard icon={TrendingUp} label="Tampilan Hari Ini" value={data.visitorStats.todayPageViews} color="violet" subtitle={`${data.visitorStats.todayUniqueVisitors} unik`} />
          <SummaryCard icon={Globe} label="Rata-rata/Hari" value={data.visitorStats.totalPageViews > 0 ? Math.round(data.visitorStats.totalPageViews / 30) : 0} color="amber" />
        </div>

        {/* Visitor Trend Chart */}
        <Card className="glass border-0 mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-cyan-500" /> Tren Pengunjung Website (7 Hari)
            </CardTitle>
            <CardDescription>Tampilan halaman dan pengunjung unik seluruh tenant.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              {data.visitorStats.trend7Days.every(d => d.views === 0) ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm italic">
                  Belum ada data pengunjung. Data akan muncul setelah website tenant dikunjungi.
                </div>
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
                    <Legend verticalAlign="top" height={36} />
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
              <CardDescription>Dari mana pengunjung website tenant berasal.</CardDescription>
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

        {/* Top Tenant by Traffic */}
        {data.visitorStats.topTrafficTenants.length > 0 && (
          <Card className="glass border-0 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-5 w-5 text-cyan-500" /> Top 10 Tenant Website Terbanyak Dikunjungi
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

      {/* ======================================== */}
      {/* SECTION 4: TENANT ACTIVITY TABLE         */}
      {/* ======================================== */}
      <Card className="glass border-0 shadow-xl shadow-primary/5">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base">Detail Aktivitas Per-Tenant</CardTitle>
              <CardDescription>Top 50 tenant berdasarkan aktivitas login terbaru.</CardDescription>
            </div>
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari tenant..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="rounded-xl pl-9 h-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-3 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Sekolah</th>
                  <th className="px-3 py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">Paket</th>
                  <SortableHeader label="Siswa" column="studentCount" current={sortColumn} order={sortOrder} onSort={handleSort} />
                  <SortableHeader label="GTK" column="staffCount" current={sortColumn} order={sortOrder} onSort={handleSort} />
                  <SortableHeader label="Post" column="postCount" current={sortColumn} order={sortOrder} onSort={handleSort} />
                  <SortableHeader label="Login Bulan Ini" column="loginCount" current={sortColumn} order={sortOrder} onSort={handleSort} />
                  <th className="px-3 py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">Terakhir Aktif</th>
                  <th className="px-3 py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-muted-foreground italic">Tidak ada data.</td>
                  </tr>
                ) : (
                  filteredTenants.map(t => (
                    <tr key={t.id} className="hover:bg-muted/20 transition-all">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary text-xs font-bold">
                            {t.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-xs truncate max-w-[180px]">{t.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={cn(
                          "text-[10px] font-bold uppercase rounded-lg px-2 py-1 tracking-tighter",
                          t.plan === 'pro' ? 'bg-primary/10 text-primary' :
                          t.plan === 'lite' ? 'bg-blue-500/10 text-blue-600' :
                          'bg-muted text-muted-foreground'
                        )}>
                          {t.plan}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center font-bold text-xs">{t.studentCount}</td>
                      <td className="px-3 py-3 text-center font-bold text-xs">{t.staffCount}</td>
                      <td className="px-3 py-3 text-center font-bold text-xs">{t.postCount}</td>
                      <td className="px-3 py-3 text-center">
                        <span className={cn(
                          "font-bold text-xs",
                          t.loginCount > 0 ? "text-emerald-600" : "text-muted-foreground"
                        )}>
                          {t.loginCount}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center text-[10px] text-muted-foreground">
                        {t.lastActiveAt ? new Date(t.lastActiveAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={cn(
                          "inline-flex items-center gap-1 text-[10px] font-bold uppercase rounded-full px-2 py-0.5",
                          t.isActive ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                        )}>
                          {t.isActive ? "Aktif" : "Mati"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ============================================ */}
      {/* SECTION 8: REVENUE & PENDAPATAN              */}
      {/* ============================================ */}
      <div>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-emerald-500" /> Revenue &amp; Pendapatan
        </h2>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-6">
          <Card className="glass border-0"><CardContent className="p-4"><div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600"><DollarSign className="h-5 w-5" /></div>
            <div><p className="text-[10px] text-muted-foreground font-medium">Total Revenue</p>
            <h3 className="text-lg font-bold">Rp {(data.revenueStats.totalRevenue / 1000).toFixed(0)}K</h3></div>
          </div></CardContent></Card>
          <Card className="glass border-0"><CardContent className="p-4"><div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600"><TrendingUp className="h-5 w-5" /></div>
            <div><p className="text-[10px] text-muted-foreground font-medium">Bulan Ini</p>
            <div className="flex items-baseline gap-1.5">
              <h3 className="text-lg font-bold">Rp {(data.revenueStats.thisMonthRevenue / 1000).toFixed(0)}K</h3>
              {data.revenueStats.revenueGrowth !== 0 && (
                <span className={cn("text-[10px] font-bold flex items-center", data.revenueStats.revenueGrowth > 0 ? "text-emerald-600" : "text-rose-600")}>
                  {data.revenueStats.revenueGrowth > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {Math.abs(data.revenueStats.revenueGrowth).toFixed(0)}%
                </span>
              )}
            </div></div>
          </div></CardContent></Card>
          <Card className="glass border-0"><CardContent className="p-4"><div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600"><Users className="h-5 w-5" /></div>
            <div><p className="text-[10px] text-muted-foreground font-medium">ARPU</p>
            <h3 className="text-lg font-bold">Rp {data.revenueStats.arpu.toLocaleString('id-ID')}</h3></div>
          </div></CardContent></Card>
          <Card className="glass border-0"><CardContent className="p-4"><div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600"><Target className="h-5 w-5" /></div>
            <div><p className="text-[10px] text-muted-foreground font-medium">Tenant Bayar</p>
            <h3 className="text-lg font-bold">{data.revenueStats.payingTenantCount}</h3></div>
          </div></CardContent></Card>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="glass border-0">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-5 w-5 text-emerald-500" /> Tren Pendapatan (6 Bulan)</CardTitle></CardHeader>
            <CardContent><div className="h-[260px] w-full">
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
            </div></CardContent>
          </Card>
          <Card className="glass border-0">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Layers className="h-5 w-5 text-violet-500" /> Revenue per Paket</CardTitle></CardHeader>
            <CardContent><div className="h-[260px] w-full">
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
            </div></CardContent>
          </Card>
        </div>
      </div>

      {/* ============================================ */}
      {/* SECTION 9: CONVERSION FUNNEL                 */}
      {/* ============================================ */}
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

      {/* ============================================ */}
      {/* SECTION 10: RETENTION & CHURN                */}
      {/* ============================================ */}
      <div>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><UserX className="h-5 w-5 text-rose-500" /> Retensi &amp; Churn</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="glass border-0">
            <CardHeader><CardTitle className="text-base">Aktivitas Terakhir</CardTitle><CardDescription>Kapan terakhir tenant login.</CardDescription></CardHeader>
            <CardContent><div className="h-[220px] w-full">
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
                  <Bar dataKey="value" name="Tenant" radius={[6, 6, 0, 0]} barSize={36}>
                    <Cell fill="#10b981" /><Cell fill="#f59e0b" /><Cell fill="#f97316" /><Cell fill="#ef4444" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div></CardContent>
          </Card>
          <Card className="glass border-0">
            <CardHeader><CardTitle className="text-base">Status Retensi</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 rounded-xl border bg-card"><p className="text-3xl font-bold text-rose-600">{data.retentionStats.churnRate}%</p><p className="text-[10px] text-muted-foreground mt-1">Churn Rate</p></div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Aktif</span><span className="font-bold">{data.retentionStats.retentionActive}</span></div>
                <div className="flex items-center justify-between text-sm"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Berisiko</span><span className="font-bold text-amber-600">{data.retentionStats.retentionAtRisk}</span></div>
                <div className="flex items-center justify-between text-sm"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Churned</span><span className="font-bold text-rose-600">{data.retentionStats.retentionChurned}</span></div>
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

      {/* ============================================ */}
      {/* SECTION 11: AFFILIATE PERFORMANCE            */}
      {/* ============================================ */}
      <div>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><UserPlus className="h-5 w-5 text-indigo-500" /> Performa Afiliasi</h2>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-6">
          <SummaryCard icon={Users} label="Total Afiliasi" value={data.affiliateStats.totalAffiliates} color="blue" subtitle={`${data.affiliateStats.activeAffiliates} aktif`} />
          <SummaryCard icon={Eye} label="Total Klik" value={data.affiliateStats.totalClicks} color="violet" />
          <SummaryCard icon={Target} label="Konversi" value={data.affiliateStats.affiliateApplications} color="emerald" subtitle={`${data.affiliateStats.conversionRate}% rate`} />
          <SummaryCard icon={DollarSign} label="Komisi Dibayar" value={data.affiliateStats.totalCommissionsPaid} color="amber" />
        </div>
        {data.affiliateStats.topAffiliates.length > 0 && (
          <Card className="glass border-0">
            <CardHeader><CardTitle className="text-base">Top 5 Afiliasi</CardTitle><CardDescription>Berdasarkan total pendapatan.</CardDescription></CardHeader>
            <CardContent><div className="overflow-x-auto"><table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/30">
                <th className="px-3 py-2 text-left text-xs font-bold text-muted-foreground uppercase">#</th>
                <th className="px-3 py-2 text-left text-xs font-bold text-muted-foreground uppercase">Nama</th>
                <th className="px-3 py-2 text-center text-xs font-bold text-muted-foreground uppercase">Kode</th>
                <th className="px-3 py-2 text-center text-xs font-bold text-muted-foreground uppercase">Klik</th>
                <th className="px-3 py-2 text-center text-xs font-bold text-muted-foreground uppercase">Referral</th>
                <th className="px-3 py-2 text-right text-xs font-bold text-muted-foreground uppercase">Pendapatan</th>
              </tr></thead>
              <tbody>{data.affiliateStats.topAffiliates.map((a, i) => (
                <tr key={a.code} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2.5 font-bold text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-2.5 font-medium">{a.name}</td>
                  <td className="px-3 py-2.5 text-center"><code className="text-xs bg-muted px-2 py-0.5 rounded">{a.code}</code></td>
                  <td className="px-3 py-2.5 text-center">{a.clicks}</td>
                  <td className="px-3 py-2.5 text-center">{a.referrals}</td>
                  <td className="px-3 py-2.5 text-right font-bold text-emerald-600">Rp {a.earnings.toLocaleString('id-ID')}</td>
                </tr>
              ))}</tbody>
            </table></div></CardContent>
          </Card>
        )}
      </div>

      {/* ============================================ */}
      {/* SECTION 12: FEATURE ADOPTION                 */}
      {/* ============================================ */}
      <div>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Zap className="h-5 w-5 text-amber-500" /> Adopsi Fitur</h2>
        <Card className="glass border-0">
          <CardHeader><CardTitle className="text-base">Fitur yang Digunakan Tenant</CardTitle><CardDescription>Berapa banyak tenant yang mengaktifkan setiap fitur. Data ini menentukan selling point.</CardDescription></CardHeader>
          <CardContent><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                    <p className="text-[9px] text-muted-foreground mt-0.5">{pct.toFixed(1)}% dari {data.totalTenants} tenant</p>
                  </div>
                </div>
              )
            })}
          </div></CardContent>
        </Card>
      </div>

      {/* ============================================ */}
      {/* SECTION 13: GEOGRAPHIC DISTRIBUTION          */}
      {/* ============================================ */}
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

      {/* ============================================ */}
      {/* SECTION 14: ENGAGEMENT SCORE                 */}
      {/* ============================================ */}
      <div>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Star className="h-5 w-5 text-yellow-500" /> Skor Engagement Tenant</h2>
        <div className="grid gap-6 md:grid-cols-3">
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
            <CardContent><div className="space-y-4">
              {data.engagementStats.avgScorePerPlan.map(ps => (
                <div key={ps.plan}>
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="outline" className={cn(
                      ps.plan === 'FREE' && 'bg-slate-50 text-slate-600 border-slate-200',
                      ps.plan === 'LITE' && 'bg-blue-50 text-blue-600 border-blue-200',
                      ps.plan === 'PRO' && 'bg-violet-50 text-violet-600 border-violet-200',
                    )}>{ps.plan}</Badge>
                    <span className="text-sm font-bold">{ps.avgScore}/100 <span className="text-[10px] text-muted-foreground font-normal">({ps.count} tenant)</span></span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${ps.avgScore}%`, backgroundColor: ps.plan === 'FREE' ? '#94a3b8' : ps.plan === 'LITE' ? '#3b82f6' : '#8b5cf6' }} />
                  </div>
                </div>
              ))}
            </div></CardContent>
          </Card>
          <Card className="glass border-0">
            <CardHeader><CardTitle className="text-base">Distribusi Skor</CardTitle><CardDescription>Sebaran skor engagement seluruh tenant.</CardDescription></CardHeader>
            <CardContent><div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.engagementStats.scoreBrackets}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={8} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="value" name="Tenant" radius={[6, 6, 0, 0]} barSize={36}>
                    <Cell fill="#ef4444" /><Cell fill="#f97316" /><Cell fill="#f59e0b" /><Cell fill="#3b82f6" /><Cell fill="#10b981" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div></CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Component: Summary Card
// ============================================
function SummaryCard({ icon: Icon, label, value, color, pulse, subtitle }: {
  icon: any; label: string; value: number; color: string; pulse?: boolean; subtitle?: string
}) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-500/10 text-emerald-600',
    blue: 'bg-blue-500/10 text-blue-600',
    violet: 'bg-violet-500/10 text-violet-600',
    primary: 'bg-primary/10 text-primary',
    slate: 'bg-slate-500/10 text-slate-600',
    amber: 'bg-amber-500/10 text-amber-600',
    green: 'bg-green-500/10 text-green-600',
  }

  return (
    <Card className="glass border-0 relative overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", colorMap[color] || colorMap.primary)}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground font-medium leading-tight">{label}</p>
            <div className="flex items-baseline gap-1">
              <h3 className="text-xl font-bold">{value.toLocaleString('id-ID')}</h3>
              {subtitle && <span className="text-[9px] text-muted-foreground">{subtitle}</span>}
            </div>
          </div>
        </div>
        {pulse && value > 0 && (
          <div className="absolute top-3 right-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================
// Component: Mini Stat
// ============================================
function MiniStat({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card p-3 hover:shadow-md transition-shadow">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground truncate">{label}</p>
        <p className="text-sm font-bold">{value.toLocaleString('id-ID')}</p>
      </div>
    </div>
  )
}

// ============================================
// Component: Sortable Table Header
// ============================================
function SortableHeader({ label, column, current, order, onSort }: {
  label: string; column: string; current: string; order: string; onSort: (col: string) => void
}) {
  return (
    <th
      className="px-3 py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => onSort(column)}
    >
      <div className="flex items-center justify-center gap-1">
        {label}
        <ArrowUpDown className={cn("h-3 w-3", current === column ? "text-primary" : "text-muted-foreground/50")} />
      </div>
    </th>
  )
}
