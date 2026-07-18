"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Building2, Users, CreditCard, Activity, TrendingUp, FileText, LogIn, Moon } from "lucide-react"
import Link from "next/link"
import { SystemHealth } from "./_components/SystemHealth"
import { TenantMap } from "./_components/TenantMap"
import { TenantLeaderboard } from "./_components/TenantLeaderboard"
import { SecurityLogs } from "./_components/SecurityLogs"

interface Stats {
  tenantCount: number
  userCount: number
  activeTenants: number
  totalRevenue: number
  recentPayments: number
  applicationCount: number
  loginHariIni: number
  dormantCount: number
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch("/api/super-admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
  }, [])

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n)

  const cards = [
    { label: "Total Lembaga", value: stats?.tenantCount ?? "—", icon: Building2, gradient: "from-blue-500/10 to-cyan-500/10", iconColor: "text-blue-600 dark:text-blue-400", href: "/super-admin/tenants" },
    { label: "Total Pengguna", value: stats?.userCount ?? "—", icon: Users, gradient: "from-emerald-500/10 to-teal-500/10", iconColor: "text-emerald-600 dark:text-emerald-400", href: "/super-admin/users" },
    { label: "Lembaga Aktif", value: stats?.activeTenants ?? "—", icon: Activity, gradient: "from-violet-500/10 to-purple-500/10", iconColor: "text-violet-600 dark:text-violet-400", href: "/super-admin/tenants" },
    { label: "Total Pengajuan", value: stats?.applicationCount ?? "—", icon: FileText, gradient: "from-rose-500/10 to-pink-500/10", iconColor: "text-rose-600 dark:text-rose-400", href: "/super-admin/applications" },
    { label: "Sekolah Belum Login", value: stats?.dormantCount ?? "—", icon: Moon, gradient: "from-orange-500/10 to-red-500/10", iconColor: "text-orange-600 dark:text-orange-400", href: "/super-admin/dormant" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Super Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm">Kelola dan pantau seluruh platform SchoolPro</p>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="glass border-0 hover-lift cursor-pointer h-full">
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
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2 h-full">
          <TenantMap />
        </div>
        <div className="h-[400px] sm:h-[580px] lg:h-auto">
          <TenantLeaderboard />
        </div>
      </div>

      <SystemHealth />
      
      <SecurityLogs />
    </div>
  )
}
