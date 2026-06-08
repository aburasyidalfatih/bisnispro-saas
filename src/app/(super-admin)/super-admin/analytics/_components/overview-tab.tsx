import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Users, GraduationCap, Building2, TrendingUp,
  Wifi, UserCheck, BookOpen, Megaphone, CalendarDays, Trophy,
  FileText, MessageSquare, School, Layers, BookMarked,
} from "lucide-react"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from "recharts"
import { AnalyticsData, COLORS, PLAN_COLORS } from "./types"
import { SummaryCard, MiniStat } from "./shared-components"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"

export function OverviewTab() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/super-admin/analytics?tab=overview")
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

  if (!data || !data.positionBreakdown) return <div>Gagal memuat data overview.</div>
  // Process position chart
  const sortedPositions = [...data.positionBreakdown].sort((a, b) => b.value - a.value)
  const topPositions = sortedPositions.slice(0, 6).map(p => ({
    name: p.name.length > 15 ? p.name.substring(0, 15) + "..." : p.name,
    value: p.value
  }))
  const othersValue = sortedPositions.slice(6).reduce((acc, curr) => acc + curr.value, 0)
  if (othersValue > 0) topPositions.push({ name: "Lainnya", value: othersValue })

  return (
    <div className="space-y-8 mt-6">
      {/* SECTION 1: LIVE SUMMARY  */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-7">
        <SummaryCard icon={Wifi} label="Online Saat Ini" value={data.onlineUsers} color="emerald" pulse />
        <SummaryCard icon={UserCheck} label="Guru/Staff Online" value={data.onlineStaff} color="blue" />
        <SummaryCard icon={Users} label="Ortu/Siswa Online" value={data.onlineParents} color="violet" />
        <SummaryCard icon={Building2} label="Tenant Aktif" value={data.activeTenants} color="primary" subtitle={`/ ${data.totalTenants} total`} />
        <SummaryCard icon={Users} label="Total User" value={data.totalUsers} color="slate" />
        <SummaryCard icon={TrendingUp} label="Login Hari Ini" value={data.loginsToday} color="amber" />
        <SummaryCard icon={MessageSquare} label="WA Terkirim" value={data.contentStats.totalWaMessages} color="green" />
      </div>

      {/* SECTION 2: CONTENT STATS */}
      <div>
        <h2 className="text-base sm:text-lg font-bold mb-3 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" /> Aktivitas Konten Platform
        </h2>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
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

      {/* SECTION 3: CHARTS */}
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
            <div className="h-[220px] sm:h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.loginTrend7Days}>
                  <defs>
                    <linearGradient id="loginGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
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
            <div className="h-[220px] sm:h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.monthlyGrowth}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
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
            <div className="h-[280px] sm:h-[340px] w-full">
              {data.topActiveTenants.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm italic">Belum ada data login bulan ini.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.topActiveTenants} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} stroke="#e5e7eb" />
                    <XAxis type="number" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} width={100} tick={{ fontSize: 9 }} />
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
            <div className="h-[280px] sm:h-[340px] w-full">
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
    </div>
  )
}
