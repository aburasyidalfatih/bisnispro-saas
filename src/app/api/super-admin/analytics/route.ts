import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // ============================================
    // SECTION 1: Summary Cards (parallel queries)
    // ============================================
    const [
      onlineUsersRaw,
      totalTenants,
      activeTenants,
      totalUsers,
      loginsToday,
    ] = await Promise.all([
      // Online = users who logged in within last 15 minutes
      db.auditLog.findMany({
        where: { action: "USER_LOGIN", createdAt: { gte: fifteenMinutesAgo } },
        select: { userId: true, tenantId: true },
      }),
      db.tenant.count(),
      db.tenant.count({ where: { isActive: true } }),
      db.user.count({ where: { isSuperAdmin: false } }),
      db.auditLog.count({ where: { action: "USER_LOGIN", createdAt: { gte: startOfToday } } }),
    ])

    // Deduplicate online users
    const onlineUserIds = [...new Set(onlineUsersRaw.map(u => u.userId).filter(Boolean))]

    // Classify online users by role
    let onlineStaff = 0
    let onlineParents = 0
    if (onlineUserIds.length > 0) {
      const tenantUsers = await db.tenantUser.findMany({
        where: { userId: { in: onlineUserIds as string[] } },
        select: { userId: true, role: true },
      })
      const roleMap = new Map<string, string>()
      tenantUsers.forEach(tu => {
        // Keep the "highest" role per user
        const existing = roleMap.get(tu.userId)
        if (!existing || ['owner', 'admin', 'guru', 'operator'].includes(tu.role)) {
          roleMap.set(tu.userId, tu.role)
        }
      })
      roleMap.forEach((role) => {
        if (['owner', 'admin', 'guru', 'operator', 'teacher'].includes(role)) {
          onlineStaff++
        } else if (['orangtua', 'siswa'].includes(role)) {
          onlineParents++
        }
      })
    }

    // ============================================
    // SECTION 2: Content Activity (parallel)
    // ============================================
    const [
      totalPosts,
      totalAnnouncements,
      totalBlogGuru,
      totalEvents,
      totalAchievements,
      totalDocuments,
      totalWaMessages,
      totalStudents,
      totalStaff,
      totalClassrooms,
      totalSubjects,
    ] = await Promise.all([
      db.post.count({ where: { status: "PUBLISHED", deletedAt: null } }),
      db.post.count({ where: { type: "PENGUMUMAN", status: "PUBLISHED", deletedAt: null } }),
      db.post.count({ where: { type: "BLOG_GURU", status: "PUBLISHED", deletedAt: null } }),
      db.event.count(),
      db.achievement.count(),
      db.document.count(),
      db.waQueueLog.count({ where: { status: "SENT" } }),
      db.student.count({ where: { isActive: true, deletedAt: null } }),
      db.staff.count({ where: { deletedAt: null } }),
      db.classroom.count({ where: { isActive: true } }),
      db.subject.count({ where: { isActive: true } }),
    ])

    // ============================================
    // SECTION 3a: Login Trend (7 Days)
    // ============================================
    const loginLogs7Days = await db.auditLog.findMany({
      where: { action: "USER_LOGIN", createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    })
    const loginTrend7Days = buildDailyTrend(loginLogs7Days.map(l => l.createdAt), 7)

    // ============================================
    // SECTION 3b: Content Trend (30 Days)
    // ============================================
    const recentPosts = await db.post.findMany({
      where: { createdAt: { gte: thirtyDaysAgo }, deletedAt: null },
      select: { createdAt: true },
    })
    const contentTrend30Days = buildWeeklyTrend(recentPosts.map(p => p.createdAt), 4)

    // ============================================
    // SECTION 3c: Plan Breakdown
    // ============================================
    const planGroups = await db.tenant.groupBy({
      by: ['plan'],
      _count: { id: true },
    })
    const planBreakdown = planGroups.map(g => ({
      name: g.plan.toUpperCase(),
      value: g._count.id,
    }))

    // ============================================
    // SECTION 3d: Top 10 Active Tenants (this month)
    // ============================================
    const loginsByTenant = await db.auditLog.groupBy({
      by: ['tenantId'],
      where: { action: "USER_LOGIN", createdAt: { gte: startOfMonth }, tenantId: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    })

    let topActiveTenants: { name: string; logins: number }[] = []
    if (loginsByTenant.length > 0) {
      const tenantIds = loginsByTenant.map(l => l.tenantId).filter(Boolean) as string[]
      const tenantNames = await db.tenant.findMany({
        where: { id: { in: tenantIds } },
        select: { id: true, name: true },
      })
      const nameMap = new Map(tenantNames.map(t => [t.id, t.name]))
      topActiveTenants = loginsByTenant.map(l => ({
        name: nameMap.get(l.tenantId!) || 'Unknown',
        logins: l._count.id,
      }))
    }

    // ============================================
    // SECTION 3e: School Status Breakdown (Negeri vs Swasta)
    // ============================================
    const schoolStatusGroups = await db.tenantApplication.groupBy({
      by: ['schoolStatus'],
      _count: { id: true },
    })
    const schoolStatusBreakdown = schoolStatusGroups.map(g => ({
      name: g.schoolStatus || 'TIDAK DIKETAHUI',
      value: g._count.id,
    }))

    // ============================================
    // SECTION 3f: Monthly Growth (6 months)
    // ============================================
    const recentApplications = await db.tenantApplication.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    })
    const monthlyGrowth = recentApplications.reduce((acc: Record<string, number>, app) => {
      const month = app.createdAt.toLocaleString('id-ID', { month: 'short', year: 'numeric' })
      acc[month] = (acc[month] || 0) + 1
      return acc
    }, {})

    // ============================================
    // SECTION 4: Tenant Activity Table (Top 50 by login)
    // ============================================
    const allTenants = await db.tenant.findMany({
      select: {
        id: true,
        name: true,
        plan: true,
        isActive: true,
        lastActiveAt: true,
        _count: {
          select: {
            students: { where: { isActive: true, deletedAt: null } },
            staff: { where: { deletedAt: null } },
            posts: { where: { deletedAt: null } },
          }
        }
      },
      orderBy: { lastActiveAt: 'desc' },
      take: 50,
    })

    // Get login counts per tenant for this month
    const tenantLoginCounts = await db.auditLog.groupBy({
      by: ['tenantId'],
      where: {
        action: "USER_LOGIN",
        createdAt: { gte: startOfMonth },
        tenantId: { in: allTenants.map(t => t.id) },
      },
      _count: { id: true },
    })
    const tenantLoginMap = new Map(tenantLoginCounts.map(l => [l.tenantId, l._count.id]))

    const tenantActivity = allTenants.map(t => ({
      id: t.id,
      name: t.name,
      plan: t.plan,
      studentCount: t._count.students,
      staffCount: t._count.staff,
      postCount: t._count.posts,
      loginCount: tenantLoginMap.get(t.id) || 0,
      lastActiveAt: t.lastActiveAt,
      isActive: t.isActive,
    }))

    // ============================================
    // SECTION 5: PPDB Insights
    // ============================================
    const [totalPendaftar, ppdbStatusGroups, activePpdbPeriods] = await Promise.all([
      db.pendaftarPpdb.count(),
      db.pendaftarPpdb.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      db.periodePpdb.count({ where: { isActive: true } }),
    ])

    // ============================================
    // SECTION 6: Finance Insights
    // ============================================
    const [donationsAgg, activeCampaigns, unpaidInvoices] = await Promise.all([
      db.donation.aggregate({
        where: { status: "PAID" },
        _sum: { amount: true },
      }),
      db.donationCampaign.count({ where: { isActive: true, deletedAt: null } }),
      db.invoice.count({ where: { status: "UNPAID", deletedAt: null } }),
    ])

    // ============================================
    // SECTION: Position Breakdown (dari versi lama)
    // ============================================
    const positionGroups = await db.tenantApplication.groupBy({
      by: ['adminPosition'],
      _count: { id: true },
    })

    return NextResponse.json({
      // Section 1
      onlineUsers: onlineUserIds.length,
      onlineStaff,
      onlineParents,
      totalTenants,
      activeTenants,
      totalUsers,
      loginsToday,

      // Section 2
      contentStats: {
        totalPosts,
        totalAnnouncements,
        totalBlogGuru,
        totalEvents,
        totalAchievements,
        totalDocuments,
        totalWaMessages,
        totalStudents,
        totalStaff,
        totalClassrooms,
        totalSubjects,
      },

      // Section 3
      loginTrend7Days,
      contentTrend30Days,
      planBreakdown,
      topActiveTenants,
      schoolStatusBreakdown,
      monthlyGrowth: Object.entries(monthlyGrowth).map(([month, count]) => ({ month, count })),
      positionBreakdown: positionGroups
        .map(g => ({ name: g.adminPosition || 'Lainnya', value: g._count.id }))
        .sort((a, b) => b.value - a.value),

      // Section 4
      tenantActivity,

      // Section 5
      ppdbStats: {
        totalPendaftar,
        statusBreakdown: ppdbStatusGroups.map(g => ({
          name: g.status,
          value: g._count.id,
        })),
        activePeriods: activePpdbPeriods,
      },

      // Section 6
      financeStats: {
        totalDonations: donationsAgg._sum.amount || 0,
        activeCampaigns,
        unpaidInvoices,
      },
    })
  } catch (error: any) {
    console.error("Analytics Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// ============================================
// Helper: Build daily trend for last N days
// ============================================
function buildDailyTrend(dates: Date[], days: number) {
  const now = new Date()
  const result: { date: string; count: number }[] = []

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dateStr = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
    result.push({ date: dateStr, count: 0 })
  }

  dates.forEach(date => {
    const dateStr = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
    const found = result.find(r => r.date === dateStr)
    if (found) found.count++
  })

  return result
}

// ============================================
// Helper: Build weekly trend for last N weeks
// ============================================
function buildWeeklyTrend(dates: Date[], weeks: number) {
  const now = new Date()
  const result: { week: string; count: number }[] = []

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(now)
    weekStart.setDate(weekStart.getDate() - i * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    const label = `${weekStart.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} - ${weekEnd.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}`
    result.push({ week: label, count: 0 })
  }

  dates.forEach(date => {
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    const weekIndex = weeks - 1 - Math.floor(diffDays / 7)
    if (weekIndex >= 0 && weekIndex < result.length) {
      result[weekIndex].count++
    }
  })

  return result
}
