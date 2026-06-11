import { NextResponse, NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { unstable_cache } from "next/cache"

// ============================================
// Helpers
// ============================================
function buildDailyTrend(dates: Date[], days: number) {
  const now = new Date()
  const result: { date: string; count: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    result.push({ date: d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }), count: 0 })
  }
  dates.forEach(date => {
    const dateStr = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
    const found = result.find(r => r.date === dateStr)
    if (found) found.count++
  })
  return result
}

function buildWeeklyTrend(dates: Date[], weeks: number) {
  const now = new Date()
  const result: { week: string; count: number }[] = []
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(now)
    weekStart.setDate(weekStart.getDate() - i * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    result.push({ week: `${weekStart.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} - ${weekEnd.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}`, count: 0 })
  }
  dates.forEach(date => {
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    const weekIndex = weeks - 1 - Math.floor(diffDays / 7)
    if (weekIndex >= 0 && weekIndex < result.length) result[weekIndex].count++
  })
  return result
}

function buildDailyTrendWithVisitors(pageViews: { createdAt: Date; sessionId: string | null; ipHash: string | null }[], days: number) {
  const now = new Date()
  const result: { date: string; views: number; visitors: number }[] = []
  const visitorSets = new Map<string, Set<string>>()
  for (let i = days - 1; i >= 0; i--) {
    const dateStr = new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
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

// ============================================
// Overview Data
// ============================================
const getOverviewData = unstable_cache(
  async () => {
    const now = new Date()
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [onlineUsersRaw, totalTenants, activeTenants, totalUsers, loginsToday] = await Promise.all([
      db.auditLog.findMany({ where: { action: "USER_LOGIN", createdAt: { gte: fifteenMinutesAgo } }, select: { userId: true, tenantId: true } }),
      db.tenant.count(),
      db.tenant.count({ where: { isActive: true } }),
      db.user.count({ where: { isSuperAdmin: false } }),
      db.auditLog.count({ where: { action: "USER_LOGIN", createdAt: { gte: startOfToday } } }),
    ])

    const onlineUserIds = [...new Set(onlineUsersRaw.map(u => u.userId).filter(Boolean))]
    let onlineStaff = 0, onlineParents = 0
    if (onlineUserIds.length > 0) {
      const tenantUsers = await db.tenantUser.findMany({ where: { userId: { in: onlineUserIds as string[] } }, select: { userId: true, role: true } })
      const roleMap = new Map<string, string>()
      tenantUsers.forEach(tu => {
        const existing = roleMap.get(tu.userId)
        if (!existing || ['owner', 'admin', 'guru', 'operator'].includes(tu.role)) roleMap.set(tu.userId, tu.role)
      })
      roleMap.forEach((role) => {
        if (['owner', 'admin', 'guru', 'operator', 'teacher'].includes(role)) onlineStaff++
        else if (['orangtua', 'siswa'].includes(role)) onlineParents++
      })
    }

    const [totalPosts, totalAnnouncements, totalBlogGuru, totalEvents, totalAchievements, totalDocuments, totalWaMessages, totalStudents, totalStaff, totalClassrooms, totalSubjects] = await Promise.all([
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

    const loginLogs7Days = await db.auditLog.findMany({ where: { action: "USER_LOGIN", createdAt: { gte: sevenDaysAgo } }, select: { createdAt: true } })
    const loginTrend7Days = buildDailyTrend(loginLogs7Days.map(l => l.createdAt), 7)

    const recentPosts = await db.post.findMany({ where: { createdAt: { gte: thirtyDaysAgo }, deletedAt: null }, select: { createdAt: true } })
    const contentTrend30Days = buildWeeklyTrend(recentPosts.map(p => p.createdAt), 4)

    const planGroups = await db.tenant.groupBy({ by: ['plan'], _count: { id: true } })
    const planBreakdown = planGroups.map(g => ({ name: g.plan.toUpperCase(), value: g._count.id }))

    const loginsByTenant = await db.auditLog.groupBy({ by: ['tenantId'], where: { action: "USER_LOGIN", createdAt: { gte: startOfMonth }, tenantId: { not: null } }, _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 10 })
    let topActiveTenants: { name: string; logins: number }[] = []
    if (loginsByTenant.length > 0) {
      const tenantIds = loginsByTenant.map(l => l.tenantId).filter(Boolean) as string[]
      const tenantNames = await db.tenant.findMany({ where: { id: { in: tenantIds } }, select: { id: true, name: true } })
      const nameMap = new Map(tenantNames.map(t => [t.id, t.name]))
      topActiveTenants = loginsByTenant.map(l => ({ name: nameMap.get(l.tenantId!) || 'Unknown', logins: l._count.id }))
    }

    const schoolStatusGroups = await db.tenantApplication.groupBy({ by: ['schoolStatus'], _count: { id: true } })
    const schoolStatusBreakdown = schoolStatusGroups.map(g => ({ name: g.schoolStatus || 'TIDAK DIKETAHUI', value: g._count.id }))

    const recentApplications = await db.tenantApplication.findMany({ where: { createdAt: { gte: sixMonthsAgo } }, select: { createdAt: true }, orderBy: { createdAt: 'asc' } })
    const monthlyGrowth = recentApplications.reduce((acc: Record<string, number>, app) => {
      const month = app.createdAt.toLocaleString('id-ID', { month: 'short', year: 'numeric' })
      acc[month] = (acc[month] || 0) + 1
      return acc
    }, {})

    const positionGroups = await db.tenantApplication.groupBy({ by: ['adminPosition'], _count: { id: true } })
    const positionBreakdown = positionGroups.map(g => ({ name: g.adminPosition || 'Lainnya', value: g._count.id })).sort((a, b) => b.value - a.value)

    return {
      onlineUsers: onlineUserIds.length, onlineStaff, onlineParents, totalTenants, activeTenants, totalUsers, loginsToday,
      contentStats: { totalPosts, totalAnnouncements, totalBlogGuru, totalEvents, totalAchievements, totalDocuments, totalWaMessages, totalStudents, totalStaff, totalClassrooms, totalSubjects },
      loginTrend7Days, contentTrend30Days, planBreakdown, topActiveTenants, schoolStatusBreakdown,
      monthlyGrowth: Object.entries(monthlyGrowth).map(([month, count]) => ({ month, count })),
      positionBreakdown
    }
  },
  ["sa-analytics-overview"], { revalidate: 600 }
)

// ============================================
// Growth Data
// ============================================
const getGrowthData = unstable_cache(
  async () => {
    const totalTenants = await db.tenant.count()

    const [totalApplications, approvedApplications, rejectedApplications, pendingApplications, freeTenants, liteTenants, proTenants] = await Promise.all([
      db.tenantApplication.count(), db.tenantApplication.count({ where: { status: "APPROVED" } }), db.tenantApplication.count({ where: { status: "REJECTED" } }), db.tenantApplication.count({ where: { status: "PENDING" } }), db.tenant.count({ where: { plan: "free" } }), db.tenant.count({ where: { plan: "lite" } }), db.tenant.count({ where: { plan: "pro" } })
    ])
    const upgradeRate = totalTenants > 0 ? (((liteTenants + proTenants) / totalTenants) * 100) : 0

    const provinceGroups = await db.tenantApplication.groupBy({ by: ['province'], where: { province: { not: null } }, _count: { id: true }, orderBy: { _count: { id: 'desc' } } })
    const geoDistribution = provinceGroups.map(g => ({ name: g.province!, value: g._count.id })).slice(0, 15)
    const regencyGroups = await db.tenantApplication.groupBy({ by: ['regency'], where: { regency: { not: null } }, _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 10 })
    const topRegencies = regencyGroups.map(g => ({ name: g.regency!, value: g._count.id }))

    const [totalPendaftar, ppdbStatusGroups, activePpdbPeriods] = await Promise.all([
      db.pendaftarPpdb.count(), db.pendaftarPpdb.groupBy({ by: ['status'], _count: { id: true } }), db.periodePpdb.count({ where: { isActive: true } }),
    ])

    const [donationsAgg, activeCampaigns, unpaidInvoices] = await Promise.all([
      db.donation.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
      db.donationCampaign.count({ where: { isActive: true, deletedAt: null } }),
      db.invoice.count({ where: { status: "UNPAID", deletedAt: null } }),
    ])

    return {
      conversionFunnel: { totalApplications, approvedApplications, rejectedApplications, pendingApplications, approvalRate: totalApplications > 0 ? ((approvedApplications / totalApplications) * 100) : 0, freeTenants, liteTenants, proTenants, upgradeRate: Math.round(upgradeRate * 10) / 10 },
      geoStats: { provinces: geoDistribution, topRegencies, totalProvinces: geoDistribution.length },
      ppdbStats: { totalPendaftar, statusBreakdown: ppdbStatusGroups.map(g => ({ name: g.status, value: g._count.id })), activePeriods: activePpdbPeriods },
      financeStats: { totalDonations: donationsAgg._sum.amount || 0, activeCampaigns, unpaidInvoices },
    }
  },
  ["sa-analytics-growth"], { revalidate: 600 }
)

// ============================================
// Finance Data
// ============================================
const getFinanceData = unstable_cache(
  async () => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    const paidPaymentsAgg = await db.payment.groupBy({ by: ['plan'], where: { status: "paid", deletedAt: null }, _sum: { amount: true } })
    const revenuePerPlan = paidPaymentsAgg.map(p => ({ name: (p.plan || 'unknown').toUpperCase(), amount: p._sum.amount || 0 })).sort((a, b) => b.amount - a.amount)
    const totalRevenue = revenuePerPlan.reduce((sum, p) => sum + p.amount, 0)

    const [thisMonthAgg, lastMonthAgg] = await Promise.all([
      db.payment.aggregate({ where: { status: "paid", deletedAt: null, OR: [{ paidAt: { gte: startOfMonth } }, { createdAt: { gte: startOfMonth } }] }, _sum: { amount: true } }),
      db.payment.aggregate({ where: { status: "paid", deletedAt: null, OR: [{ paidAt: { gte: lastMonthStart, lt: startOfMonth } }, { createdAt: { gte: lastMonthStart, lt: startOfMonth } } ]}, _sum: { amount: true } })
    ])
    const thisMonthRevenue = thisMonthAgg._sum.amount || 0
    const lastMonthRevenue = lastMonthAgg._sum.amount || 0

    const allPaidPayments = await db.payment.findMany({ where: { status: "paid", deletedAt: null }, select: { amount: true, paidAt: true, createdAt: true } })
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
      if (revenueTrendMap.has(key)) revenueTrendMap.set(key, (revenueTrendMap.get(key) || 0) + p.amount)
    })
    const revenueTrend = [...revenueTrendMap.entries()].map(([month, amount]) => ({ month, amount }))

    const payingTenants = await db.payment.groupBy({ by: ['tenantId'], where: { status: "paid", deletedAt: null } })
    const arpu = payingTenants.length > 0 ? Math.round(totalRevenue / payingTenants.length) : 0

    const [totalAffiliates, activeAffiliates, totalAffiliateClicks, totalCommissionsPaid, pendingCommissions, affiliateApplications] = await Promise.all([
      db.affiliateProfile.count(), db.affiliateProfile.count({ where: { isActive: true } }), db.affiliateProfile.aggregate({ _sum: { clicks: true } }),
      db.affiliateCommission.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }), db.affiliateCommission.aggregate({ where: { status: "PENDING" }, _sum: { amount: true } }),
      db.tenantApplication.count({ where: { affiliateId: { not: null } } }),
    ])

    const topAffiliates = await db.affiliateProfile.findMany({
      where: { isActive: true, totalEarnings: { gt: 0 } },
      select: { id: true, referralCode: true, totalEarnings: true, clicks: true, user: { select: { name: true } }, _count: { select: { tenantApplications: true } } },
      orderBy: { totalEarnings: 'desc' }, take: 5,
    })

    return {
      revenueStats: { totalRevenue, thisMonthRevenue, lastMonthRevenue, revenueGrowth: lastMonthRevenue > 0 ? (((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : 0, arpu, revenueTrend, revenuePerPlan, payingTenantCount: payingTenants.length },
      affiliateStats: { totalAffiliates, activeAffiliates, totalClicks: totalAffiliateClicks._sum.clicks || 0, totalCommissionsPaid: totalCommissionsPaid._sum.amount || 0, pendingCommissions: pendingCommissions._sum.amount || 0, affiliateApplications, conversionRate: (totalAffiliateClicks._sum.clicks || 0) > 0 ? Math.round((affiliateApplications / (totalAffiliateClicks._sum.clicks || 1)) * 1000) / 10 : 0, topAffiliates: topAffiliates.map(a => ({ name: a.user.name || a.referralCode, code: a.referralCode, earnings: a.totalEarnings, clicks: a.clicks, referrals: a._count.tenantApplications })) },
    }
  },
  ["sa-analytics-finance"], { revalidate: 600 }
)

// ============================================
// Ecosystem Data
// ============================================
const getEcosystemData = unstable_cache(
  async () => {
    const [canteenGmvAgg, savingDepositAgg, savingWithdrawalAgg, ppdbPaymentAgg] = await Promise.all([
      db.canteenOrder.aggregate({ where: { status: "COMPLETED" }, _sum: { total: true } }),
      db.walletTransaction.aggregate({ where: { type: "DEPOSIT", status: "SUCCESS" }, _sum: { amount: true } }),
      db.walletTransaction.aggregate({ where: { type: "WITHDRAWAL", status: "SUCCESS" }, _sum: { amount: true } }),
      db.pembayaranPpdb.aggregate({ where: { status: "LUNAS" }, _sum: { nominal: true } })
    ])
    const totalGmv = (canteenGmvAgg._sum.total || 0) + (savingDepositAgg._sum.amount || 0) + (ppdbPaymentAgg._sum.nominal || 0)
    return {
      ecosystemStats: { totalGmv, canteenGmv: canteenGmvAgg._sum.total || 0, savingDeposits: savingDepositAgg._sum.amount || 0, savingWithdrawals: savingWithdrawalAgg._sum.amount || 0, ppdbPayments: ppdbPaymentAgg._sum.nominal || 0 },
    }
  },
  ["sa-analytics-ecosystem"], { revalidate: 600 }
)

// ============================================
// AI Infra Data
// ============================================
const getAiInfraData = unstable_cache(
  async () => {
    const [aiUsageAgg, totalWaSent, totalWaFailed, totalCbtExams, totalTeacherJournals] = await Promise.all([
      db.aiUsageLog.aggregate({ _sum: { tokens: true } }),
      db.waQueueLog.count({ where: { status: "SENT" } }),
      db.waQueueLog.count({ where: { status: "FAILED" } }),
      db.cbtExam.count(), db.teacherJournal.count()
    ])

    const aiUsersGroups = await db.aiUsageLog.groupBy({ by: ['tenantId'], _sum: { tokens: true }, orderBy: { _sum: { tokens: 'desc' } }, take: 5 })
    let topAiTenants: { name: string; tokens: number }[] = []
    if (aiUsersGroups.length > 0) {
      const aiTenantIds = aiUsersGroups.map(g => g.tenantId)
      const tNames = await db.tenant.findMany({ where: { id: { in: aiTenantIds } }, select: { id: true, name: true } })
      const tnMap = new Map(tNames.map(t => [t.id, t.name]))
      topAiTenants = aiUsersGroups.map(g => ({ name: tnMap.get(g.tenantId) || 'Unknown', tokens: g._sum.tokens || 0 }))
    }

    return {
      aiInfraStats: { totalAiTokensUsed: aiUsageAgg._sum.tokens || 0, topAiTenants, waSent: totalWaSent, waFailed: totalWaFailed, totalStorageBytes: 0 },
      academicStats: { totalCbtExams, totalTeacherJournals },
    }
  },
  ["sa-analytics-ai-infra"], { revalidate: 600 }
)

// ============================================
// Engagement Data
// ============================================
const getEngagementData = unstable_cache(
  async () => {
    const now = new Date()
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgoDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
    const ninetyDaysAgoDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    const totalTenants = await db.tenant.count()

    const tenantScores = await db.tenantScore.findMany({ select: { totalScore: true, tenant: { select: { plan: true } } } })
    const scoreByPlan = new Map<string, { sum: number; count: number }>()
    const scoreBrackets = [
      { label: "0-20 (Rendah)", min: 0, max: 20, count: 0 }, { label: "21-40", min: 21, max: 40, count: 0 }, { label: "41-60", min: 41, max: 60, count: 0 }, { label: "61-80", min: 61, max: 80, count: 0 }, { label: "81-100 (Tinggi)", min: 81, max: 100, count: 0 },
    ]
    tenantScores.forEach(ts => {
      const plan = ts.tenant.plan.toUpperCase()
      const existing = scoreByPlan.get(plan) || { sum: 0, count: 0 }
      existing.sum += ts.totalScore
      existing.count++
      scoreByPlan.set(plan, existing)

      const bracket = scoreBrackets.find(b => ts.totalScore >= b.min && ts.totalScore <= b.max)
      if (bracket) bracket.count++
    })
    const avgScorePerPlan = [...scoreByPlan.entries()].map(([plan, data]) => ({ plan, avgScore: data.count > 0 ? Math.round(data.sum / data.count) : 0, count: data.count }))
    const avgTotalScore = tenantScores.length > 0 ? Math.round(tenantScores.reduce((sum, ts) => sum + ts.totalScore, 0) / tenantScores.length) : 0

    let totalPageViews = 0, uniqueVisitors = 0, todayPageViews = 0, todayUniqueVisitors = 0
    let visitorSources: any[] = [], visitorMediums: any[] = [], visitorTopPages: any[] = [], visitorDevices: any[] = [], visitorBrowsers: any[] = [], visitorTrend7Days: any[] = [], topTrafficTenants: any[] = []

    try {
      const [totalViews, todayViews, sourcesAgg, mediumsAgg, topPagesAgg, devicesAgg, browsersAgg, trafficTenantsAgg] = await Promise.all([
        db.pageView.count({ where: { createdAt: { gte: thirtyDaysAgo } } }), db.pageView.count({ where: { createdAt: { gte: startOfToday } } }),
        db.pageView.groupBy({ by: ['source'], _count: { id: true }, where: { createdAt: { gte: thirtyDaysAgo } }, orderBy: { _count: { id: 'desc' } }, take: 15 }),
        db.pageView.groupBy({ by: ['medium'], _count: { id: true }, where: { createdAt: { gte: thirtyDaysAgo } }, orderBy: { _count: { id: 'desc' } }, take: 15 }),
        db.pageView.groupBy({ by: ['path'], _count: { id: true }, where: { createdAt: { gte: thirtyDaysAgo } }, orderBy: { _count: { id: 'desc' } }, take: 15 }),
        db.pageView.groupBy({ by: ['device'], _count: { id: true }, where: { createdAt: { gte: thirtyDaysAgo } }, orderBy: { _count: { id: 'desc' } }, take: 15 }),
        db.pageView.groupBy({ by: ['browser'], _count: { id: true }, where: { createdAt: { gte: thirtyDaysAgo } }, orderBy: { _count: { id: 'desc' } }, take: 15 }),
        db.pageView.groupBy({ by: ['tenantId'], _count: { id: true }, where: { createdAt: { gte: thirtyDaysAgo } }, orderBy: { _count: { id: 'desc' } }, take: 10 }),
      ])
      totalPageViews = totalViews
      todayPageViews = todayViews
      visitorSources = sourcesAgg.map(g => ({ name: g.source || "direct", views: g._count.id }))
      visitorMediums = mediumsAgg.map(g => ({ name: g.medium || "unknown", views: g._count.id }))
      visitorTopPages = topPagesAgg.map(g => ({ path: g.path, views: g._count.id }))
      visitorDevices = devicesAgg.map(g => ({ name: g.device || "unknown", views: g._count.id }))
      visitorBrowsers = browsersAgg.map(g => ({ name: g.browser || "unknown", views: g._count.id }))

      if (trafficTenantsAgg.length > 0) {
        const tNames = await db.tenant.findMany({ where: { id: { in: trafficTenantsAgg.map(t => t.tenantId) } }, select: { id: true, name: true } })
        const tnMap = new Map(tNames.map(t => [t.id, t.name]))
        topTrafficTenants = trafficTenantsAgg.map(g => ({ name: tnMap.get(g.tenantId) || 'Unknown', views: g._count.id }))
      }

      const uniqueRows = await db.pageView.findMany({ where: { createdAt: { gte: thirtyDaysAgo } }, select: { sessionId: true, ipHash: true, createdAt: true } })
      uniqueVisitors = new Set(uniqueRows.map(pv => pv.sessionId || pv.ipHash)).size
      todayUniqueVisitors = new Set(uniqueRows.filter(pv => pv.createdAt >= startOfToday).map(pv => pv.sessionId || pv.ipHash)).size
      visitorTrend7Days = buildDailyTrendWithVisitors(uniqueRows.filter(pv => pv.createdAt >= sevenDaysAgo), 7)
    } catch (e) {}

    const [activeRecently, inactive30Days, inactive60Days, inactive90Days, retentionActive, retentionAtRisk, retentionChurned, expiredNotRenewed] = await Promise.all([
      db.tenant.count({ where: { isActive: true, lastActiveAt: { gte: thirtyDaysAgo } } }), db.tenant.count({ where: { isActive: true, lastActiveAt: { lt: thirtyDaysAgo, gte: sixtyDaysAgoDate } } }), db.tenant.count({ where: { isActive: true, lastActiveAt: { lt: sixtyDaysAgoDate, gte: ninetyDaysAgoDate } } }), db.tenant.count({ where: { isActive: true, lastActiveAt: { lt: ninetyDaysAgoDate } } }), db.tenant.count({ where: { retentionStatus: "ACTIVE" } }), db.tenant.count({ where: { retentionStatus: "AT_RISK" } }), db.tenant.count({ where: { retentionStatus: "CHURNED" } }), db.subscription.count({ where: { status: "EXPIRED", endDate: { lt: now } } }),
    ])

    const [tenantsWithPpdb, tenantsWithWaGateway, tenantsWithDonasi, tenantsWithCanteen, tenantsWithCustomDomain, tenantsWithAi] = await Promise.all([
      db.periodePpdb.groupBy({ by: ['tenantId'] }).then(r => r.length), Promise.resolve(0), db.donationCampaign.groupBy({ by: ['tenantId'] }).then(r => r.length), db.canteenMerchant.groupBy({ by: ['tenantId'] }).then(r => r.length), db.tenant.count({ where: { domain: { not: null } } }), db.tenant.count({ where: { aiTokens: { gt: 0 } } }),
    ])

    const featureAdoption = [
      { feature: "PPDB Online", count: tenantsWithPpdb, icon: "ppdb" }, { feature: "WhatsApp Gateway", count: tenantsWithWaGateway, icon: "wa" }, { feature: "Donasi & Infaq", count: tenantsWithDonasi, icon: "donasi" }, { feature: "E-Kantin", count: tenantsWithCanteen, icon: "kantin" }, { feature: "Custom Domain", count: tenantsWithCustomDomain, icon: "domain" }, { feature: "AI / Kecerdasan Buatan", count: tenantsWithAi, icon: "ai" },
    ].sort((a, b) => b.count - a.count)


    return {
      totalTenants,
      engagementStats: { avgTotalScore, avgScorePerPlan, scoreBrackets, totalScored: tenantScores.length },
      visitorStats: { totalPageViews, uniqueVisitors, todayPageViews, todayUniqueVisitors, sources: visitorSources, mediums: visitorMediums, topPages: visitorTopPages, devices: visitorDevices, browsers: visitorBrowsers, trend7Days: visitorTrend7Days, topTrafficTenants },
      retentionStats: { activeRecently, inactive30Days, inactive60Days, inactive90Days, retentionActive, retentionAtRisk, retentionChurned, expiredNotRenewed, churnRate: totalTenants > 0 ? Math.round(((inactive60Days + inactive90Days) / totalTenants) * 1000) / 10 : 0 },
      featureAdoption,
    }
  },
  ["sa-analytics-engagement"], { revalidate: 600 }
)

// ============================================
// Tenants Data
// ============================================
const getTenantsData = unstable_cache(
  async () => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const allTenants = await db.tenant.findMany({ select: { id: true, name: true, plan: true, isActive: true, lastActiveAt: true }, orderBy: { lastActiveAt: 'desc' }, take: 20 })
    const tenantLoginCounts = await db.auditLog.groupBy({ by: ['tenantId'], where: { action: "USER_LOGIN", createdAt: { gte: startOfMonth }, tenantId: { in: allTenants.map(t => t.id) } }, _count: { id: true } })
    const tenantLoginMap = new Map(tenantLoginCounts.map(l => [l.tenantId, l._count.id]))

    const tenantActivity = allTenants.map(t => ({ id: t.id, name: t.name, plan: t.plan, studentCount: 0, staffCount: 0, postCount: 0, loginCount: tenantLoginMap.get(t.id) || 0, lastActiveAt: t.lastActiveAt, isActive: t.isActive }))

    return {
      tenantActivity,
    }
  },
  ["sa-analytics-tenants"], { revalidate: 600 }
)

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tab = req.nextUrl.searchParams.get("tab") || "overview"
    let data = {}

    switch (tab) {
      case "overview":
        data = await getOverviewData()
        break
      case "growth":
        data = await getGrowthData()
        break
      case "finance":
        data = await getFinanceData()
        break
      case "ecosystem":
        data = await getEcosystemData()
        break
      case "ai-infra":
        data = await getAiInfraData()
        break
      case "engagement":
        data = await getEngagementData()
        break
      case "tenants":
        data = await getTenantsData()
        break
      default:
        data = await getOverviewData()
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error("[ANALYTICS_ERROR]", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
