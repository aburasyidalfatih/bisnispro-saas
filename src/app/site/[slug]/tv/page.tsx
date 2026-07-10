"use client"

import { useEffect, useState, useMemo, memo } from "react"
import { useParams } from "next/navigation"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { Clock, Calendar, Users, Loader2, BookOpen, UserCircle, QrCode, Maximize, Minimize } from "lucide-react"
import QRCode from "react-qr-code"
import Image from "next/image"
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

// Separate Clock component to prevent full page re-renders every second
const LiveClock = memo(({ tz, isFullscreen, onToggleFullscreen }: { tz: string, isFullscreen: boolean, onToggleFullscreen: () => void }) => {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])
  return (
    <div className="flex items-center gap-6 bg-black/30 px-6 py-3 rounded-2xl border border-white/5">
      <div className="text-right">
        <p className="text-lg font-medium text-slate-300">
          {formatInTimeZone(now, tz, "EEEE, dd MMMM yyyy", { locale: id })}
        </p>
      </div>
      <div className="h-10 w-px bg-white/10"></div>
      <div className="text-5xl font-black tabular-nums tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">
        {formatInTimeZone(now, tz, "HH:mm")}
        <span className="text-2xl text-emerald-400 ml-1">{formatInTimeZone(now, tz, "ss")}</span>
      </div>
      <button 
        onClick={onToggleFullscreen}
        className="ml-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors border border-white/10 group"
        title="Toggle Fullscreen"
      >
        {isFullscreen ? <Minimize className="h-5 w-5 group-hover:scale-110 transition-transform" /> : <Maximize className="h-5 w-5 group-hover:scale-110 transition-transform" />}
      </button>
    </div>
  )
})
LiveClock.displayName = "LiveClock"

// Live Progress Bar Component for individual classes
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
    const timer = setInterval(() => setProgress(calculateProgress()), 10000) // Update every 10 seconds
    return () => clearInterval(timer)
  }, [startTime, endTime, tz])

  return (
    <div className="w-full bg-slate-800/50 h-1.5 mt-4 rounded-full overflow-hidden border border-white/5">
      <div 
        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000 ease-linear rounded-full relative"
        style={{ width: `${progress}%` }}
      >
        <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/50 blur-[2px]"></div>
      </div>
    </div>
  )
})
ClassProgressBar.displayName = "ClassProgressBar"


export default function SchoolTvPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // For minute-based updates without re-rendering every second
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

  // Minute tick to trigger recalculations
  useEffect(() => {
    const timer = setInterval(() => {
      setMinuteTick(prev => prev + 1)
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  const fetchData = async () => {
    try {
      // Calculate dayOfWeek freshly on every fetch to avoid stale closure if TV runs 24/7
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

  // Fetch every 1 minute
  useEffect(() => {
    if (!slug) return
    fetchData()
  }, [slug, minuteTick]) 


  const tz = data?.tenant?.settings?.timezone || "Asia/Jakarta"
  
  // Use useMemo to only recalculate when minuteTick or data changes
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
          // FIX: Use < endMins so overlapping classes (e.g. 07:00-08:30 and 08:30-10:00) switch cleanly
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

    const piket = (data?.piket || []).filter((p: any) => isTimeActive(p.time || "", mins))

    const staffStat = (data?.allStaff || [])
      .map((staff: any) => {
        const activeLesson = activeScheds.find((s: any) => s.staffId === staff.id)
        return {
          id: staff.id,
          name: staff.name,
          role: staff.role,
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

    const limit = 12
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
    }, 10000) // Switch page every 10 seconds
    return () => clearInterval(interval)
  }, [totalPages])

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white px-4 text-center">
        <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/20">
          <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-2">Gagal Memuat Layar TV Sekolah</h2>
        <p className="text-slate-400 max-w-md mb-6 text-sm">{error}</p>
        <button 
          onClick={() => { setLoading(true); setError(null); fetchData(); }}
          className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl border border-white/10 transition-colors font-medium text-sm"
        >
          Coba Lagi
        </button>
      </div>
    )
  }

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mb-4" />
        <h2 className="text-xl font-semibold">Memuat Sistem TV Sekolah...</h2>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col overflow-hidden font-sans selection:bg-emerald-500/30">
      {/* HEADER */}
      <header className="h-[10dvh] min-h-[80px] bg-slate-900/80 border-b border-white/10 flex items-center justify-between px-8 shadow-lg backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-4">
          {data.tenant?.logo ? (
            <div className="relative h-14 w-14 rounded-full overflow-hidden bg-white/10 p-1 border border-white/20">
              <Image src={data.tenant.logo} alt="Logo" fill className="object-contain p-1" />
            </div>
          ) : (
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center border border-white/20">
              <BookOpen className="h-7 w-7 text-white" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">{data.tenant?.name || "SchoolPro"}</h1>
            <p className="text-emerald-400 font-medium tracking-widest uppercase text-sm">Sistem Informasi Digital</p>
          </div>
        </div>

        <LiveClock tz={tz} isFullscreen={isFullscreen} onToggleFullscreen={toggleFullscreen} />
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex gap-6 p-6 overflow-hidden relative">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none"></div>

        {/* Left Column: Live Schedule Grid */}
        <div className="flex-1 flex flex-col h-full z-10 relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
            </div>
            <h2 className="text-2xl font-bold uppercase tracking-widest text-slate-200">Sedang Berlangsung</h2>
            {totalPages > 1 && (
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full font-bold uppercase tracking-wider animate-pulse ml-2 border border-emerald-500/30">
                Halaman {activePageIndex + 1} dari {totalPages}
              </span>
            )}
          </div>

          <div className="flex-1 overflow-hidden relative min-h-[300px]">
            <div className="absolute inset-0 overflow-y-auto pb-10 hide-scrollbar scroll-smooth flex flex-col">
              {pagedActiveSchedules.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-white/5 rounded-3xl border border-white/10 p-12 backdrop-blur-sm">
                  <div className="relative">
                     <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full"></div>
                     <Clock className="h-32 w-32 mb-6 text-slate-600/50 relative z-10 animate-pulse" />
                  </div>
                  <h2 className="text-4xl font-extrabold text-white mb-3 tracking-tight">Waktu Istirahat / Selesai</h2>
                  <p className="text-lg font-medium text-slate-400">Tidak ada jadwal kelas aktif untuk saat ini.</p>
                </div>
              ) : (
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
                          "bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700/80 shadow-2xl relative overflow-hidden flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 backdrop-blur-xl",
                          isCompact ? "p-4" : "p-6"
                        )} 
                        style={{ animationDelay: `${i * 100}ms` }}
                      >
                        <div className="absolute top-0 right-0 p-3">
                           <span className={cn(
                             "font-black bg-emerald-500/20 text-emerald-400 rounded-full uppercase tracking-wider border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]",
                             isCompact ? "text-[10px] px-2 py-0.5" : "text-xs px-3 py-1"
                           )}>
                             {s.startTime} - {s.endTime}
                           </span>
                        </div>
                        
                        <div className={cn("flex items-center gap-3", isCompact ? "mb-2" : "mb-4")}>
                          <div className={cn("rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center justify-center shrink-0 text-white", isCompact ? "h-10 w-10" : "h-12 w-12")}>
                            <span className={cn("font-black", isCompact ? "text-sm" : "text-lg")}>{s.classroom.name}</span>
                          </div>
                          <div className={isCompact ? "pr-14" : "pr-20"}>
                            <h3 className={cn("font-bold text-white leading-tight line-clamp-2", isCompact ? "text-base" : "text-xl")}>
                              {s.subject?.name || s.breakName || "Mata Pelajaran"}
                            </h3>
                          </div>
                        </div>

                        <div className={cn("mt-auto flex flex-col", isCompact ? "pt-2" : "pt-4")}>
                           <div className="flex items-center gap-2 mb-2">
                             {s.staff?.imageUrl ? (
                               <img src={s.staff.imageUrl} alt={s.staff.name} className={cn("rounded-full object-cover border border-slate-600", isCompact ? "h-8 w-8" : "h-10 w-10")} />
                             ) : (
                               <div className={cn("rounded-full bg-slate-700 flex items-center justify-center border border-slate-600", isCompact ? "h-8 w-8" : "h-10 w-10")}>
                                 <UserCircle className={cn("text-slate-400", isCompact ? "h-5 w-5" : "h-6 w-6")} />
                               </div>
                             )}
                             <div className="truncate max-w-[120px] sm:max-w-[180px]">
                               <p className="text-xs font-bold text-slate-200 truncate">{s.staff?.name || "-"}</p>
                               <p className="text-[10px] text-slate-400 font-medium">Guru Pengampu</p>
                             </div>
                           </div>
                           
                           <ClassProgressBar startTime={s.startTime} endTime={s.endTime} tz={tz} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            
            {/* Scroll Indicator Gradient */}
            {totalPages <= 1 && activeSchedules.length > 6 && (
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none"></div>
            )}
          </div>

          {/* Section 2: Upcoming Schedules */}
          {upcomingSchedules.length > 0 && (
            <div className="mt-6 border-t border-white/10 pt-6 shrink-0">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-blue-400" />
                <h2 className="text-xl font-bold uppercase tracking-widest text-slate-200">Sesi Selanjutnya</h2>
              </div>
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {upcomingSchedules.slice(0, 4).map((s: any, i: number) => (
                  <div key={i} className="bg-slate-900/60 rounded-2xl border border-white/10 p-4 flex flex-col justify-between hover:border-blue-500/30 transition-all duration-300 backdrop-blur-md">
                    <span className="text-[10px] font-bold bg-blue-500/10 text-blue-400 self-start px-2 py-0.5 rounded-full border border-blue-500/20 uppercase tracking-widest">
                      Mulai {s.startTime}
                    </span>
                    <div className="my-2">
                      <h4 className="font-extrabold text-sm text-white line-clamp-1">{s.classroom.name}</h4>
                      <p className="text-xs text-slate-400 line-clamp-1">{s.subject?.name || s.breakName || "Mata Pelajaran"}</p>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-medium truncate">{s.staff?.name || "-"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Sidebar Widgets */}
        <div className="w-[380px] shrink-0 flex flex-col gap-6 z-10">
          
          {/* Guru Piket Widget */}
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.5)] relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
             <h3 className="text-xl font-bold mb-5 flex items-center gap-2 text-white">
               <Users className="h-5 w-5 text-blue-400" /> Guru Piket Hari Ini
             </h3>
              <div className="space-y-4">
                {activePiket.length > 0 ? activePiket.map((p: any, i: number) => (
                  <div key={i} className="flex flex-col gap-1.5 bg-slate-950/50 p-4 rounded-2xl border border-white/5 shadow-inner backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 text-[10px] font-bold bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/30 uppercase tracking-widest">
                        {p.time}
                      </span>
                    </div>
                    <p className="font-bold text-slate-100 text-lg leading-snug whitespace-pre-wrap">{p.names}</p>
                  </div>
                )) : (
                  <p className="text-sm text-slate-400 text-center py-4">Tidak ada guru piket aktif saat ini.</p>
                )}
              </div>
          </div>

          {/* Teacher Status Widget */}
          {staffStatuses.length > 0 && (
            <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-white/10 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex flex-col min-h-[220px] max-h-[300px]">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white shrink-0">
                <Users className="h-5 w-5 text-indigo-400" /> Status Mengajar Guru
              </h3>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 hide-scrollbar">
                {staffStatuses.map((s: any, i: number) => (
                  <div key={i} className={cn("flex items-center justify-between p-2.5 rounded-xl border text-xs transition-colors", s.isTeaching ? "bg-emerald-950/30 border-emerald-500/20" : "bg-black/30 border-white/5")}>
                    <div className="flex items-center gap-3 truncate pr-2">
                      {/* Indicator Dot */}
                      <div className={cn("h-2 w-2 rounded-full shrink-0", s.isTeaching ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-slate-700")}></div>
                      <div className="flex flex-col gap-0.5 truncate">
                        <span className={cn("font-bold truncate", s.isTeaching ? "text-white" : "text-slate-300")}>{s.name}</span>
                        <span className="text-[10px] text-slate-500 truncate">{s.role || "Pendidik"}</span>
                      </div>
                    </div>
                    {s.isTeaching ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold tracking-wide shrink-0">
                        {s.classroomName}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-white/10 font-semibold shrink-0">
                        Standby
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* QR Code Donation Widget */}
          {data.donation && (
            <div className="bg-gradient-to-br from-emerald-900/50 to-teal-900/50 backdrop-blur-md rounded-3xl border border-emerald-500/30 p-6 shadow-2xl flex-1 flex flex-col items-center justify-center text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
              
              <QrCode className="h-8 w-8 text-emerald-400 mb-3" />
              <h3 className="text-lg font-bold text-emerald-300 mb-1 leading-tight">{data.donation.title}</h3>
              <p className="text-xs text-emerald-100/70 mb-5 max-w-[250px]">Scan barcode di bawah ini untuk berpartisipasi dalam program sekolah.</p>
              
              <div className="bg-white p-3 rounded-2xl shadow-xl shadow-emerald-950/50">
                <QRCode 
                  value={`${window.location.origin}/site/${slug}/donasi/${data.donation.slug || data.donation.id}`} 
                  size={160}
                  level="H"
                />
              </div>
              <p className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold mt-4">Arahkan Kamera HP Anda</p>
            </div>
          )}

        </div>
      </main>

      {/* FOOTER MARQUEE */}
      <footer className="h-[7dvh] min-h-[50px] bg-gradient-to-r from-emerald-700 to-teal-600 flex items-center overflow-hidden shrink-0 shadow-[0_-10px_30px_rgba(5,150,105,0.3)] z-20 border-t border-emerald-500/30">
        <div className="bg-emerald-900 text-emerald-100 font-black uppercase tracking-widest px-8 h-full flex items-center z-10 shrink-0 border-r border-emerald-700 shadow-xl">
          INFORMASI
        </div>
        <div className="flex-1 overflow-hidden relative flex items-center h-full bg-emerald-950/20">
          {/* Marquee Animation */}
          <div className="whitespace-nowrap animate-marquee flex items-center text-xl font-medium text-white tracking-wide">
            {(() => {
              const rawMarquee = data.tenant?.settings?.marqueeText?.trim() || `Selamat Datang di ${data.tenant?.name || "Sistem Cerdas Kami"}! Mari bersama-sama mewujudkan pendidikan berkualitas yang berkarakter. \n Mohon jaga kebersihan dan ketertiban di lingkungan sekolah. \n Guru piket saat ini: ${activePiket?.map((p:any) => `${p.names} (${p.time})`).join(" | ") || "-"}`
              const marqueeItems = rawMarquee.split('\n').map((item: string) => item.trim()).filter(Boolean)
              return (
                <>
                  {marqueeItems.map((text: string, idx: number) => (
                    <span key={`m1-${idx}`} className="mx-8">
                      {text}
                      {idx < marqueeItems.length - 1 && <span className="ml-16 text-emerald-300 shadow-emerald-300">•</span>}
                    </span>
                  ))}
                  {marqueeItems.length > 0 && <span className="mx-8 text-emerald-300 shadow-emerald-300">•</span>}
                  {/* Duplicate for seamless looping */}
                  {marqueeItems.map((text: string, idx: number) => (
                    <span key={`m2-${idx}`} className="mx-8">
                      {text}
                      {idx < marqueeItems.length - 1 && <span className="ml-16 text-emerald-300 shadow-emerald-300">•</span>}
                    </span>
                  ))}
                </>
              )
            })()}
          </div>
        </div>
      </footer>

      {/* Internal CSS for Marquee & hiding scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 30s linear infinite;
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
