"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"

import { AnalyticsData } from "./_components/types"
import { OverviewTab } from "./_components/overview-tab"
import { GrowthTab } from "./_components/growth-tab"
import { FinanceTab } from "./_components/finance-tab"
import { EngagementTab } from "./_components/engagement-tab"
import { AiInfraTab } from "./_components/ai-infra-tab"
import { EcosystemTab } from "./_components/ecosystem-tab"
import { TenantsTab } from "./_components/tenants-tab"

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/super-admin/analytics")
      .then(res => {
        if (!res.ok) throw new Error("API error")
        return res.json()
      })
      .then(d => {
        // Safe defaults for new sections that may not exist yet
        const defaults = {
          visitorStats: { totalPageViews: 0, uniqueVisitors: 0, todayPageViews: 0, todayUniqueVisitors: 0, sources: [], mediums: [], topPages: [], devices: [], browsers: [], trend7Days: [], topTrafficTenants: [] },
          revenueStats: { totalRevenue: 0, thisMonthRevenue: 0, lastMonthRevenue: 0, revenueGrowth: 0, arpu: 0, revenueTrend: [], revenuePerPlan: [], payingTenantCount: 0 },
          conversionFunnel: { totalApplications: 0, approvedApplications: 0, rejectedApplications: 0, pendingApplications: 0, approvalRate: 0, freeTenants: 0, liteTenants: 0, proTenants: 0, upgradeRate: 0 },
          retentionStats: { activeRecently: 0, inactive30Days: 0, inactive60Days: 0, inactive90Days: 0, retentionActive: 0, retentionAtRisk: 0, retentionChurned: 0, expiredNotRenewed: 0, churnRate: 0 },
          affiliateStats: { totalAffiliates: 0, activeAffiliates: 0, totalClicks: 0, totalCommissionsPaid: 0, pendingCommissions: 0, affiliateApplications: 0, conversionRate: 0, topAffiliates: [] },
          featureAdoption: [],
          geoStats: { provinces: [], topRegencies: [], totalProvinces: 0 },
          engagementStats: { avgTotalScore: 0, avgScorePerPlan: [], scoreBrackets: [], totalScored: 0 },
          ecosystemStats: { totalGmv: 0, canteenGmv: 0, savingDeposits: 0, savingWithdrawals: 0, ppdbPayments: 0 },
          aiInfraStats: { totalAiTokensUsed: 0, topAiTenants: [], waSent: 0, waFailed: 0, totalStorageBytes: 0 },
          academicStats: { totalCbtExams: 0, totalTeacherJournals: 0 },
        }
        setData({ ...defaults, ...d })
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!data) return <div>Gagal memuat data analitik.</div>

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Analitik Platform</h1>
        <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
          Pantau aktivitas real-time, konten, dan pertumbuhan seluruh tenant di platform.
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-8">
        <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
          <TabsList className="inline-flex w-max sm:w-auto h-auto gap-2 bg-transparent sm:bg-muted p-0 sm:p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border sm:border-0 rounded-xl sm:rounded-md py-2 sm:py-1.5 px-4">Overview</TabsTrigger>
            <TabsTrigger value="growth" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border sm:border-0 rounded-xl sm:rounded-md py-2 sm:py-1.5 px-4">Growth</TabsTrigger>
            <TabsTrigger value="finance" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border sm:border-0 rounded-xl sm:rounded-md py-2 sm:py-1.5 px-4">SaaS Finance</TabsTrigger>
            <TabsTrigger value="ecosystem" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border sm:border-0 rounded-xl sm:rounded-md py-2 sm:py-1.5 px-4">Ecosystem GMV</TabsTrigger>
            <TabsTrigger value="ai-infra" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border sm:border-0 rounded-xl sm:rounded-md py-2 sm:py-1.5 px-4">AI & Infra</TabsTrigger>
            <TabsTrigger value="engagement" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border sm:border-0 rounded-xl sm:rounded-md py-2 sm:py-1.5 px-4">Engagement</TabsTrigger>
            <TabsTrigger value="tenants" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border sm:border-0 rounded-xl sm:rounded-md py-2 sm:py-1.5 px-4">Tenants</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview">
          <OverviewTab data={data} />
        </TabsContent>

        <TabsContent value="growth">
          <GrowthTab data={data} />
        </TabsContent>

        <TabsContent value="finance">
          <FinanceTab data={data} />
        </TabsContent>

        <TabsContent value="ecosystem">
          <EcosystemTab data={data} />
        </TabsContent>

        <TabsContent value="ai-infra">
          <AiInfraTab data={data} />
        </TabsContent>

        <TabsContent value="engagement">
          <EngagementTab data={data} />
        </TabsContent>

        <TabsContent value="tenants">
          <TenantsTab data={data} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
