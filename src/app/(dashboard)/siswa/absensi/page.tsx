"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ClipboardList, CheckCircle2, XCircle, AlertCircle, Clock, Loader2 } from "lucide-react"

export default function AbsensiSiswaPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAbsensi = async () => {
      try {
        const res = await fetch("/api/siswa/absensi")
        if (res.ok) {
          setData(await res.json())
        }
      } catch (e) {
        console.error("Failed to load attendance data", e)
      } finally {
        setLoading(false)
      }
    }
    fetchAbsensi()
  }, [])

  if (loading) {
    return <div className="h-[100dvh] w-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
  }

  const records = data?.records || []

  const stats = {
    hadir: records.filter((r: any) => r.status === "PRESENT").length,
    sakit: records.filter((r: any) => r.status === "SICK").length,
    izin: records.filter((r: any) => r.status === "PERMIT").length,
    alpa: records.filter((r: any) => r.status === "ABSENT").length,
  }

  const getStatusVisuals = (status: string) => {
    switch (status) {
      case "PRESENT": return { label: "HADIR", color: "text-emerald-500", bg: "bg-emerald-50", icon: CheckCircle2 }
      case "SICK": return { label: "SAKIT", color: "text-amber-500", bg: "bg-amber-50", icon: AlertCircle }
      case "PERMIT": return { label: "IZIN", color: "text-blue-500", bg: "bg-blue-50", icon: AlertCircle }
      case "ABSENT": return { label: "ALPA", color: "text-red-500", bg: "bg-red-50", icon: XCircle }
      default: return { label: status, color: "text-slate-500", bg: "bg-slate-50", icon: ClipboardList }
    }
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="bg-emerald-500 rounded-3xl p-6 text-white shadow-lg shadow-emerald-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <ClipboardList className="w-5 h-5 text-emerald-100" />
            <span className="text-sm text-emerald-100 font-medium">Rekap Kehadiran</span>
          </div>
          <h2 className="font-bold text-2xl">Bulan Ini</h2>
          
          <div className="grid grid-cols-4 gap-2 mt-4">
            <div className="bg-white/20 p-2 rounded-xl text-center backdrop-blur-sm border border-white/20">
              <div className="text-lg font-black">{stats.hadir}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider">Hadir</div>
            </div>
            <div className="bg-white/20 p-2 rounded-xl text-center backdrop-blur-sm border border-white/20">
              <div className="text-lg font-black">{stats.sakit}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider">Sakit</div>
            </div>
            <div className="bg-white/20 p-2 rounded-xl text-center backdrop-blur-sm border border-white/20">
              <div className="text-lg font-black">{stats.izin}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider">Izin</div>
            </div>
            <div className="bg-red-500/80 p-2 rounded-xl text-center backdrop-blur-sm border border-red-400">
              <div className="text-lg font-black">{stats.alpa}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider">Alpa</div>
            </div>
          </div>
        </div>
      </div>

      {/* History List */}
      <div>
        <h3 className="font-bold text-slate-800 mb-3 ml-1">Riwayat Kehadiran</h3>
        <Card className="glass border-0 shadow-sm overflow-hidden">
          <CardContent className="p-0 divide-y divide-slate-100">
            {records.length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-medium text-sm">Belum ada riwayat absensi.</div>
            ) : (
              records.map((item: any, idx: number) => {
                const visual = getStatusVisuals(item.status)
                const dateObj = new Date(item.createdAt)
                const dateStr = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                const timeStr = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

                return (
                  <div key={idx} className="flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl ${visual.bg} ${visual.color} flex items-center justify-center shrink-0`}>
                        <visual.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{dateStr}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[11px] font-black tracking-wider uppercase ${visual.color}`}>
                            {visual.label}
                          </span>
                          {item.notes && (
                            <span className="text-[11px] text-muted-foreground font-medium">
                              • {item.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {visual.label === "HADIR" && (
                      <div className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-full text-slate-600 font-bold text-xs">
                        <Clock className="w-3.5 h-3.5" />
                        {timeStr}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
