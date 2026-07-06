"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Clock, MapPin, Users, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const DAYS = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]

export default function JadwalPage() {
  const { data: session } = useSession()
  const tenantId = session?.user?.tenants?.[0]?.id

  const [loading, setLoading] = useState(true)
  const [schedules, setSchedules] = useState<any[]>([])
  
  const currentDayOfWeek = new Date().getDay() || 7 // 1-7
  const [activeDay, setActiveDay] = useState(currentDayOfWeek)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)

  useEffect(() => {
    setCurrentTime(new Date())
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!tenantId) return
    fetchSchedules()
  }, [tenantId])

  const fetchSchedules = async () => {
    try {
      const res = await fetch(`/api/gtk/schedule?tenantId=${tenantId}`)
      if (res.ok) {
        const data = await res.json()
        setSchedules(data.schedules || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Group schedules by day
  const grouped = DAYS.map((_, i) => ({
    dayIndex: i,
    dayName: DAYS[i],
    items: schedules.filter(s => s.dayOfWeek === i)
  })).filter(g => g.dayIndex > 0) // Remove empty 0 index

  if (loading) return <div className="skeleton h-96 rounded-3xl" />

  return (
    <div className="space-y-6 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary" /> Jadwal Mengajar
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Jadwal pelajaran mingguan atau *roster* kelas Anda.</p>
      </div>

      {/* Day Tabs */}
      <div className="flex overflow-x-auto scrollbar-hide gap-2 py-2">
        {grouped.map(group => (
          <Button
            key={group.dayIndex}
            onClick={() => setActiveDay(group.dayIndex)}
            className={cn(
              "px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-300",
              activeDay === group.dayIndex
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
          >
            {group.dayName}
            {group.items.length > 0 && (
              <span className={cn(
                "ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px]",
                activeDay === group.dayIndex ? "bg-primary-foreground/20 text-white" : "bg-muted-foreground/20 text-muted-foreground"
              )}>
                {group.items.length}
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Schedule List */}
      <div className="space-y-4">
        {grouped.find(g => g.dayIndex === activeDay)?.items.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 border border-dashed rounded-3xl">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="font-semibold text-muted-foreground text-lg">Hari Kosong</h3>
            <p className="text-sm text-muted-foreground mt-1">Anda tidak memiliki jadwal mengajar di hari {DAYS[activeDay]}.</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-[59px] sm:left-[79px] top-4 bottom-4 w-px bg-border/50"></div>
            
            <div className="space-y-6">
              {grouped.find(g => g.dayIndex === activeDay)?.items.map((schedule, idx) => {
                let isActive = false
                let isPast = false
                if (activeDay === currentDayOfWeek && currentTime && schedule.startTime && schedule.endTime) {
                  const currentMins = currentTime.getHours() * 60 + currentTime.getMinutes()
                  const [startH, startM] = schedule.startTime.split(':').map(Number)
                  const [endH, endM] = schedule.endTime.split(':').map(Number)
                  const startMins = startH * 60 + startM
                  const endMins = endH * 60 + endM
                  if (currentMins >= startMins && currentMins <= endMins) isActive = true
                  if (currentMins > endMins) isPast = true
                }

                return (
                <div key={schedule.id} className={cn("relative flex items-start gap-4 sm:gap-6 group transition-all duration-500", isPast ? "opacity-50 grayscale-[0.5] hover:opacity-100" : "")}>
                  {/* Time Badge */}
                  <div className={cn("flex flex-col items-end w-[44px] sm:w-[56px] shrink-0 pt-2", isActive ? "text-emerald-600 dark:text-emerald-400" : "")}>
                    <span className="text-sm sm:text-base font-black leading-none">{schedule.startTime}</span>
                    <span className="text-[10px] text-muted-foreground mt-1">{schedule.endTime}</span>
                  </div>

                  {/* Timeline Dot */}
                  <div className={cn("relative z-10 w-4 h-4 rounded-full bg-background border-4 mt-3 shrink-0 shadow-sm transition-all duration-300", isActive ? "border-emerald-500 shadow-emerald-500/50 scale-125" : "border-primary shadow-primary/20 group-hover:scale-125")}>
                    {isActive && <span className="absolute inset-0 rounded-full bg-emerald-500/40 animate-ping -m-1"></span>}
                  </div>

                  {/* Content Card */}
                  <Card className={cn("glass border-0 shadow-sm flex-1 overflow-hidden transition-all duration-300", isActive && !schedule.isBreak ? "bg-emerald-500/5 shadow-emerald-500/10 ring-1 ring-emerald-500/30 scale-[1.01]" : schedule.isBreak ? "bg-amber-500/10 ring-1 ring-amber-500/20" : "group-hover:shadow-md")}>
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={cn("text-xs font-bold px-2 py-0.5 rounded-md flex items-center gap-1", schedule.isBreak ? "bg-amber-500/20 text-amber-700 dark:text-amber-400" : isActive ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-primary/10 text-primary")}>
                              <BookOpen className="h-3 w-3" /> {schedule.isBreak ? "Istirahat" : schedule.subject?.name}
                            </span>
                            {isActive && (
                              <span className={cn("text-[10px] font-black uppercase tracking-wider text-white px-2 py-0.5 rounded-full animate-pulse shadow-sm", schedule.isBreak ? "bg-amber-500" : "bg-emerald-500")}>
                                {schedule.isBreak ? "Waktu Istirahat" : "Sedang Berlangsung"}
                              </span>
                            )}
                          </div>
                          <h3 className={cn("font-bold text-lg leading-tight", schedule.isBreak ? "text-amber-700/90 dark:text-amber-500/90" : "")}>
                            {schedule.isBreak ? schedule.breakName || "Istirahat" : `Kelas ${schedule.classroom?.name}`}
                          </h3>
                          
                          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground font-medium">
                            {!schedule.isBreak && (
                              <span className="flex items-center gap-1.5">
                                <Users className="h-4 w-4" /> Tingkat {schedule.classroom?.level || '-'}
                              </span>
                            )}
                            <span className="flex items-center gap-1.5">
                              <Clock className="h-4 w-4" /> {schedule.startTime} - {schedule.endTime}
                            </span>
                          </div>
                        </div>

                        {(activeDay === currentDayOfWeek && !isPast && !schedule.isBreak) && (
                          <div className="shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                            <Link href="/panel-gtk/jurnal">
                              <Button className={cn("w-full rounded-xl shadow-md transition-all", isActive ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/30 hover:scale-105 animate-pulse" : "shadow-primary/20 hover:scale-105")}>
                                Isi Jurnal & Absen
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
