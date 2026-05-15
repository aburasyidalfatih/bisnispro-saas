"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Clock, CheckCircle2, ChevronRight, FileUp, Loader2 } from "lucide-react"
import Link from "next/link"

export default function TugasSiswaPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTugas = async () => {
      try {
        const res = await fetch("/api/siswa/tugas")
        if (res.ok) {
          setData(await res.json())
        }
      } catch (e) {
        console.error("Failed to load tasks data", e)
      } finally {
        setLoading(false)
      }
    }
    fetchTugas()
  }, [])

  if (loading) {
    return <div className="h-screen w-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-pink-500" /></div>
  }

  const activeTasks = data?.activeTasks || []
  const completedTasks = data?.completedTasks || []

  // Format Date Helper
  const formatDeadline = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="bg-pink-500 rounded-3xl p-6 text-white shadow-lg shadow-pink-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-5 h-5 text-pink-100" />
            <span className="text-sm text-pink-100 font-medium">Tugas & Latihan</span>
          </div>
          <h2 className="font-bold text-2xl">{activeTasks.length} Tugas Aktif</h2>
          <p className="text-sm mt-1 text-pink-100">Jangan ditunda-tunda ya!</p>
        </div>
      </div>

      {/* Tugas Aktif */}
      <div>
        <h3 className="font-bold text-slate-800 mb-3 ml-1 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" /> Sedang Berlangsung
        </h3>
        <div className="space-y-3">
          {activeTasks.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-medium text-sm">Hore! Tidak ada tugas yang menumpuk.</div>
          ) : (
            activeTasks.map((item: any, idx: number) => {
              // Menentukan link: kalau ada PIN, lempar langsung ke ujian, kalau tidak, ke portal CBT umum
              const href = item.pin ? `/ujian/ruang-ujian?pin=${item.pin}` : `/siswa/cbt`
              return (
                <Link key={idx} href={href} className="block">
                  <Card className="glass border-2 border-slate-200 hover:border-pink-300 transition-colors cursor-pointer group">
                    <CardContent className="p-4 flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center shrink-0 border border-pink-100">
                        <FileUp className="w-6 h-6 text-pink-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{item.subject}</p>
                        <h4 className="font-bold text-slate-800 text-sm leading-tight mb-2 group-hover:text-pink-600 transition-colors">{item.title}</h4>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-red-500 bg-red-50 w-fit px-2 py-0.5 rounded-md">
                          <Clock className="w-3.5 h-3.5" />
                          Batas: {formatDeadline(item.deadline)}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 mt-3 group-hover:text-pink-500 transition-colors" />
                    </CardContent>
                  </Card>
                </Link>
              )
            })
          )}
        </div>
      </div>

      {/* Tugas Selesai */}
      <div className="pt-4">
        <h3 className="font-bold text-slate-800 mb-3 ml-1 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Selesai Dinilai
        </h3>
        <Card className="glass border-0 shadow-sm overflow-hidden">
          <CardContent className="p-0 divide-y divide-slate-100">
            {completedTasks.length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-medium text-sm">Belum ada tugas yang diselesaikan.</div>
            ) : (
              completedTasks.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors cursor-pointer">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">{item.subject}</p>
                    <h4 className="font-semibold text-slate-700 text-sm">{item.title}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground font-medium uppercase">Nilai</p>
                      <p className="text-lg font-black text-emerald-600">{item.score}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
