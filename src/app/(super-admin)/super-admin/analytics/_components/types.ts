export interface AnalyticsData {
  onlineUsers: number
  onlineStaff: number
  onlineParents: number
  totalTenants: number
  activeTenants: number
  totalUsers: number
  loginsToday: number

  contentStats: {
    totalPosts: number
    totalAnnouncements: number
    totalBlogGuru: number
    totalEvents: number
    totalAchievements: number
    totalDocuments: number
    totalWaMessages: number
    totalStudents: number
    totalStaff: number
    totalClassrooms: number
    totalSubjects: number
  }

  loginTrend7Days: { date: string; count: number }[]
  contentTrend30Days: { week: string; count: number }[]
  planBreakdown: { name: string; value: number }[]
  topActiveTenants: { name: string; logins: number }[]
  schoolStatusBreakdown: { name: string; value: number }[]
  monthlyGrowth: { month: string; count: number }[]
  positionBreakdown: { name: string; value: number }[]

  tenantActivity: {
    id: string
    name: string
    plan: string
    studentCount: number
    staffCount: number
    postCount: number
    loginCount: number
    lastActiveAt: string
    isActive: boolean
  }[]

  ppdbStats: {
    totalPendaftar: number
    statusBreakdown: { name: string; value: number }[]
    activePeriods: number
  }

  financeStats: {
    totalDonations: number
    activeCampaigns: number
    unpaidInvoices: number
  }

  visitorStats: {
    totalPageViews: number
    uniqueVisitors: number
    todayPageViews: number
    todayUniqueVisitors: number
    sources: { name: string; views: number }[]
    mediums: { name: string; views: number }[]
    topPages: { path: string; views: number }[]
    devices: { name: string; views: number }[]
    browsers: { name: string; views: number }[]
    trend7Days: { date: string; views: number; visitors: number }[]
    topTrafficTenants: { name: string; views: number }[]
  }

  revenueStats: {
    totalRevenue: number
    thisMonthRevenue: number
    lastMonthRevenue: number
    revenueGrowth: number
    arpu: number
    revenueTrend: { month: string; amount: number }[]
    revenuePerPlan: { name: string; amount: number }[]
    payingTenantCount: number
  }

  conversionFunnel: {
    totalApplications: number
    approvedApplications: number
    rejectedApplications: number
    pendingApplications: number
    approvalRate: number
    freeTenants: number
    liteTenants: number
    proTenants: number
    upgradeRate: number
  }

  retentionStats: {
    activeRecently: number
    inactive30Days: number
    inactive60Days: number
    inactive90Days: number
    retentionActive: number
    retentionAtRisk: number
    retentionChurned: number
    expiredNotRenewed: number
    churnRate: number
  }

  affiliateStats: {
    totalAffiliates: number
    activeAffiliates: number
    totalClicks: number
    totalCommissionsPaid: number
    pendingCommissions: number
    affiliateApplications: number
    conversionRate: number
    topAffiliates: { name: string; code: string; earnings: number; clicks: number; referrals: number }[]
  }

  featureAdoption: { feature: string; count: number; icon: string }[]

  geoStats: {
    provinces: { name: string; value: number }[]
    topRegencies: { name: string; value: number }[]
    totalProvinces: number
  }

  engagementStats: {
    avgTotalScore: number
    avgScorePerPlan: { plan: string; avgScore: number; count: number }[]
    scoreBrackets: { name: string; value: number }[]
    totalScored: number
  }

  ecosystemStats?: {
    totalGmv: number
    canteenGmv: number
    savingDeposits: number
    savingWithdrawals: number
    ppdbPayments: number
  }

  aiInfraStats?: {
    totalAiTokensUsed: number
    topAiTenants: { name: string; tokens: number }[]
    waSent: number
    waFailed: number
    totalStorageBytes: number
  }

  academicStats?: {
    totalCbtExams: number
    totalTeacherJournals: number
  }
}

export const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b']
export const PLAN_COLORS: Record<string, string> = { FREE: '#94a3b8', LITE: '#3b82f6', PRO: '#8b5cf6' }
