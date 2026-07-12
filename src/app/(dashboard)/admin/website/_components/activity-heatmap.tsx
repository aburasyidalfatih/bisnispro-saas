"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"

const ActivityCalendar = dynamic(
  () => import("react-activity-calendar").then((mod) => mod.ActivityCalendar),
  { ssr: false }
)

import { getAdminActivityHeatmap } from "../actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Activity } from "lucide-react"
import { useTheme } from "next-themes"

interface ActivityHeatmapProps {
  tenantId: string
}

export function ActivityHeatmap({ tenantId }: ActivityHeatmapProps) {
  const { theme, systemTheme } = useTheme()
  const [data, setData] = useState<{ date: string; count: number; level: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantId) return

    getAdminActivityHeatmap(tenantId).then(res => {
      setData(res)
      setLoading(false)
    })
  }, [tenantId])

  // Determine actual theme (resolve "system")
  const currentTheme = theme === "system" ? systemTheme : theme

  const explicitTheme = {
    light: ['#f0f0f0', '#c4edde', '#7ac7c4', '#f73859', '#384259'],
    dark: ['#1e1e2f', '#0e4429', '#006d32', '#26a641', '#39d353'],
  }

  // Fallback to GitHub-style green scale if explicitTheme is not preferred
  const greenTheme = {
    light: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'] as [string, string, string, string, string],
    dark: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'] as [string, string, string, string, string],
  }


  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-3 border border-border/50 bg-background/50 backdrop-blur-sm overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold">Aktivitas Sistem</CardTitle>
            <CardDescription className="text-xs">Log kontribusi dan aktivitas harian pada website</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 overflow-x-auto">
        <div className="min-w-[800px] flex justify-center pb-2">
          {loading ? (
            <div className="h-[150px] flex items-center justify-center w-full animate-pulse bg-muted/20 rounded-xl border border-border/50">
              <span className="text-sm text-muted-foreground">Memuat data aktivitas...</span>
            </div>
          ) : (
            <ActivityCalendar
              data={data}
              theme={greenTheme}
              colorScheme={currentTheme === "dark" ? "dark" : "light"}
              labels={{
                legend: {
                  less: "Sedikit",
                  more: "Banyak",
                },
                months: [
                  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
                  "Jul", "Ags", "Sep", "Okt", "Nov", "Des"
                ],
                totalCount: "{{count}} aktivitas di tahun ini",
              }}
              showWeekdayLabels
              blockSize={12}
              blockRadius={3}
              blockMargin={4}
              fontSize={12}
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
