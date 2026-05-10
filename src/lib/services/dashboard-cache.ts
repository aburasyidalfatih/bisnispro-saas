import { db } from "@/lib/db"
import { unstable_cache } from "next/cache"

/**
 * Optimasi Caching untuk Dashboard (Fase 3)
 * Cache selama 60 detik (1 menit) atau sesuai kebutuhan.
 * Tags memungkinkan invalidasi cache (revalidateTag) saat ada aksi mutasi.
 */

// 1. Cache untuk Admin/Tenant Stats
export const getAdminStatsCached = unstable_cache(
  async (tenantId: string) => {
    const [userCount, notifCount, auditCount] = await Promise.all([
      db.tenantUser.count({ where: { tenantId } }),
      db.notification.count({ where: { tenantId, isRead: false } }),
      db.auditLog.count({ where: { tenantId } }),
    ])
    return { userCount, notifCount, auditCount }
  },
  ['admin-dashboard-stats'],
  {
    revalidate: 60, // revalidate every 60 seconds
    tags: ['dashboard', 'admin-stats']
  }
)

// 2. Cache untuk Siswa Dashboard
export const getStudentDashboardCached = unstable_cache(
  async (userId: string, tenantId: string) => {
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
    const dayOfWeek = tomorrow.getDay() // 0 = Minggu, 1 = Senin, dst.

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

// 3. Cache untuk GTK Dashboard
export const getGtkDashboardCached = unstable_cache(
  async (userId: string, tenantId: string) => {
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
    
    // Jadwal hari ini
    const todaySchedules = staff.schedules.filter(s => s.dayOfWeek === dayOfWeek)

    // Pengumuman
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
