"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar as CalendarIcon, Clock, MapPin, BookOpen, Loader2 } from "lucide-react"

export default function JadwalSiswaPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchJadwal = async () => {
      try {
        const res = await fetch("/api/siswa/jadwal")
        if (res.ok) {
          setData(await res.json())
        }
      } catch (e) {
        console.error("Failed to load schedule data", e)
      } finally {
        setLoading(false)
      }
    }
    fetchJadwal()
  }, [])

  if (loading) {
    return <div className="h-[100dvh] w-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  const scheduleToday = data?.scheduleToday || []
  const todayDateStr = data?.todayDateStr || "Hari ini"

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="bg-primary rounded-3xl p-6 text-white shadow-lg shadow-primary/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <CalendarIcon className="w-5 h-5 text-primary-foreground/80" />
            <span className="text-sm text-primary-foreground/80 font-medium">Jadwal Hari Ini</span>
          </div>
          <h2 className="font-bold text-2xl">{todayDateStr}</h2>
          <p className="text-sm mt-1 text-primary-foreground/80">Fokus dan raih nilai terbaik!</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="px-2">
        <div className="relative border-l-2 border-slate-200 ml-4 space-y-6 pb-4">
          {scheduleToday.map((item: any, idx: number) => (
            <div key={idx} className="relative pl-6">
              {/* Timeline Dot */}
              <div className={`absolute -left-[9px] top-4 w-4 h-4 rounded-full border-4 border-white ${item.iconText.replace('text-', 'bg-')} shadow-sm`} />
              
              <Card className={`glass border-2 ${item.color} shadow-sm overflow-hidden`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-800 text-lg">{item.subject}</h3>
                    <div className="flex items-center gap-1 text-xs font-bold bg-white px-2 py-1 rounded-full shadow-sm text-slate-600 border">
                      <Clock className="w-3 h-3" /> {item.time}
                    </div>
                  </div>
                  
                  {item.subject !== "ISTIRAHAT" && (
                    <div className="space-y-1.5 mt-3">
                      <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                        <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center shrink-0 border">
                          <BookOpen className="w-3.5 h-3.5" />
                        </div>
                        {item.teacher}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                        <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center shrink-0 border">
                          <MapPin className="w-3.5 h-3.5" />
                        </div>
                        {item.room}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
