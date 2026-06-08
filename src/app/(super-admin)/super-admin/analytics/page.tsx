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
  const [activeTab, setActiveTab] = useState("overview")
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set(["overview"]))

  const handleTabChange = (val: string) => {
    setActiveTab(val)
    setLoadedTabs((prev) => new Set(prev).add(val))
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Analitik Platform</h1>
        <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
          Pantau aktivitas real-time, konten, dan pertumbuhan seluruh tenant di platform.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-8">
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

        <TabsContent value="overview" forceMount className={activeTab === "overview" ? "block" : "hidden"}>
          {loadedTabs.has("overview") && <OverviewTab />}
        </TabsContent>

        <TabsContent value="growth" forceMount className={activeTab === "growth" ? "block" : "hidden"}>
          {loadedTabs.has("growth") && <GrowthTab />}
        </TabsContent>

        <TabsContent value="finance" forceMount className={activeTab === "finance" ? "block" : "hidden"}>
          {loadedTabs.has("finance") && <FinanceTab />}
        </TabsContent>

        <TabsContent value="ecosystem" forceMount className={activeTab === "ecosystem" ? "block" : "hidden"}>
          {loadedTabs.has("ecosystem") && <EcosystemTab />}
        </TabsContent>

        <TabsContent value="ai-infra" forceMount className={activeTab === "ai-infra" ? "block" : "hidden"}>
          {loadedTabs.has("ai-infra") && <AiInfraTab />}
        </TabsContent>

        <TabsContent value="engagement" forceMount className={activeTab === "engagement" ? "block" : "hidden"}>
          {loadedTabs.has("engagement") && <EngagementTab />}
        </TabsContent>

        <TabsContent value="tenants" forceMount className={activeTab === "tenants" ? "block" : "hidden"}>
          {loadedTabs.has("tenants") && <TenantsTab />}
        </TabsContent>
      </Tabs>
    </div>
  )
}
