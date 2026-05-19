import { db } from "@/lib/db"
import { unstable_cache } from "next/cache"

export type AdminDashboardStatsDTO = {
  userCount: number
  notifCount: number
  auditCount: number
  studentCount: number
  totalRevenue: number
  totalDue: number
  chartData: Array<{
    bulan: string
    pendapatan: number
  }>
}

export type StudentDashboardDTO = {
  student: any
  announcements: any[]
  schedules: any[]
  invoices: any[]
}

export type GtkDashboardDTO = {
  staff: any
  todaySchedules: any[]
  announcements: any[]
}

export const getAdminStatsCached = unstable_cache(
  async (tenantId: string): Promise<AdminDashboardStatsDTO> => {
    const now = new Date()
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

    const [userCount, notifCount, auditCount, studentCount, totalRevenue, totalDue, recentPayments] = await Promise.all([
      db.tenantUser.count({ where: { tenantId } }),
      db.notification.count({ where: { tenantId, isRead: false } }),
      db.auditLog.count({ where: { tenantId } }),
      db.student.count({ where: { tenantId, isActive: true } }),
      // Total pendapatan (semua invoice PAID)
      db.invoice.aggregate({
        where: { tenantId, status: "PAID", deletedAt: null },
        _sum: { amountPaid: true },
      }),
      // Total tunggakan
      db.invoice.aggregate({
        where: { tenantId, status: { in: ["UNPAID", "PARTIAL", "OVERDUE"] }, deletedAt: null },
        _sum: { amountDue: true },
      }),
      // Data pembayaran 6 bulan terakhir untuk chart
      db.invoice.findMany({
        where: {
          tenantId,
          status: "PAID",
          deletedAt: null,
          updatedAt: { gte: sixMonthsAgo },
        },
        select: { amountPaid: true, updatedAt: true },
      }),
    ])

    // Hitung data chart bulanan
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
    const chartData = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const month = d.getMonth()
      const year = d.getFullYear()
      const monthPayments = recentPayments.filter((p: any) => {
        if (!p.updatedAt) return false
        const pd = new Date(p.updatedAt)
        return pd.getMonth() === month && pd.getFullYear() === year
      })
      chartData.push({
        bulan: monthNames[month],
        pendapatan: monthPayments.reduce((sum: number, p: any) => sum + (p.amountPaid || 0), 0),
      })
    }

    return {
      userCount,
      notifCount,
      auditCount,
      studentCount,
      totalRevenue: totalRevenue._sum.amountPaid || 0,
      totalDue: totalDue._sum.amountDue || 0,
      chartData,
    }
  },
  ['admin-dashboard-stats'],
  {
    revalidate: 60,
    tags: ['dashboard', 'admin-stats']
  }
)

export const getStudentDashboardCached = unstable_cache(
  async (userId: string, tenantId: string): Promise<StudentDashboardDTO | null> => {
    const student = await db.student.findFirst({
      where: { userId, tenantId },
      include: {
        classroom: true,
        walletAccount: {
          include: {
            transactions: {
              orderBy: { createdAt: "desc" },
              take: 5
            }
          }
        }
      }
    })

    if (!student) return null

    const announcements = await db.post.findMany({
      where: { tenantId, type: "PENGUMUMAN", status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      take: 2
    })

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dayOfWeek = tomorrow.getDay()

    const schedules = student.classroomId 
      ? await db.schedule.findMany({
          where: { tenantId, classroomId: student.classroomId, dayOfWeek },
          include: { subject: true, staff: { include: { user: true } } },
          orderBy: { startTime: "asc" }
        })
      : []

    const invoices = await db.invoice.findMany({
      where: { tenantId, studentId: student.id, status: "UNPAID" },
      orderBy: { dueDate: "asc" },
      take: 3
    })

    return { student, announcements, schedules, invoices }
  },
  ['student-dashboard-data'],
  {
    revalidate: 60, 
    tags: ['dashboard', 'student-dashboard']
  }
)

export const getGtkDashboardCached = unstable_cache(
  async (userId: string, tenantId: string): Promise<GtkDashboardDTO | null> => {
    const staff = await db.staff.findFirst({
      where: { userId, tenantId },
      include: {
        schedules: {
          include: { subject: true, classroom: true },
          orderBy: { startTime: "asc" }
        }
      }
    })

    if (!staff) return null

    const today = new Date()
    const dayOfWeek = today.getDay()
    
    const todaySchedules = staff.schedules.filter(s => s.dayOfWeek === dayOfWeek)

    const announcements = await db.post.findMany({
      where: { tenantId, type: "PENGUMUMAN", status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      take: 2
    })

    return { staff, todaySchedules, announcements }
  },
  ['gtk-dashboard-data'],
  {
    revalidate: 60,
    tags: ['dashboard', 'gtk-dashboard']
  }
)
