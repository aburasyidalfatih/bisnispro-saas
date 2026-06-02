"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AnalyticsData, COLORS } from "./types"
import { Wallet, Store, PiggyBank, GraduationCap, TrendingUp } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from "recharts"

interface Props {
  data: AnalyticsData
}

export function EcosystemTab({ data }: Props) {
  const { ecosystemStats } = data

  if (!ecosystemStats) {
    return <div className="p-8 text-center text-muted-foreground">Memuat data ekosistem transaksi...</div>
  }

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const chartData = [
    { name: "GMV E-Kantin", value: ecosystemStats.canteenGmv, fill: "#3b82f6" },
    { name: "Top-Up Tabungan", value: ecosystemStats.savingDeposits, fill: "#10b981" },
    { name: "Pembayaran PPDB", value: ecosystemStats.ppdbPayments, fill: "#8b5cf6" },
  ]

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Hero Overview Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 h-64 w-64 rounded-full bg-white/5 blur-3xl pointer-events-none"></div>
        <div className="relative p-6 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-md">
              <TrendingUp className="h-3 w-3 mr-2" /> Global Gross Merchandise Value (GMV)
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
              {formatRupiah(ecosystemStats.totalGmv)}
            </h1>
            <p className="text-slate-300 max-w-lg text-sm">
              Total perputaran uang melalui ekosistem transaksi platform (Kantin, Tabungan Siswa, dan PPDB) dari seluruh tenant.
            </p>
          </div>
          <div className="shrink-0">
             <div className="h-24 w-24 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20 shadow-inner">
               <Wallet className="h-10 w-10 text-emerald-400" />
             </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* E-Kantin */}
        <Card className="glass border-0 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none transition-transform group-hover:scale-110">
             <Store className="h-32 w-32 text-blue-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">GMV E-Kantin</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Store className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(ecosystemStats.canteenGmv)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total transaksi belanja siswa di kantin digital.</p>
          </CardContent>
        </Card>

        {/* Tabungan */}
        <Card className="glass border-0 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none transition-transform group-hover:scale-110">
             <PiggyBank className="h-32 w-32 text-emerald-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deposit Tabungan</CardTitle>
            <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <PiggyBank className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(ecosystemStats.savingDeposits)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total dana yang disetor wali murid ke dalam dompet digital siswa.</p>
          </CardContent>
        </Card>

        {/* PPDB */}
        <Card className="glass border-0 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none transition-transform group-hover:scale-110">
             <GraduationCap className="h-32 w-32 text-purple-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pembayaran PPDB</CardTitle>
            <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center">
              <GraduationCap className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(ecosystemStats.ppdbPayments)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total tagihan pendaftaran online yang lunas dibayar.</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Segment */}
      <Card className="glass border-0 shadow-sm">
        <CardHeader>
           <CardTitle>Distribusi GMV Ekosistem</CardTitle>
           <CardDescription>Porsi perputaran uang berdasarkan sumber transaksi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                   <XAxis dataKey="name" />
                   <YAxis tickFormatter={(val) => `Rp ${val / 1000000}M`} />
                   <Tooltip 
                     formatter={(value: number) => [formatRupiah(value), "Total"]}
                     cursor={{ fill: 'rgba(0,0,0,0.05)' }} 
                   />
                   <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                     {chartData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.fill} />
                     ))}
                   </Bar>
                </BarChart>
             </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
