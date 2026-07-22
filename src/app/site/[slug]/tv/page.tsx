"use client"

import { useEffect, useState, useMemo, memo } from "react"
import { useParams } from "next/navigation"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { Clock, Calendar, Users, Loader2, BookOpen, UserCircle, QrCode, Maximize, Minimize, Activity, Radio, Sparkles, CheckCircle2 } from "lucide-react"
import QRCode from "react-qr-code"
import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { formatInTimeZone } from "date-fns-tz"

function isTimeActive(timeRange: string, currentMins: number): boolean {
  try {
    if (!timeRange) return true
    if (timeRange.toLowerCase().includes("hari ini")) return true
    
    const cleanRange = timeRange.replace(/\./g, ":").replace(/\s+/g, "")
    const parts = cleanRange.split(/[-–—]|s\/d|sd/i)
    if (parts.length < 2) return true
    
    const [startH, startM] = parts[0].split(":").map(Number)
    const [endH, endM] = parts[1].split(":").map(Number)
    
    if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return true
    
    const startMins = startH * 60 + startM
    const endMins = endH * 60 + endM
    
    return currentMins >= startMins && currentMins < endMins
  } catch {
    return true
  }
}

// Ultra-Sleek Financial/Display Style Clock & Header Widget
const LiveClock = memo(({ tz, isFullscreen, onToggleFullscreen }: { tz: string, isFullscreen: boolean, onToggleFullscreen: () => void }) => {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])
  return (
    <div className="flex items-center gap-4 bg-slate-900/90 backdrop-blur-2xl px-5 py-2 rounded-2xl border border-white/10 shadow-[0_0_25px_rgba(0,0,0,0.5)]">
      <div className="text-right">
        <p className="text-xs lg:text-sm font-semibold tracking-wide text-slate-300 capitalize">
          {formatInTimeZone(now, tz, "EEEE, dd MMMM yyyy", { locale: id })}
        </p>
        <span className="text-[9px] lg:text-[10px] uppercase font-bold tracking-widest text-emerald-400/90 flex items-center justify-end gap-1.5 mt-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          REALTIME DISPLAY
        </span>
      </div>
      <div className="h-8 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>
      <div className="flex items-baseline gap-0.5 font-mono tabular-nums tracking-tight">
        <span className="text-3xl lg:text-4xl font-extrabold text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]">
          {formatInTimeZone(now, tz, "HH:mm")}
        </span>
        <span className="text-lg lg:text-xl font-bold text-emerald-400">
          :{formatInTimeZone(now, tz, "ss")}
        </span>
      </div>
      <button 
        onClick={onToggleFullscreen}
        className="ml-1 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all border border-white/10 active:scale-95 group shadow-inner"
        title="Toggle Fullscreen Display"
      >
        {isFullscreen ? <Minimize className="h-4 w-4 group-hover:scale-110 transition-transform text-emerald-400" /> : <Maximize className="h-4 w-4 group-hover:scale-110 transition-transform text-emerald-400" />}
      </button>
    </div>
  )
})
LiveClock.displayName = "LiveClock"

// Glowing Financial-Style Progress Bar
const ClassProgressBar = memo(({ startTime, endTime, tz }: { startTime: string, endTime: string, tz: string }) => {
  const [progress, setProgress] = useState(0)
  
  useEffect(() => {
    const calculateProgress = () => {
      const now = new Date()
      const tzTimeStr = formatInTimeZone(now, tz, "HH:mm:ss")
      const [nowH, nowM, nowS] = tzTimeStr.split(':').map(Number)
      
      const currentSecs = nowH * 3600 + nowM * 60 + nowS
      
      const [startH, startM] = startTime.split(':').map(Number)
      const [endH, endM] = endTime.split(':').map(Number)
      
      const startSecs = startH * 3600 + startM * 60
      const endSecs = endH * 3600 + endM * 60
      
      if (currentSecs <= startSecs) return 0
      if (currentSecs >= endSecs) return 100
      
      return ((currentSecs - startSecs) / (endSecs - startSecs)) * 100
    }
    
    setProgress(calculateProgress())
    const timer = setInterval(() => setProgress(calculateProgress()), 5000)
    return () => clearInterval(timer)
  }, [startTime, endTime, tz])

  return (
    <div className="w-full bg-slate-950/60 h-2 mt-3 rounded-full overflow-hidden border border-white/10 p-0.5 relative">
      <div 
        className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-1000 ease-linear rounded-full relative shadow-[0_0_12px_rgba(16,185,129,0.8)]"
        style={{ width: `${progress}%` }}
      >
        <div className="absolute right-0 top-0 bottom-0 w-3 bg-white/80 blur-[2px] animate-pulse"></div>
      </div>
    </div>
  )
})
ClassProgressBar.displayName = "ClassProgressBar"

// Sleek Teacher Row with Live Pulse Indicator
const TeacherRow = memo(({ s }: { s: any }) => (
  <div className={cn(
    "flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all duration-300 backdrop-blur-md shadow-sm",
    s.isTeaching 
      ? "bg-gradient-to-r from-emerald-950/50 via-slate-900/80 to-slate-900/80 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
      : "bg-slate-950/40 border-white/5 hover:border-white/10"
  )}>
    <div className="flex items-center gap-3 truncate pr-2">
      {/* Live Status Pulse Dot */}
      <div className="relative flex h-2.5 w-2.5 shrink-0">
        {s.isTeaching ? (
          <>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)]"></span>
          </>
        ) : (
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-700"></span>
        )}
      </div>
      
      {/* Avatar */}
      <Avatar className="h-8 w-8 border border-white/15 shrink-0 shadow-md">
        <AvatarImage src={s.image} alt={s.name} className="object-cover" />
        <AvatarFallback className="bg-slate-800 text-slate-300 font-bold text-[10px]">
          {s.name ? s.name.substring(0, 2).toUpperCase() : "G"}
        </AvatarFallback>
      </Avatar>

      <div className="flex flex-col gap-0.5 truncate">
        <span className={cn("font-bold truncate tracking-tight", s.isTeaching ? "text-white" : "text-slate-300")}>{s.name}</span>
        <span className="text-[10px] text-slate-400 truncate font-medium">{s.role || "Pendidik"}</span>
      </div>
    </div>
    {s.isTeaching ? (
      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-[10px] tracking-wider uppercase shrink-0 shadow-sm">
        {s.classroomName}
      </span>
    ) : (
      <span className="px-2.5 py-0.5 rounded-lg bg-slate-800/80 text-slate-400 border border-white/10 font-medium text-[10px] shrink-0">
        Standby
      </span>
    )}
  </div>
))
TeacherRow.displayName = "TeacherRow"

export default function SchoolTvPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [minuteTick, setMinuteTick] = useState(0) 
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activePageIndex, setActivePageIndex] = useState(0)

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.error(err))
    } else {
      if (document.exitFullscreen) document.exitFullscreen()
    }
  }

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", handleFsChange)
    return () => document.removeEventListener("fullscreenchange", handleFsChange)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setMinuteTick(prev => prev + 1)
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  const fetchData = async () => {
    try {
      const activeTz = data?.tenant?.settings?.timezone || "Asia/Jakarta"
      const currentNow = new Date()
      const dayOfWeekStr = formatInTimeZone(currentNow, activeTz, "i")
      const dayOfWeek = dayOfWeekStr === "7" ? 0 : parseInt(dayOfWeekStr)
      
      const res = await fetch(`/api/tv/data?slug=${slug}&day=${dayOfWeek}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
        setError(null)
      } else {
        const errJson = await res.json().catch(() => ({}))
        setError(errJson.error || `Server error (${res.status})`)
      }
    } catch (e: any) {
      console.error(e)
      setError(e.message || "Connection error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!slug) return
    fetchData()
  }, [slug, minuteTick]) 

  const tz = data?.tenant?.settings?.timezone || "Asia/Jakarta"
  const tvBarcode = data?.tenant?.settings?.tvBarcode || null
  
  const { currentMins, activeSchedules, upcomingSchedules, activePiket, staffStatuses, totalPages, pagedActiveSchedules } = useMemo(() => {
    const currentNow = new Date()
    const tzTimeStr = formatInTimeZone(currentNow, tz, "HH:mm")
    const [tzH, tzM] = tzTimeStr.split(':').map(Number)
    const mins = tzH * 60 + tzM

    const activeScheds = data?.schedules
      ? data.schedules.filter((s: any) => {
          if (!s.startTime || !s.endTime) return false
          const [startH, startM] = s.startTime.split(':').map(Number)
          const [endH, endM] = s.endTime.split(':').map(Number)
          const startMins = startH * 60 + startM
          const endMins = endH * 60 + endM
          return mins >= startMins && mins < endMins
        })
      : []

    const upcomingScheds = data?.schedules
      ? data.schedules.filter((s: any) => {
          if (!s.startTime || !s.endTime) return false
          const [startH, startM] = s.startTime.split(':').map(Number)
          const startMins = startH * 60 + startM
          return startMins > mins
        })
      : []

    const piket = (data?.piket || []).filter((p: any) => isTimeActive(p.time || "", mins)).map((p: any) => {
      const matchedStaff = (data?.allStaff || []).filter((s: any) => {
        if (!s.name) return false;
        return p.names?.toLowerCase().includes(s.name.toLowerCase());
      });
      return {
        ...p,
        matchedStaff
      }
    });

    const staffStat = (data?.allStaff || [])
      .map((staff: any) => {
        const activeLesson = activeScheds.find((s: any) => s.staffId === staff.id)
        return {
          id: staff.id,
          name: staff.name,
          role: staff.role,
          image: staff.image || staff.imageUrl,
          isTeaching: !!activeLesson,
          classroomName: activeLesson?.classroom?.name,
          subjectName: activeLesson?.subject?.name || activeLesson?.breakName
        }
      })
      .sort((a: any, b: any) => {
        if (a.isTeaching && !b.isTeaching) return -1
        if (!a.isTeaching && b.isTeaching) return 1
        return a.name.localeCompare(b.name)
      })

    const limit = 24
    const totalPgs = Math.ceil(activeScheds.length / limit)
    const paged = activeScheds.slice(activePageIndex * limit, (activePageIndex + 1) * limit)

    return { currentMins: mins, activeSchedules: activeScheds, upcomingSchedules: upcomingScheds, activePiket: piket, staffStatuses: staffStat, totalPages: totalPgs, pagedActiveSchedules: paged }
  }, [data, tz, minuteTick, activePageIndex])

  useEffect(() => {
    if (totalPages <= 1) {
      setActivePageIndex(0)
      return
    }
    const interval = setInterval(() => {
      setActivePageIndex(prev => (prev + 1) % totalPages)
    }, 10000)
    return () => clearInterval(interval)
  }, [totalPages])

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white px-4 text-center">
        <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
          <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-2">Gagal Memuat Layar TV Sekolah</h2>
        <p className="text-slate-400 max-w-md mb-6 text-sm">{error}</p>
        <button 
          onClick={() => { setLoading(true); setError(null); fetchData(); }}
          className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl border border-white/10 transition-colors font-medium text-sm shadow-lg"
        >
          Coba Lagi
        </button>
      </div>
    )
  }

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-400 mb-4" />
        <h2 className="text-xl font-semibold tracking-wide">Memuat Display TV Digital...</h2>
      </div>
    )
  }

  const activeTeachingCount = staffStatuses.filter((s: any) => s.isTeaching).length

  return (
    <div className="h-screen h-[100dvh] w-screen bg-slate-950 text-slate-50 flex flex-col overflow-hidden font-sans selection:bg-emerald-500/30">
      
      {/* FINANCIAL DISPLAY STYLE HEADER */}
      <header className="h-[76px] shrink-0 bg-slate-900/90 border-b border-white/10 flex items-center justify-between px-6 lg:px-8 shadow-2xl backdrop-blur-2xl z-20">
        
        {/* Left: Branding & Tenant Logo */}
        <div className="flex items-center gap-4">
          {data.tenant?.logo ? (
            <div className="relative h-12 w-12 rounded-2xl overflow-hidden bg-gradient-to-br from-white/10 to-white/5 p-1 border border-white/20 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <Image src={data.tenant.logo} alt="Logo" fill className="object-contain p-1" />
            </div>
          ) : (
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 flex items-center justify-center border border-white/20 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl lg:text-2xl font-black tracking-tight text-white drop-shadow-md">
                {data.tenant?.name || "SchoolPro"}
              </h1>
              
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full shadow-inner">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">LIVE SIGNAGE</span>
              </div>

              {totalPages > 1 && (
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-cyan-500/30 animate-pulse">
                  HAL {activePageIndex + 1}/{totalPages}
                </span>
              )}
            </div>
            <p className="text-emerald-400 font-bold tracking-[0.2em] uppercase text-[10px] mt-0.5">Sistem Informasi Digital Display</p>
          </div>
        </div>

        {/* Center: Quick Realtime Financial-Style Metric Counters */}
        <div className="hidden lg:flex items-center gap-3 bg-slate-950/60 p-1.5 rounded-2xl border border-white/10 shadow-inner">
          <div className="flex items-center gap-2 px-3.5 py-1 rounded-xl bg-white/5 border border-white/5">
            <Activity className="h-4 w-4 text-emerald-400" />
            <div className="text-left leading-none">
              <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Kelas Aktif</p>
              <p className="text-xs font-extrabold text-white mt-0.5">{activeSchedules.length} Kelas</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-1 rounded-xl bg-white/5 border border-white/5">
            <Users className="h-4 w-4 text-cyan-400" />
            <div className="text-left leading-none">
              <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Guru Mengajar</p>
              <p className="text-xs font-extrabold text-white mt-0.5">{activeTeachingCount} / {staffStatuses.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-1 rounded-xl bg-white/5 border border-white/5">
            <ShieldCheckIcon className="h-4 w-4 text-blue-400" />
            <div className="text-left leading-none">
              <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Guru Piket</p>
              <p className="text-xs font-extrabold text-white mt-0.5">{activePiket.length} Petugas</p>
            </div>
          </div>
        </div>

        {/* Right: Live Clock & Fullscreen Switcher */}
        <LiveClock tz={tz} isFullscreen={isFullscreen} onToggleFullscreen={toggleFullscreen} />
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 min-h-0 flex gap-6 p-6 overflow-hidden relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
        
        {/* Ambient Glow Effects */}
        <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-emerald-500/10 blur-[150px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-cyan-500/10 blur-[150px] rounded-full pointer-events-none"></div>

        {/* Left Column: Schedule Grid Cards */}
        <div className="flex-1 flex flex-col h-full min-h-0 z-10 relative">
          <div className="flex-1 overflow-hidden relative">
            <div className="absolute inset-0 overflow-y-auto pb-4 hide-scrollbar scroll-smooth flex flex-col">
              
              {pagedActiveSchedules.length === 0 ? (
                /* Sleek Bank Display Empty State (Break/Finished) */
                <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5"></div>
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="relative mb-5">
                      <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full"></div>
                      <div className="h-24 w-24 rounded-3xl bg-slate-800/80 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                        <Clock className="h-12 w-12 text-emerald-400 animate-pulse" />
                      </div>
                    </div>
                    <h2 className="text-3xl lg:text-4xl font-black text-white mb-2 tracking-tight drop-shadow-md">
                      Waktu Istirahat / Selesai KBM
                    </h2>
                    <p className="text-sm text-slate-400 max-w-lg mb-6 font-medium leading-relaxed">
                      Saat ini tidak ada kegiatan belajar mengajar aktif di kelas. Layar akan otomatis diperbarui saat jam pelajaran berikutnya dimulai.
                    </p>
                    
                    {activePiket.length > 0 && (
                      <div className="bg-slate-950/80 border border-white/10 rounded-2xl px-6 py-3 flex items-center gap-3 shadow-xl backdrop-blur-md">
                        <Users className="h-5 w-5 text-emerald-400 shrink-0" />
                        <span className="text-xs text-slate-300 font-semibold">
                          Petugas Piket Siap Membantu: <strong className="text-white font-bold">{activePiket.map((p: any) => p.names).join(", ")}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Bank-Style Active Schedule Grid */
                <div className={cn(
                  "grid gap-4 pb-4",
                  pagedActiveSchedules.length <= 6
                    ? "grid-cols-2 xl:grid-cols-3"
                    : "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                )}>
                  {pagedActiveSchedules.map((s: any, i: number) => {
                    const isCompact = activeSchedules.length > 6
                    return (
                      <div 
                        key={i} 
                        className={cn(
                          "rounded-2xl border shadow-xl relative overflow-hidden flex flex-col h-full transition-all duration-300 backdrop-blur-2xl group",
                          s.isBreak 
                            ? "bg-gradient-to-br from-amber-950/60 via-slate-900/80 to-slate-950/90 border-amber-500/30 shadow-[0_10px_30px_rgba(245,158,11,0.1)]" 
                            : "bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950/90 border-white/10 hover:border-emerald-500/40 shadow-[0_10px_30px_rgba(0,0,0,0.5)]",
                          isCompact ? "p-4" : "p-5"
                        )} 
                        style={{ animationDelay: `${i * 80}ms` }}
                      >
                        {/* Accent Top Glow Bar */}
                        <div className={cn(
                          "absolute top-0 left-0 right-0 h-1",
                          s.isBreak ? "bg-gradient-to-r from-amber-500 to-amber-300" : "bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500"
                        )}></div>

                        {/* Top Time Pill */}
                        <div className="flex items-center justify-between mb-3">
                          <div className={cn(
                            "rounded-xl font-black uppercase tracking-wider flex items-center justify-center text-white shadow-md",
                            s.isBreak 
                              ? "bg-gradient-to-br from-amber-500 to-amber-600 shadow-amber-500/20" 
                              : "bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 shadow-emerald-500/20",
                            isCompact ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"
                          )}>
                            {s.classroom.name}
                          </div>
                          
                          <span className={cn(
                            "font-mono font-bold rounded-xl uppercase tracking-wider border backdrop-blur-md",
                            s.isBreak ? "bg-amber-500/10 text-amber-300 border-amber-500/30" : "bg-slate-800/80 text-emerald-400 border-emerald-500/30",
                            isCompact ? "text-[11px] px-2.5 py-0.5" : "text-xs px-3 py-1"
                          )}>
                            {s.startTime} - {s.endTime}
                          </span>
                        </div>
                        
                        {/* Subject Title */}
                        <div className="mb-3 flex-1">
                          <h3 className={cn(
                            "font-extrabold text-white leading-tight line-clamp-2 drop-shadow-sm group-hover:text-emerald-300 transition-colors", 
                            isCompact ? "text-base" : "text-lg"
                          )}>
                            {s.subject?.name || s.breakName || "Mata Pelajaran"}
                          </h3>
                        </div>

                        {/* Teacher Profile & Progress */}
                        <div className="mt-auto pt-2 border-t border-white/5">
                           {!s.isBreak ? (
                             <div className="flex items-center gap-3">
                               {s.staff?.imageUrl ? (
                                 <Image src={s.staff.imageUrl} alt={s.staff.name} width={40} height={40} className={cn("rounded-xl object-cover border border-white/20 shadow-md shrink-0", isCompact ? "h-8 w-8" : "h-10 w-10")} unoptimized />
                               ) : (
                                 <div className={cn("rounded-xl bg-slate-800 flex items-center justify-center border border-white/10 shrink-0", isCompact ? "h-8 w-8" : "h-10 w-10")}>
                                   <UserCircle className={cn("text-slate-400", isCompact ? "h-5 w-5" : "h-6 w-6")} />
                                 </div>
                               )}
                               <div className="truncate min-w-0 flex-1">
                                 <p className="text-xs font-bold text-slate-100 truncate">{s.staff?.name || "-"}</p>
                                 <p className="text-[10px] text-emerald-400/80 font-semibold tracking-wide uppercase">Guru Pengampu</p>
                               </div>
                             </div>
                           ) : (
                             <div className="flex items-center gap-2.5">
                               <div className={cn("rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30 shrink-0", isCompact ? "h-8 w-8" : "h-10 w-10")}>
                                 <Clock className={cn("text-amber-400", isCompact ? "h-4 w-4" : "h-5 w-5")} />
                               </div>
                               <div className="truncate min-w-0 flex-1">
                                 <p className="text-xs font-bold text-amber-300 truncate">Waktu Istirahat</p>
                                 <p className="text-[10px] text-amber-400/70 font-semibold uppercase">Jam Bebas Siswa</p>
                               </div>
                             </div>
                           )}
                           
                           <ClassProgressBar startTime={s.startTime} endTime={s.endTime} tz={tz} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar Widgets */}
        <div className="w-[360px] lg:w-[380px] shrink-0 flex flex-col gap-4 z-10 h-full min-h-0">
          
          {/* Guru Piket Widget */}
          <div className="bg-slate-900/80 backdrop-blur-2xl rounded-3xl border border-white/10 p-4 shadow-2xl relative overflow-hidden flex flex-col shrink-0 max-h-[220px]">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-cyan-400"></div>
             <h3 className="text-sm font-bold mb-2.5 flex items-center gap-2 text-white shrink-0">
               <ShieldCheckIcon className="h-4 w-4 text-blue-400" /> Guru Piket Hari Ini
             </h3>
              <div className="space-y-2 overflow-y-auto hide-scrollbar pr-1">
                {activePiket.length > 0 ? activePiket.map((p: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 bg-slate-950/60 p-2.5 rounded-2xl border border-white/5 shadow-inner backdrop-blur-sm">
                    {p.matchedStaff && p.matchedStaff.length > 0 && (
                      <div className="flex -space-x-2 shrink-0">
                        {p.matchedStaff.map((staff: any, idx: number) => (
                          <Avatar key={idx} className="h-7 w-7 border-2 border-slate-900 shrink-0 shadow-md">
                            <AvatarImage src={staff.imageUrl || staff.image} alt={staff.name} className="object-cover" />
                            <AvatarFallback className="bg-blue-900 text-blue-200 font-bold text-[9px]">
                              {staff.name ? staff.name.substring(0, 2).toUpperCase() : "GP"}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                    )}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <p className="font-bold text-slate-100 text-xs leading-snug truncate">{p.names}</p>
                      <span className="text-[10px] text-blue-400 font-mono font-semibold tracking-wide mt-0.5">
                        {p.time}
                      </span>
                    </div>
                  </div>
                )) : (
                  <p className="text-xs text-slate-400 text-center py-3">Tidak ada petugas piket aktif saat ini.</p>
                )}
              </div>
          </div>

          {/* Teacher Teaching Status Widget */}
          {staffStatuses.length > 0 && (
            <div className="bg-slate-900/80 backdrop-blur-2xl rounded-3xl border border-white/10 p-4 shadow-2xl flex flex-col flex-1 min-h-0">
              <h3 className="text-sm font-bold mb-3 flex items-center justify-between text-white shrink-0">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-indigo-400" /> Status Mengajar Guru
                </span>
                <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30 font-bold">
                  {activeTeachingCount} MENGAJAR
                </span>
              </h3>
              
              <div className="flex-1 relative min-h-0">
                {/* Edge Fading Gradient Masks */}
                <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-slate-900/80 to-transparent z-10 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-slate-900/80 to-transparent z-10 pointer-events-none"></div>
                
                {/* ABSOLUTE POSITIONED SCROLLING CONTAINER (0 Overflow Guarantee) */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className={cn("flex flex-col gap-2", staffStatuses.length > 5 ? "animate-scroll-up" : "")}>
                    <div className="flex flex-col gap-2">
                      {staffStatuses.map((s: any, i: number) => (
                        <TeacherRow key={i} s={s} />
                      ))}
                    </div>
                    {/* Duplicate set for infinite vertical marquee if list is long */}
                    {staffStatuses.length > 5 && (
                      <div className="flex flex-col gap-2">
                        {staffStatuses.map((s: any, i: number) => (
                          <TeacherRow key={`dup-${i}`} s={s} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Barcode & Payment/Donation Widget */}
          {tvBarcode?.image || tvBarcode?.bankAccount ? (
            <div className="bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-slate-950 backdrop-blur-2xl rounded-3xl border border-emerald-500/30 p-3.5 shadow-2xl flex flex-col items-center justify-center text-center relative overflow-hidden shrink-0">
              <div className="absolute inset-0 bg-emerald-500/5 blur-xl pointer-events-none"></div>
              
              <h3 className="text-xs font-bold text-emerald-400 mb-1.5 flex items-center gap-1.5 relative z-10">
                <QrCode className="h-3.5 w-3.5" /> Pembayaran / Donasi Resmi
              </h3>
              
              {tvBarcode.image && (
                <div className="bg-white p-1.5 rounded-2xl shadow-xl mb-1.5 h-24 w-24 relative border border-white/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={tvBarcode.image} alt="Barcode" className="w-full h-full object-contain rounded-xl" />
                </div>
              )}
              
              {tvBarcode.bankAccount && (
                <div className="bg-slate-950/80 w-full px-3 py-1 rounded-xl border border-white/10 shadow-inner">
                  <p className="text-[11px] font-mono font-black tracking-widest text-white">{tvBarcode.bankAccount}</p>
                  {tvBarcode.accountName && (
                    <p className="text-[9px] text-slate-400 mt-0.5 font-semibold uppercase truncate">A.N. {tvBarcode.accountName}</p>
                  )}
                </div>
              )}
            </div>
          ) : data.donation ? (
            <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900/90 to-slate-950 backdrop-blur-2xl rounded-3xl border border-emerald-500/30 p-4 shadow-2xl flex flex-col items-center justify-center text-center relative overflow-hidden shrink-0">
              <QrCode className="h-6 w-6 text-emerald-400 mb-1.5" />
              <h3 className="text-xs font-bold text-emerald-300 mb-1 leading-tight">{data.donation.title}</h3>
              <p className="text-[10px] text-slate-400 mb-2 max-w-[220px]">Scan barcode di bawah ini untuk berpartisipasi.</p>
              
              <div className="bg-white p-2 rounded-2xl shadow-2xl">
                <QRCode 
                  value={`${window.location.origin}/site/${slug}/donasi/${data.donation.slug || data.donation.id}`} 
                  size={110}
                  level="H"
                />
              </div>
              <p className="text-[9px] uppercase tracking-widest text-emerald-400 font-bold mt-2">Arahkan Kamera HP Anda</p>
            </div>
          ) : null}

        </div>
      </main>

      {/* BANK / TV NEWS STYLE TICKER FOOTER */}
      <footer className="h-[56px] shrink-0 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 flex items-center overflow-hidden z-30 border-t border-emerald-500/30">
        
        {/* Ticker Category Label */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs px-6 h-full flex items-center gap-2 shrink-0 shadow-2xl tracking-wider uppercase z-10 border-r border-emerald-400/30">
          <Radio className="h-4 w-4 animate-pulse" />
          INFORMASI SEKOLAH
        </div>

        {/* Ticker Marquee Track */}
        <div className="flex-1 overflow-hidden relative flex items-center h-full bg-slate-950/80">
          <div className="whitespace-nowrap animate-marquee text-base font-semibold text-slate-100 tracking-wide">
            {(() => {
              const rawMarquee = data.tenant?.settings?.marqueeText?.trim() || `Selamat Datang di ${data.tenant?.name || "Sistem Digital Sekolah"}! Mari bersama mewujudkan pendidikan berkualitas & berkarakter. \n Mohon senantiasa menjaga kebersihan dan ketertiban di lingkungan sekolah. \n Petugas piket hari ini: ${activePiket?.map((p:any) => `${p.names} (${p.time})`).join(" | ") || "-"}`
              const marqueeItems = rawMarquee.split('\n').map((item: string) => item.trim()).filter(Boolean)
              return (
                <>
                  {marqueeItems.map((text: string, idx: number) => (
                    <span key={`m1-${idx}`} className="mx-8 inline-flex items-center gap-4">
                      {text}
                      <span className="text-emerald-400 text-sm shadow-emerald-500">•</span>
                    </span>
                  ))}
                  {/* Duplicate for seamless continuous looping */}
                  {marqueeItems.map((text: string, idx: number) => (
                    <span key={`m2-${idx}`} className="mx-8 inline-flex items-center gap-4">
                      {text}
                      <span className="text-emerald-400 text-sm shadow-emerald-500">•</span>
                    </span>
                  ))}
                </>
              )
            })()}
          </div>
        </div>
      </footer>

      {/* Internal CSS for Smooth Marquee */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 30s linear infinite;
        }
        
        @keyframes scrollUp {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        .animate-scroll-up {
          animation: scrollUp 40s linear infinite;
        }

        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  )
}

function ShieldCheckIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
}
