import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Activity, Users, Target } from "lucide-react"
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts"
import { MetaData } from "./types"

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#f97316']

interface AdsChartsProps {
  metaData: MetaData
  fmtRp: (v: number) => string
  fmtNum: (v: number) => string
}

export function AdsCharts({ metaData, fmtRp, fmtNum }: AdsChartsProps) {
  return (
    <>
      {/* ======== DAILY TREND CHART ======== */}
      {metaData.dailyTrend.length > 1 && (
        <Card className="glass border-0">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" /> Tren Harian
            </CardTitle>
            <CardDescription>Performa iklan per hari — spend vs clicks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metaData.dailyTrend}>
                  <defs>
                    <linearGradient id="gradSpend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gradClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={9} tickLine={false} axisLine={false}
                    tickFormatter={(v) => { const d = new Date(v); return `${d.getDate()}/${d.getMonth()+1}` }} />
                  <YAxis yAxisId="spend" stroke="#ef4444" fontSize={10} tickLine={false} axisLine={false}
                    tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <YAxis yAxisId="clicks" orientation="right" stroke="#10b981" fontSize={10} tickLine={false} axisLine={false} />
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px' }}
                    formatter={(value: any, name: any) => [name === 'Spend' ? fmtRp(value) : fmtNum(value), name]} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                  <Area yAxisId="spend" type="monotone" dataKey="spend" name="Spend" stroke="#ef4444" fill="url(#gradSpend)" strokeWidth={2} />
                  <Area yAxisId="clicks" type="monotone" dataKey="clicks" name="Clicks" stroke="#10b981" fill="url(#gradClicks)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ======== BREAKDOWN: AGE & GENDER + PLACEMENT ======== */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Age & Gender */}
        {metaData.ageGenderBreakdown.length > 0 && (
          <Card className="glass border-0">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5 text-violet-500" /> Demografi
              </CardTitle>
              <CardDescription>Breakdown usia & gender audience iklan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {(() => {
                    // Group by age, sum clicks per gender
                    const ageMap = new Map<string, { age: string; Pria: number; Wanita: number }>()
                    metaData.ageGenderBreakdown.forEach(d => {
                      const existing = ageMap.get(d.age) || { age: d.age, Pria: 0, Wanita: 0 }
                      if (d.gender === 'Pria') existing.Pria += d.clicks
                      else existing.Wanita += d.clicks
                      ageMap.set(d.age, existing)
                    })
                    const chartData = [...ageMap.values()].sort((a, b) => a.age.localeCompare(b.age))
                    return (
                      <BarChart data={chartData} barCategoryGap="15%">
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="age" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis fontSize={10} tickLine={false} axisLine={false} />
                        <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px' }} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                        <Bar dataKey="Pria" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Wanita" fill="#ec4899" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    )
                  })()}
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Placement Breakdown */}
        {metaData.placementBreakdown.length > 0 && (
          <Card className="glass border-0">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-500" /> Performa Placement
              </CardTitle>
              <CardDescription>Clicks per platform & posisi penempatan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {(() => {
                    // Group by platform
                    const platMap = new Map<string, number>()
                    metaData.placementBreakdown.forEach(d => {
                      const label = d.platform === 'facebook' ? 'Facebook' :
                        d.platform === 'instagram' ? 'Instagram' :
                        d.platform === 'audience_network' ? 'Audience Network' :
                        d.platform === 'messenger' ? 'Messenger' : d.platform
                      platMap.set(label, (platMap.get(label) || 0) + d.clicks)
                    })
                    const pieData = [...platMap.entries()].map(([name, value]) => ({ name, value })).filter(d => d.value > 0)
                    return (
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="45%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value"
                          label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`} labelLine={false}>
                          {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    )
                  })()}
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}


