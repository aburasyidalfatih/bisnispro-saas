"use client"

import { useEffect, useState } from"react"
import { useSession } from"next-auth/react"
import { useRouter } from"next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card"
import { Users, CreditCard, Bell, BarChart3, TrendingUp, GraduationCap, AlertTriangle } from"lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart,
} from"recharts"


export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<any>(null)
  const [tenantId, setTenantId] = useState<string | null>(session?.user?.tenants?.[0]?.id || null)

  // Resolve tenantId — fallback ke impersonate cookie
  useEffect(() => {
    const match = typeof document !== "undefined" ? document.cookie.match(/impersonate-tenant=([^;]+)/) : null
    const impersonatedSlug = match?.[1]
    
    if (impersonatedSlug) {
      fetch(`/api/tenant/by-slug?slug=${impersonatedSlug}`)
        .then((r) => r.json())
        .then((data) => { if (data.id) setTenantId(data.id) })
        .catch(() => {})
      return
    }

    const sessionTenantId = session?.user?.tenants?.[0]?.id
    if (sessionTenantId) { setTenantId(sessionTenantId) }
  }, [session?.user?.tenants])

  useEffect(() => {
    if (!tenantId) return
    fetch(`/api/tenant/stats?tenantId=${tenantId}`)
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
  }, [tenantId])

  const chartData = stats?.chartData || []

  const statCards = [
    { label:"Total Klien Aktif", value: stats?.studentCount ??"—", icon: GraduationCap, gradient:"from-blue-500/10 to-cyan-500/10", iconColor:"text-blue-600 dark:text-blue-400" },
    { label:"Pendapatan", value: stats?.totalRevenue ? `Rp ${stats.totalRevenue.toLocaleString("id-ID")}` :"Rp 0", icon: CreditCard, gradient:"from-emerald-500/10 to-teal-500/10", iconColor:"text-emerald-600 dark:text-emerald-400" },
    { label:"Tunggakan", value: stats?.totalDue ? `Rp ${stats.totalDue.toLocaleString("id-ID")}` :"Rp 0", icon: AlertTriangle, gradient:"from-amber-500/10 to-orange-500/10", iconColor:"text-amber-600 dark:text-amber-400" },
    { label:"Total Pengguna", value: stats?.userCount ??"—", icon: Users, gradient:"from-violet-500/10 to-purple-500/10", iconColor:"text-violet-600 dark:text-violet-400" },
  ]

  const currentTenantSlug = session?.user?.tenants?.[0]?.slug
  const currentTenant = session?.user?.tenants?.find((t: any) => t.slug === currentTenantSlug) || session?.user?.tenants?.[0]
  const currentRole = currentTenant?.role ||"orangtua"
  
  const isImpersonatingUser = typeof document !=="undefined" && document.cookie.includes("impersonate-user=")
  const isImpersonatingTenant = typeof document !=="undefined" && document.cookie.includes("impersonate-tenant=")
  const isAdminRole = !isImpersonatingUser && (currentRole ==="owner" || currentRole ==="admin" || (session?.user?.isSuperAdmin && isImpersonatingTenant))

  const router = useRouter()

  const currentPlan = currentTenant?.plan ||"free"

  useEffect(() => {
    if (!isAdminRole) {
      if (currentRole ==="staf") {
        router.replace("/panel-gtk")
      } else if (currentRole ==="klien") {
        router.replace("/klien")
      } else {
        router.replace("/ortu")
      }
    } else if (currentPlan ==="free") {
      router.replace("/admin/website")
    }
  }, [isAdminRole, router, currentRole, currentPlan])

  if (!isAdminRole) {
    return null
  }

  const formatCurrency = (value: number) => {
    if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}jt`
    if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}rb`
    return `Rp ${value}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Selamat datang, {session?.user?.name} 👋
        </h1>
        <p className="text-muted-foreground mt-1">Berikut ringkasan aktivitas bisnis Anda.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="glass hover-lift border-0">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient}`}>
                  <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass border-0">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Pendapatan Bulanan</CardTitle>
              <span className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-2 py-1">6 bulan terakhir</span>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <defs>
                  <linearGradient id="gradientPendapatan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(250, 70%, 58%)" stopOpacity={1} />
                    <stop offset="100%" stopColor="hsl(280, 60%, 55%)" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" vertical={false} />
                <XAxis dataKey="bulan" className="text-xs" axisLine={false} tickLine={false} />
                <YAxis className="text-xs" axisLine={false} tickLine={false} tickFormatter={formatCurrency} />
                <Tooltip
                  contentStyle={{ borderRadius:"12px", border:"none", boxShadow:"0 8px 32px rgba(0,0,0,0.1)" }}
                  formatter={(value: any) => [`Rp ${value.toLocaleString("id-ID")}`,"Pendapatan"]}
                />
                <Bar dataKey="pendapatan" fill="url(#gradientPendapatan)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass border-0">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Ringkasan Aktivitas</CardTitle>
              <span className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-2 py-1">Real-time</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 pt-4">
              {[
                { label:"Notifikasi Belum Dibaca", value: stats?.notifCount ?? 0, icon: Bell, color:"text-amber-600 bg-amber-500/10" },
                { label:"Aktivitas Tercatat", value: stats?.auditCount ?? 0, icon: BarChart3, color:"text-violet-600 bg-violet-500/10" },
                { label:"Total Klien Aktif", value: stats?.studentCount ?? 0, icon: GraduationCap, color:"text-blue-600 bg-blue-500/10" },
                { label:"Total Pengguna Sistem", value: stats?.userCount ?? 0, icon: Users, color:"text-emerald-600 bg-emerald-500/10" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${item.color}`}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <span className="text-xl font-black">{typeof item.value ==="number" ? item.value.toLocaleString("id-ID") : item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


