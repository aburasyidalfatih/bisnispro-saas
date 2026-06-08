"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AnalyticsData, COLORS } from "./types"
import { BrainCircuit, Database, HardDrive, Megaphone, Server, ShieldAlert, Loader2 } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from "recharts"
import { useState, useEffect } from "react"

export function AiInfraTab() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/super-admin/analytics?tab=ai-infra")
      .then(res => res.json())
      .then(d => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!data || !data.aiInfraStats || !data.academicStats) return <div className="p-8 text-center text-muted-foreground">Gagal memuat data AI & Infra.</div>

  const { aiInfraStats, academicStats } = data

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatNumber = (num: number) => num.toLocaleString('id-ID')

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass border-0 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
             <BrainCircuit className="h-16 w-16 text-indigo-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Token AI Terpakai</CardTitle>
            <BrainCircuit className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(aiInfraStats.totalAiTokensUsed)}</div>
            <p className="text-xs text-muted-foreground mt-1">Platform-wide</p>
          </CardContent>
        </Card>

        <Card className="glass border-0 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
             <Megaphone className="h-16 w-16 text-emerald-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">WhatsApp Broadcast</CardTitle>
            <Megaphone className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(aiInfraStats.waSent)}</div>
            <p className="text-xs text-muted-foreground mt-1">Pesan berhasil dikirim</p>
          </CardContent>
        </Card>

        <Card className="glass border-0 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
             <HardDrive className="h-16 w-16 text-sky-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Consumed</CardTitle>
            <HardDrive className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(aiInfraStats.totalStorageBytes)}</div>
            <p className="text-xs text-muted-foreground mt-1">File upload & attachments</p>
          </CardContent>
        </Card>

        <Card className="glass border-0 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
             <Database className="h-16 w-16 text-amber-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Academic Data</CardTitle>
            <Database className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(academicStats.totalCbtExams)} CBT</div>
            <p className="text-xs text-muted-foreground mt-1">{formatNumber(academicStats.totalTeacherJournals)} Jurnal Guru</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top AI Tenants */}
        <Card className="glass border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-indigo-500" />
              Top 5 Pengguna AI
            </CardTitle>
            <CardDescription>Sekolah dengan pemakaian token AI terbanyak</CardDescription>
          </CardHeader>
          <CardContent>
            {aiInfraStats.topAiTenants.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={aiInfraStats.topAiTenants}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} formatter={(value: number) => [formatNumber(value), 'Tokens']} />
                    <Bar dataKey="tokens" radius={[0, 4, 4, 0]}>
                      {aiInfraStats.topAiTenants.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground border border-dashed rounded-xl">
                Belum ada data penggunaan AI.
              </div>
            )}
          </CardContent>
        </Card>

        {/* WhatsApp Success vs Failed */}
        <Card className="glass border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-emerald-500" />
              Performa WhatsApp Gateway
            </CardTitle>
            <CardDescription>Rasio pengiriman berhasil vs gagal</CardDescription>
          </CardHeader>
          <CardContent>
             {(aiInfraStats.waSent + aiInfraStats.waFailed) > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Berhasil", value: aiInfraStats.waSent, fill: "#10b981" },
                        { name: "Gagal", value: aiInfraStats.waFailed, fill: "#ef4444" }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    />
                    <Tooltip formatter={(value: number) => [formatNumber(value), 'Pesan']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
             ) : (
               <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground border border-dashed rounded-xl">
                 Belum ada data pesan WhatsApp.
               </div>
             )}
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
