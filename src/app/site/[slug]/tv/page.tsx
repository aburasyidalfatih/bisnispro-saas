"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { Clock, Calendar, Users, MapPin, Loader2, BookOpen, UserCircle, QrCode } from "lucide-react"
import QRCode from "react-qr-code"
import Image from "next/image"
import { cn } from "@/lib/utils"

export default function SchoolTvPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(new Date())

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch Data
  const fetchData = async () => {
    try {
      const dayOfWeek = now.getDay()
      const res = await fetch(`/api/tv/data?slug=${slug}&day=${dayOfWeek}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch & interval fetch (every 1 minute)
  useEffect(() => {
    if (!slug) return
    fetchData()
    const interval = setInterval(fetchData, 60000) // refresh every 1 minute
    return () => clearInterval(interval)
  }, [slug]) // Intentionally not depending on 'now' to avoid fetching every second

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mb-4" />
        <h2 className="text-xl font-semibold">Memuat Sistem TV Sekolah...</h2>
      </div>
    )
  }

  // Filter Active Schedules
  const currentMins = now.getHours() * 60 + now.getMinutes()
  
  const activeSchedules = data.schedules.filter((s: any) => {
    if (!s.startTime || !s.endTime) return false
    const [startH, startM] = s.startTime.split(':').map(Number)
    const [endH, endM] = s.endTime.split(':').map(Number)
    const startMins = startH * 60 + startM
    const endMins = endH * 60 + endM
    return currentMins >= startMins && currentMins <= endMins
  })

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

        <div className="flex items-center gap-6 bg-black/30 px-6 py-3 rounded-2xl border border-white/5">
          <div className="text-right">
            <p className="text-lg font-medium text-slate-300">
              {format(now, "EEEE, dd MMMM yyyy", { locale: id })}
            </p>
          </div>
          <div className="h-10 w-px bg-white/10"></div>
          <div className="text-5xl font-black tabular-nums tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">
            {format(now, "HH:mm")}
            <span className="text-2xl text-emerald-400 ml-1">{format(now, "ss")}</span>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex gap-6 p-6 overflow-hidden relative">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none"></div>

        {/* Left Column: Live Schedule Grid */}
        <div className="flex-1 flex flex-col h-full z-10 relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
            </div>
            <h2 className="text-2xl font-bold uppercase tracking-widest text-slate-200">Sedang Berlangsung</h2>
          </div>

          <div className="flex-1 overflow-hidden relative">
            <div className="absolute inset-0 overflow-y-auto pb-10 hide-scrollbar scroll-smooth">
              {activeSchedules.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 bg-white/5 rounded-3xl border border-white/10 p-12">
                  <Clock className="h-24 w-24 mb-6 opacity-20" />
                  <p className="text-3xl font-semibold">Tidak ada kelas yang berlangsung saat ini</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-5 pb-8">
                  {activeSchedules.map((s: any, i: number) => (
                    <div key={i} className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl border border-slate-700 p-6 shadow-xl relative overflow-hidden flex flex-col h-full animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${i * 100}ms` }}>
                      <div className="absolute top-0 right-0 p-4">
                         <span className="text-xs font-black bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full uppercase tracking-wider">
                           {s.startTime} - {s.endTime}
                         </span>
                      </div>
                      
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
                          <span className="text-lg font-black text-primary">{s.classroom.name}</span>
                        </div>
                        <div className="pr-20">
                          <h3 className="font-bold text-xl text-white leading-tight line-clamp-2">
                            {s.subject?.name || s.breakName || "Mata Pelajaran"}
                          </h3>
                        </div>
                      </div>

                      <div className="mt-auto pt-4 border-t border-slate-700/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {s.staff?.imageUrl ? (
                            <img src={s.staff.imageUrl} alt={s.staff.name} className="h-10 w-10 rounded-full object-cover border border-slate-600" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600">
                              <UserCircle className="h-6 w-6 text-slate-400" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold text-slate-300">{s.staff?.name || "-"}</p>
                            <p className="text-xs text-slate-500">Guru Pengampu</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Scroll Indicator Gradient */}
            {activeSchedules.length > 6 && (
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none"></div>
            )}
          </div>
        </div>

        {/* Right Column: Sidebar Widgets */}
        <div className="w-[380px] shrink-0 flex flex-col gap-6 z-10">
          
          {/* Guru Piket Widget */}
          <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl border border-white/10 p-6 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
             <h3 className="text-xl font-bold mb-5 flex items-center gap-2">
               <Users className="h-5 w-5 text-blue-400" /> Guru Piket Hari Ini
             </h3>
             <div className="space-y-4">
               {data.piket?.length > 0 ? data.piket.map((p: any, i: number) => (
                 <div key={i} className="flex items-center gap-4 bg-black/40 p-3 rounded-2xl border border-white/5">
                   {p.imageUrl ? (
                     <img src={p.imageUrl} alt={p.name} className="h-14 w-14 rounded-full object-cover border-2 border-slate-700" />
                   ) : (
                     <div className="h-14 w-14 rounded-full bg-slate-800 flex items-center justify-center border-2 border-slate-700">
                       <UserCircle className="h-8 w-8 text-slate-400" />
                     </div>
                   )}
                   <div>
                     <p className="font-bold text-slate-200 line-clamp-1">{p.name}</p>
                     <p className="text-xs text-blue-400 font-medium">{p.position || "Guru Piket"}</p>
                   </div>
                 </div>
               )) : (
                 <p className="text-sm text-slate-400 text-center py-4">Belum ada data guru piket.</p>
               )}
             </div>
          </div>

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
      <footer className="h-[7dvh] min-h-[50px] bg-emerald-600 flex items-center overflow-hidden shrink-0 shadow-[0_-10px_30px_rgba(5,150,105,0.2)] z-20">
        <div className="bg-emerald-800 text-emerald-100 font-bold uppercase tracking-widest px-6 h-full flex items-center z-10 shrink-0">
          INFORMASI
        </div>
        <div className="flex-1 overflow-hidden relative flex items-center h-full">
          {/* Marquee Animation */}
          <div className="whitespace-nowrap animate-marquee flex items-center text-xl font-medium text-white tracking-wide">
            <span className="mx-8">Selamat Datang di {data.tenant?.name || "Sistem Cerdas Kami"}! Mari bersama-sama mewujudkan pendidikan berkualitas yang berkarakter.</span>
            <span className="mx-8">•</span>
            <span className="mx-8">Mohon jaga kebersihan dan ketertiban di lingkungan sekolah.</span>
            <span className="mx-8">•</span>
            <span className="mx-8">Guru piket hari ini: {data.piket?.map((p:any) => p.name).join(", ")}.</span>
            
            {/* Duplicate for seamless looping */}
            <span className="mx-8">•</span>
            <span className="mx-8">Selamat Datang di {data.tenant?.name || "Sistem Cerdas Kami"}! Mari bersama-sama mewujudkan pendidikan berkualitas yang berkarakter.</span>
            <span className="mx-8">•</span>
            <span className="mx-8">Mohon jaga kebersihan dan ketertiban di lingkungan sekolah.</span>
            <span className="mx-8">•</span>
            <span className="mx-8">Guru piket hari ini: {data.piket?.map((p:any) => p.name).join(", ")}.</span>
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
