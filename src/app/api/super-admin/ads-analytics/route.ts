import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const now = new Date()
    const thisYear = now.getFullYear()
    const thisMonth = (now.getMonth() + 1).toString().padStart(2, '0')

    // ============================================
    // 1. Total Applications by UTM Source
    // ============================================
    let allApplications: { id: string; schoolName: string; status: string; utmSource: string | null; utmMedium: string | null; utmCampaign: string | null; utmContent: string | null; createdAt: Date; affiliateId: string | null }[] = []
    try {
      allApplications = await db.tenantApplication.findMany({
        select: {
          id: true,
          schoolName: true,
          status: true,
          utmSource: true,
          utmMedium: true,
          utmCampaign: true,
          utmContent: true,
          createdAt: true,
          affiliateId: true,
        },
        orderBy: { createdAt: 'desc' },
      })
    } catch {
      // UTM columns might not exist yet — fallback without UTM fields
      const fallback = await db.tenantApplication.findMany({
        select: {
          id: true,
          schoolName: true,
          status: true,
          createdAt: true,
          affiliateId: true,
        },
        orderBy: { createdAt: 'desc' },
      })
      allApplications = fallback.map(a => ({ ...a, utmSource: null, utmMedium: null, utmCampaign: null, utmContent: null }))
    }

    // Applications with UTM tracking
    const trackedApplications = allApplications.filter(a => a.utmSource)
    const organicApplications = allApplications.filter(a => !a.utmSource && !a.affiliateId)
    const affiliateApplications = allApplications.filter(a => a.affiliateId)

    // Group by source
    const sourceMap = new Map<string, { total: number; approved: number; rejected: number; pending: number }>()
    allApplications.forEach(a => {
      const src = a.utmSource || (a.affiliateId ? 'Afiliasi' : 'Organik')
      const existing = sourceMap.get(src) || { total: 0, approved: 0, rejected: 0, pending: 0 }
      existing.total++
      if (a.status === 'APPROVED') existing.approved++
      else if (a.status === 'REJECTED') existing.rejected++
      else existing.pending++
      sourceMap.set(src, existing)
    })
    const bySource = [...sourceMap.entries()]
      .map(([source, stats]) => ({ source, ...stats }))
      .sort((a, b) => b.total - a.total)

    // Group by campaign
    const campaignMap = new Map<string, { total: number; approved: number }>()
    trackedApplications.forEach(a => {
      const campaign = a.utmCampaign || 'Tanpa Kampanye'
      const existing = campaignMap.get(campaign) || { total: 0, approved: 0 }
      existing.total++
      if (a.status === 'APPROVED') existing.approved++
      campaignMap.set(campaign, existing)
    })
    const byCampaign = [...campaignMap.entries()]
      .map(([campaign, stats]) => ({
        campaign,
        ...stats,
        conversionRate: stats.total > 0 ? Math.round((stats.approved / stats.total) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.total - a.total)

    // Group by medium
    const mediumMap = new Map<string, number>()
    trackedApplications.forEach(a => {
      const medium = a.utmMedium || 'Lainnya'
      mediumMap.set(medium, (mediumMap.get(medium) || 0) + 1)
    })
    const byMedium = [...mediumMap.entries()]
      .map(([medium, count]) => ({ medium, count }))
      .sort((a, b) => b.count - a.count)

    // ============================================
    // 2. Full Funnel: Register → Approve → Upgrade → Pay
    // ============================================
    // Get approved tenant slugs from applications
    const approvedApps = allApplications.filter(a => a.status === 'APPROVED')
    const approvedSlugs = approvedApps.map(a => a.schoolName)

    // Get tenants that upgraded (lite or pro)
    const tenants = await db.tenant.findMany({
      select: { id: true, name: true, plan: true, createdAt: true },
    })

    const paidTenants = tenants.filter(t => t.plan === 'lite' || t.plan === 'pro')

    // Get payments
    const paidPayments = await db.payment.findMany({
      where: { status: "paid", deletedAt: null },
      select: { amount: true, tenantId: true, plan: true, paidAt: true, createdAt: true },
    })

    const totalRevenueFromAds = paidPayments.reduce((sum, p) => sum + p.amount, 0)

    // ============================================
    // 3. Monthly trend: leads from ads vs organic
    // ============================================
    const monthlyTrend: { month: string; ads: number; organic: number; affiliate: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now)
      d.setMonth(d.getMonth() - i)
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1)
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1)
      const key = d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })

      const monthApps = allApplications.filter(a => a.createdAt >= monthStart && a.createdAt < monthEnd)
      monthlyTrend.push({
        month: key,
        ads: monthApps.filter(a => a.utmSource).length,
        organic: monthApps.filter(a => !a.utmSource && !a.affiliateId).length,
        affiliate: monthApps.filter(a => a.affiliateId).length,
      })
    }

    // ============================================
    // 4. Funnel conversion per source
    // ============================================
    // For Meta ads specifically
    const metaApps = allApplications.filter(a =>
      a.utmSource?.toLowerCase() === 'facebook' ||
      a.utmSource?.toLowerCase() === 'meta' ||
      a.utmSource?.toLowerCase() === 'instagram' ||
      a.utmSource?.toLowerCase() === 'fb'
    )
    const metaApproved = metaApps.filter(a => a.status === 'APPROVED')

    // Match meta-approved with tenants that upgraded
    // We use schoolName matching (simplified)
    const metaApprovedNames = metaApproved.map(a => a.schoolName.toLowerCase())
    const metaUpgraded = paidTenants.filter(t =>
      metaApprovedNames.includes(t.name.toLowerCase())
    )

    // ============================================
    // 5. Ad Budget Data
    // ============================================
    let adBudgets: { id: string; month: string; year: number; platform: string; budget: number; notes: string | null }[] = []
    try {
      adBudgets = await db.adBudget.findMany({
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        take: 12,
      })
    } catch {
      // Table might not exist yet
    }

    // Calculate ROI metrics
    const currentMonthBudgets = adBudgets.filter(b => b.month === thisMonth && b.year === thisYear)
    const currentMonthBudget = currentMonthBudgets.reduce((sum, b) => sum + b.budget, 0)
    const totalAdSpend = adBudgets.reduce((sum, b) => sum + b.budget, 0)

    // Leads this month from ads
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisMonthAdsLeads = trackedApplications.filter(a => a.createdAt >= startOfMonth).length
    const costPerLead = currentMonthBudget > 0 && thisMonthAdsLeads > 0
      ? Math.round(currentMonthBudget / thisMonthAdsLeads)
      : 0

    // Cost per acquisition (approved tenant from ads)
    const thisMonthAdsApproved = trackedApplications.filter(a => a.createdAt >= startOfMonth && a.status === 'APPROVED').length
    const costPerAcquisition = currentMonthBudget > 0 && thisMonthAdsApproved > 0
      ? Math.round(currentMonthBudget / thisMonthAdsApproved)
      : 0

    // ROAS
    const thisMonthRevenue = paidPayments
      .filter(p => (p.paidAt || p.createdAt) >= startOfMonth)
      .reduce((sum, p) => sum + p.amount, 0)
    const roas = currentMonthBudget > 0 ? Math.round((thisMonthRevenue / currentMonthBudget) * 100) / 100 : 0

    // ============================================
    // 6. Recent leads from ads (latest 20)
    // ============================================
    const recentAdsLeads = trackedApplications
      .slice(0, 20)
      .map(a => ({
        schoolName: a.schoolName,
        status: a.status,
        source: a.utmSource || '',
        medium: a.utmMedium || '',
        campaign: a.utmCampaign || '',
        content: a.utmContent || '',
        date: a.createdAt,
      }))

    return NextResponse.json({
      summary: {
        totalApplications: allApplications.length,
        adsLeads: trackedApplications.length,
        organicLeads: organicApplications.length,
        affiliateLeads: affiliateApplications.length,
        adsApproved: trackedApplications.filter(a => a.status === 'APPROVED').length,
        totalTenants: tenants.length,
        paidTenants: paidTenants.length,
        totalRevenue: totalRevenueFromAds,
      },
      funnel: {
        metaLeads: metaApps.length,
        metaApproved: metaApproved.length,
        metaUpgraded: metaUpgraded.length,
      },
      bySource,
      byCampaign,
      byMedium,
      monthlyTrend,
      roi: {
        currentMonthBudget,
        totalAdSpend,
        thisMonthAdsLeads,
        thisMonthAdsApproved,
        costPerLead,
        costPerAcquisition,
        thisMonthRevenue,
        roas,
      },
      adBudgets: adBudgets.map(b => ({
        id: b.id,
        month: b.month,
        year: b.year,
        platform: b.platform,
        budget: b.budget,
        notes: b.notes,
      })),
      recentAdsLeads,
    })
  } catch (error: any) {
    console.error("Ads Analytics Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: Save ad budget
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { month, year, platform, budget, notes } = body

    if (!month || !year || budget === undefined) {
      return NextResponse.json({ error: "Month, year, and budget are required" }, { status: 400 })
    }

    const result = await db.adBudget.upsert({
      where: {
        month_year_platform: { month, year: parseInt(year), platform: platform || 'meta' },
      },
      create: {
        month,
        year: parseInt(year),
        platform: platform || 'meta',
        budget: parseInt(budget),
        notes: notes || null,
      },
      update: {
        budget: parseInt(budget),
        notes: notes || null,
      },
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    console.error("Ad Budget Save Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
