import { db } from "@/lib/db"
import { unstable_cache } from "next/cache"

export type AdminDashboardStatsDTO = {
  userCount: number
  notifCount: number
  auditCount: number
  subscriptionCount: number
  totalRevenue: number
  totalDue: number
  chartData: Array<{
    bulan: string
    pendapatan: number
  }>
}



export const getAdminStatsCached = unstable_cache(
  async (tenantId: string): Promise<AdminDashboardStatsDTO> => {
    const now = new Date()
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

    const [userCount, notifCount, auditCount, subscriptionCount] = await Promise.all([
      db.tenantUser.count({ where: { tenantId } }),
      db.notification.count({ where: { tenantId, isRead: false } }),
      db.auditLog.count({ where: { tenantId } }),
      db.subscription.count({ where: { tenantId, status: "ACTIVE" } }),
    ])
    
    const totalRevenue = 0
    const totalDue = 0
    const recentPayments: any[] = []

    // Hitung data chart bulanan
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
    const chartData = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const month = d.getMonth()
      const year = d.getFullYear()
      
      const found = (recentPayments as Array<{ month: Date; total: number }>).find((p) => {
        const pd = new Date(p.month)
        return pd.getMonth() === month && pd.getFullYear() === year
      })
      
      chartData.push({
        bulan: monthNames[month],
        pendapatan: found ? Number(found.total) : 0,
      })
    }

    return {
      userCount,
      notifCount,
      auditCount,
      subscriptionCount,
      totalRevenue,
      totalDue,
      chartData,
    }
  },
  ['admin-dashboard-stats'],
  {
    revalidate: 60,
    tags: ['dashboard', 'admin-stats']
  }
)


