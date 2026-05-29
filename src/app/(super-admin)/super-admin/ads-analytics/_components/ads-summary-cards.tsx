import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, Users, Eye, MousePointerClick, RefreshCcw, UserPlus, Lightbulb, CheckCircle, AlertTriangle, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { MetaData } from "./types"
import { StatCard } from "./shared-components"

interface AdsSummaryCardsProps {
  metaData: MetaData
  fmtRp: (v: number) => string
  fmtNum: (v: number) => string
}

export function AdsSummaryCards({ metaData, fmtRp, fmtNum }: AdsSummaryCardsProps) {
  return (
    <>
      {/* ======== SUMMARY CARDS ======== */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 xl:grid-cols-8">
        <StatCard label="Spend" value={fmtRp(metaData.summary.totalSpend)} icon={DollarSign} color="rose" />
        <StatCard label="Impressions" value={fmtNum(metaData.summary.totalImpressions)} icon={Eye} color="blue" />
        <StatCard label="Reach" value={fmtNum(metaData.summary.totalReach)} icon={Users} color="violet" />
        <StatCard label="Clicks" value={fmtNum(metaData.summary.totalClicks)} icon={MousePointerClick} color="emerald" />
        <StatCard label="CPC" value={fmtRp(metaData.summary.avgCpc)} icon={DollarSign} color="amber" />
        <StatCard label="CTR" value={`${metaData.summary.avgCtr.toFixed(2)}%`} icon={TrendingUp} color="cyan" />
        <StatCard label="Frequency" value={metaData.summary.frequency.toFixed(1)} icon={RefreshCcw} color="orange" />
        <StatCard label="Leads" value={fmtNum(metaData.summary.totalLeads)} icon={UserPlus} color="emerald" />
      </div>

      {/* ======== RECOMMENDATIONS ======== */}
      {metaData.recommendations.length > 0 && (
        <Card className="glass border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" /> Rekomendasi & Insight ({metaData.recommendations.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {metaData.recommendations.map((r, i) => (
              <div key={i} className={cn("p-3 rounded-xl border text-sm flex items-start gap-3",
                r.type === 'success' && "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900",
                r.type === 'warning' && "bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900",
                r.type === 'info' && "bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900",
              )}>
                {r.type === 'success' && <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />}
                {r.type === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />}
                {r.type === 'info' && <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />}
                <div>
                  <p className="font-bold text-xs">{r.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{r.message}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </>
  )
}
