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

    // ============================================
    // SECTION 7: Visitor Tracking (All Tenants)
    // ============================================
    const pageViews30Days = await db.pageView.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: {
        path: true,
        source: true,
        medium: true,
        device: true,
        browser: true,
        ipHash: true,
        sessionId: true,
        tenantId: true,
        createdAt: true,
      },
    })

    const totalPageViews = pageViews30Days.length
    const uniqueVisitors = new Set(pageViews30Days.map(pv => pv.sessionId || pv.ipHash)).size
    const todayPageViews = pageViews30Days.filter(pv => pv.createdAt >= startOfToday).length
    const todayUniqueVisitors = new Set(
      pageViews30Days.filter(pv => pv.createdAt >= startOfToday).map(pv => pv.sessionId || pv.ipHash)
    ).size

    // Traffic sources
    const srcMap = new Map<string, number>()
    pageViews30Days.forEach(pv => {
      const src = pv.source || "direct"
      srcMap.set(src, (srcMap.get(src) || 0) + 1)
    })
    const visitorSources = [...srcMap.entries()]
      .map(([name, views]) => ({ name, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 15)

    // Traffic medium
    const medMap = new Map<string, number>()
    pageViews30Days.forEach(pv => {
      const med = pv.medium || "unknown"
      medMap.set(med, (medMap.get(med) || 0) + 1)
    })
    const visitorMediums = [...medMap.entries()]
      .map(([name, views]) => ({ name, views }))
      .sort((a, b) => b.views - a.views)

    // Top pages
    const pgMap = new Map<string, number>()
    pageViews30Days.forEach(pv => {
      pgMap.set(pv.path, (pgMap.get(pv.path) || 0) + 1)
    })
    const visitorTopPages = [...pgMap.entries()]
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 15)

    // Device breakdown
    const devMap = new Map<string, number>()
    pageViews30Days.forEach(pv => {
      devMap.set(pv.device || "unknown", (devMap.get(pv.device || "unknown") || 0) + 1)
    })
    const visitorDevices = [...devMap.entries()]
      .map(([name, views]) => ({ name, views }))
      .sort((a, b) => b.views - a.views)

    // Browser breakdown
    const brMap = new Map<string, number>()
    pageViews30Days.forEach(pv => {
      brMap.set(pv.browser || "unknown", (brMap.get(pv.browser || "unknown") || 0) + 1)
    })
    const visitorBrowsers = [...brMap.entries()]
      .map(([name, views]) => ({ name, views }))
      .sort((a, b) => b.views - a.views)

    // Daily visitor trend (7 days)
    const visitorTrend7Days = buildDailyTrendWithVisitors(pageViews30Days.filter(pv => pv.createdAt >= sevenDaysAgo), 7)

    // Top 10 tenant by traffic
    const tenantTrafficMap = new Map<string, number>()
    pageViews30Days.forEach(pv => {
      tenantTrafficMap.set(pv.tenantId, (tenantTrafficMap.get(pv.tenantId) || 0) + 1)
    })
    const topTrafficTenantIds = [...tenantTrafficMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
    let topTrafficTenants: { name: string; views: number }[] = []
    if (topTrafficTenantIds.length > 0) {
      const tNames = await db.tenant.findMany({
        where: { id: { in: topTrafficTenantIds.map(t => t[0]) } },
        select: { id: true, name: true },
      })
      const tnMap = new Map(tNames.map(t => [t.id, t.name]))
      topTrafficTenants = topTrafficTenantIds.map(([id, views]) => ({
        name: tnMap.get(id) || 'Unknown',
        views,
      }))
    }

    // ============================================
    // SECTION 8: Revenue & Pendapatan
    // ============================================
    const allPaidPayments = await db.payment.findMany({
      where: { status: "paid", deletedAt: null },
      select: { amount: true, plan: true, paidAt: true, createdAt: true },
    })

    // Revenue per month (last 6 months)
    const revenueTrendMap = new Map<string, number>()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now)
      d.setMonth(d.getMonth() - i)
      const key = d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
      revenueTrendMap.set(key, 0)
    }
    allPaidPayments.forEach(p => {
      const d = p.paidAt || p.createdAt
      const key = d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
      if (revenueTrendMap.has(key)) {
        revenueTrendMap.set(key, (revenueTrendMap.get(key) || 0) + p.amount)
      }
    })
    const revenueTrend = [...revenueTrendMap.entries()].map(([month, amount]) => ({ month, amount }))

    // Revenue per plan
    const revenuePerPlanMap = new Map<string, number>()
    allPaidPayments.forEach(p => {
      const plan = (p.plan || 'unknown').toUpperCase()
      revenuePerPlanMap.set(plan, (revenuePerPlanMap.get(plan) || 0) + p.amount)
    })
    const revenuePerPlan = [...revenuePerPlanMap.entries()]
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)

    // Total revenue & this month revenue
    const totalRevenue = allPaidPayments.reduce((sum, p) => sum + p.amount, 0)
    const thisMonthRevenue = allPaidPayments
      .filter(p => (p.paidAt || p.createdAt) >= startOfMonth)
      .reduce((sum, p) => sum + p.amount, 0)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthRevenue = allPaidPayments
      .filter(p => {
        const d = p.paidAt || p.createdAt
        return d >= lastMonthStart && d < startOfMonth
      })
      .reduce((sum, p) => sum + p.amount, 0)

    // ARPU (Average Revenue Per User = total revenue / paying tenants)
    const payingTenants = await db.payment.groupBy({
      by: ['tenantId'],
      where: { status: "paid", deletedAt: null },
    })
    const arpu = payingTenants.length > 0 ? Math.round(totalRevenue / payingTenants.length) : 0

    // ============================================
    // SECTION 9: Conversion Funnel
    // ============================================
    const [
      totalApplications,
      approvedApplications,
      rejectedApplications,
      pendingApplications,
    ] = await Promise.all([
      db.tenantApplication.count(),
      db.tenantApplication.count({ where: { status: "APPROVED" } }),
      db.tenantApplication.count({ where: { status: "REJECTED" } }),
      db.tenantApplication.count({ where: { status: "PENDING" } }),
    ])

    const [freeTenants, liteTenants, proTenants] = await Promise.all([
      db.tenant.count({ where: { plan: "free" } }),
      db.tenant.count({ where: { plan: "lite" } }),
      db.tenant.count({ where: { plan: "pro" } }),
    ])

    // Upgrade rate: paid tenants / total tenants
    const paidTenantCount = liteTenants + proTenants
    const upgradeRate = totalTenants > 0 ? ((paidTenantCount / totalTenants) * 100) : 0

    // ============================================
    // SECTION 10: Retention & Churn
    // ============================================
    const thirtyDaysAgoDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgoDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
    const ninetyDaysAgoDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    const [
      activeRecently,
      inactive30Days,
      inactive60Days,
      inactive90Days,
      retentionActive,
      retentionAtRisk,
      retentionChurned,
    ] = await Promise.all([
      db.tenant.count({ where: { isActive: true, lastActiveAt: { gte: thirtyDaysAgoDate } } }),
      db.tenant.count({ where: { isActive: true, lastActiveAt: { lt: thirtyDaysAgoDate, gte: sixtyDaysAgoDate } } }),
      db.tenant.count({ where: { isActive: true, lastActiveAt: { lt: sixtyDaysAgoDate, gte: ninetyDaysAgoDate } } }),
      db.tenant.count({ where: { isActive: true, lastActiveAt: { lt: ninetyDaysAgoDate } } }),
      db.tenant.count({ where: { retentionStatus: "ACTIVE" } }),
      db.tenant.count({ where: { retentionStatus: "AT_RISK" } }),
      db.tenant.count({ where: { retentionStatus: "CHURNED" } }),
    ])

    // Expired subscriptions not renewed
    const expiredNotRenewed = await db.subscription.count({
      where: {
        status: "EXPIRED",
        endDate: { lt: now },
      },
    })

    // ============================================
    // SECTION 11: Affiliate Performance
    // ============================================
    const [
      totalAffiliates,
      activeAffiliates,
      totalAffiliateClicks,
      totalCommissionsPaid,
      pendingCommissions,
    ] = await Promise.all([
      db.affiliateProfile.count(),
      db.affiliateProfile.count({ where: { isActive: true } }),
      db.affiliateProfile.aggregate({ _sum: { clicks: true } }),
      db.affiliateCommission.aggregate({
        where: { status: "PAID" },
        _sum: { amount: true },
      }),
      db.affiliateCommission.aggregate({
        where: { status: "PENDING" },
        _sum: { amount: true },
      }),
    ])

    // Top 5 affiliates by earnings
    const topAffiliates = await db.affiliateProfile.findMany({
      where: { isActive: true, totalEarnings: { gt: 0 } },
      select: {
        id: true,
        referralCode: true,
        totalEarnings: true,
        clicks: true,
        user: { select: { name: true } },
        _count: { select: { tenantApplications: true } },
      },
      orderBy: { totalEarnings: 'desc' },
      take: 5,
    })

    // Affiliate conversion rate (applications from affiliates / total affiliate clicks)
    const affiliateApplications = await db.tenantApplication.count({
      where: { affiliateId: { not: null } },
    })

    // ============================================
    // SECTION 12: Feature Adoption
    // ============================================
    const [
      tenantsWithPpdb,
      tenantsWithWaGateway,
      tenantsWithDonasi,
      tenantsWithCanteen,
      tenantsWithCustomDomain,
      tenantsWithAi,
    ] = await Promise.all([
      db.periodePpdb.groupBy({ by: ['tenantId'] }).then(r => r.length),
      db.waSession.count({ where: { status: "CONNECTED" } }),
      db.donationCampaign.groupBy({ by: ['tenantId'] }).then(r => r.length),
      db.canteenMerchant.groupBy({ by: ['tenantId'] }).then(r => r.length),
      db.tenant.count({ where: { domain: { not: null } } }),
      db.tenant.count({ where: { OR: [{ useCustomApiKey: true }, { aiTokens: { gt: 0 } }] } }),
    ])

    const featureAdoption = [
      { feature: "PPDB Online", count: tenantsWithPpdb, icon: "ppdb" },
      { feature: "WhatsApp Gateway", count: tenantsWithWaGateway, icon: "wa" },
      { feature: "Donasi & Infaq", count: tenantsWithDonasi, icon: "donasi" },
      { feature: "E-Kantin", count: tenantsWithCanteen, icon: "kantin" },
      { feature: "Custom Domain", count: tenantsWithCustomDomain, icon: "domain" },
      { feature: "AI / Kecerdasan Buatan", count: tenantsWithAi, icon: "ai" },
    ].sort((a, b) => b.count - a.count)

    // ============================================
    // SECTION 13: Geographic Distribution
    // ============================================
    const provinceGroups = await db.tenantApplication.groupBy({
      by: ['province'],
      where: { province: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    })
    const geoDistribution = provinceGroups
      .filter(g => g.province)
      .map(g => ({ name: g.province!, value: g._count.id }))
      .slice(0, 15)

    const regencyGroups = await db.tenantApplication.groupBy({
      by: ['regency'],
      where: { regency: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    })
    const topRegencies = regencyGroups
      .filter(g => g.regency)
      .map(g => ({ name: g.regency!, value: g._count.id }))

    // ============================================
    // SECTION 14: Engagement Score
    // ============================================
    const tenantScores = await db.tenantScore.findMany({
      select: {
        totalScore: true,
        contentScore: true,
        trafficScore: true,
        activityScore: true,
        tenant: { select: { plan: true } },
      },
    })

    // Average score per plan
    const scoreByPlan = new Map<string, { sum: number; count: number }>()
    tenantScores.forEach(ts => {
      const plan = ts.tenant.plan.toUpperCase()
      const existing = scoreByPlan.get(plan) || { sum: 0, count: 0 }
      existing.sum += ts.totalScore
      existing.count++
      scoreByPlan.set(plan, existing)
    })
    const avgScorePerPlan = [...scoreByPlan.entries()].map(([plan, data]) => ({
      plan,
      avgScore: data.count > 0 ? Math.round(data.sum / data.count) : 0,
      count: data.count,
    }))

    // Score distribution brackets
    const scoreBrackets = [
      { label: "0-20 (Rendah)", min: 0, max: 20, count: 0 },
      { label: "21-40", min: 21, max: 40, count: 0 },
      { label: "41-60", min: 41, max: 60, count: 0 },
      { label: "61-80", min: 61, max: 80, count: 0 },
      { label: "81-100 (Tinggi)", min: 81, max: 100, count: 0 },
    ]
    tenantScores.forEach(ts => {
      const bracket = scoreBrackets.find(b => ts.totalScore >= b.min && ts.totalScore <= b.max)
      if (bracket) bracket.count++
    })

    const avgTotalScore = tenantScores.length > 0
      ? Math.round(tenantScores.reduce((sum, ts) => sum + ts.totalScore, 0) / tenantScores.length)
      : 0

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

      // Section 7: Visitor Tracking
      visitorStats: {
        totalPageViews,
        uniqueVisitors,
        todayPageViews,
        todayUniqueVisitors,
        sources: visitorSources,
        mediums: visitorMediums,
        topPages: visitorTopPages,
        devices: visitorDevices,
        browsers: visitorBrowsers,
        trend7Days: visitorTrend7Days,
        topTrafficTenants,
      },

      // Section 8: Revenue
      revenueStats: {
        totalRevenue,
        thisMonthRevenue,
        lastMonthRevenue,
        revenueGrowth: lastMonthRevenue > 0 ? (((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : 0,
        arpu,
        revenueTrend,
        revenuePerPlan,
        payingTenantCount: payingTenants.length,
      },

      // Section 9: Conversion Funnel
      conversionFunnel: {
        totalApplications,
        approvedApplications,
        rejectedApplications,
        pendingApplications,
        approvalRate: totalApplications > 0 ? ((approvedApplications / totalApplications) * 100) : 0,
        freeTenants,
        liteTenants,
        proTenants,
        upgradeRate: Math.round(upgradeRate * 10) / 10,
      },

      // Section 10: Retention
      retentionStats: {
        activeRecently,
        inactive30Days,
        inactive60Days,
        inactive90Days,
        retentionActive,
        retentionAtRisk,
        retentionChurned,
        expiredNotRenewed,
        churnRate: totalTenants > 0 ? Math.round(((inactive60Days + inactive90Days) / totalTenants) * 1000) / 10 : 0,
      },

      // Section 11: Affiliate
      affiliateStats: {
        totalAffiliates,
        activeAffiliates,
        totalClicks: totalAffiliateClicks._sum.clicks || 0,
        totalCommissionsPaid: totalCommissionsPaid._sum.amount || 0,
        pendingCommissions: pendingCommissions._sum.amount || 0,
        affiliateApplications,
        conversionRate: (totalAffiliateClicks._sum.clicks || 0) > 0
          ? Math.round((affiliateApplications / (totalAffiliateClicks._sum.clicks || 1)) * 1000) / 10
          : 0,
        topAffiliates: topAffiliates.map(a => ({
          name: a.user.name || a.referralCode,
          code: a.referralCode,
          earnings: a.totalEarnings,
          clicks: a.clicks,
          referrals: a._count.tenantApplications,
        })),
      },

      // Section 12: Feature Adoption
      featureAdoption,

      // Section 13: Geographic
      geoStats: {
        provinces: geoDistribution,
        topRegencies,
        totalProvinces: geoDistribution.length,
      },

      // Section 14: Engagement
      engagementStats: {
        avgTotalScore,
        avgScorePerPlan,
        scoreBrackets: scoreBrackets.map(b => ({ name: b.label, value: b.count })),
        totalScored: tenantScores.length,
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

// ============================================
// Helper: Build daily trend with views + unique visitors
// ============================================
function buildDailyTrendWithVisitors(pageViews: { createdAt: Date; sessionId: string | null; ipHash: string | null }[], days: number) {
  const now = new Date()
  const result: { date: string; views: number; visitors: number }[] = []
  const visitorSets = new Map<string, Set<string>>()

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dateStr = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
    result.push({ date: dateStr, views: 0, visitors: 0 })
    visitorSets.set(dateStr, new Set())
  }

  pageViews.forEach(pv => {
    const dateStr = pv.createdAt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
    const found = result.find(r => r.date === dateStr)
    if (found) {
      found.views++
      const set = visitorSets.get(dateStr)
      if (set) set.add(pv.sessionId || pv.ipHash || 'unknown')
    }
  })

  result.forEach(r => {
    const set = visitorSets.get(r.date)
    if (set) r.visitors = set.size
  })

  return result
}
