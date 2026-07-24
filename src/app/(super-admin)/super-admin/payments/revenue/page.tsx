"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Wallet, ArrowUpRight, BarChart3 } from "lucide-react"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts"

interface ChartData {
  name: string
  total: number
}

export default function RevenuePage() {
  const [data, setData] = useState<{ chartData: ChartData[], totalRevenue: number }>({ chartData: [], totalRevenue: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/super-admin/payments/revenue")
      .then(res => res.json())
      .then(res => {
        setData(res)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="skeleton h-96 rounded-2xl" />

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Laporan Pendapatan</h1>
        <p className="text-muted-foreground mt-1 text-sm">Analisa pertumbuhan pendapatan platform.</p>
      </div>

      <div className="grid gap-6">
        {/* Summary Card */}
        <Card className="glass border-0 shadow-lg bg-primary/5">
          <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Wallet className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Pendapatan Terkumpul</p>
                <h2 className="text-4xl font-extrabold tracking-tight mt-1 text-primary">
                  Rp {data.totalRevenue.toLocaleString("id-ID")}
                </h2>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center gap-2 border border-emerald-500/20">
              <TrendingUp className="h-5 w-5" />
              <span className="font-bold">Sistem Stabil</span>
            </div>
          </CardContent>
        </Card>

        {/* Chart Card */}
        <Card className="glass border-0 shadow-xl overflow-hidden">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Grafik Pendapatan Bulanan</CardTitle>
                <CardDescription>Visualisasi pertumbuhan per bulan</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[350px] w-full">
              {data.chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `Rp ${value.toLocaleString("id-ID").split(',')[0]}`}
                    />
                    <Tooltip 
                      cursor={{fill: 'rgba(79, 70, 229, 0.05)'}}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      formatter={(value: any) => [`Rp ${value.toLocaleString("id-ID")}`, 'Pendapatan']}
                    />
                    <Bar 
                      dataKey="total" 
                      fill="hsl(var(--primary))" 
                      radius={[6, 6, 0, 0]} 
                      barSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground italic">
                  <TrendingUp className="h-10 w-10 opacity-20 mb-3" />
                  Belum ada data grafik tersedia
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

