"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Calendar, Users, FileText, MessageSquare, ArrowRight, Clock, MapPin, BookOpen, PenTool, CheckCircle2, ChevronRight, Award, Bell, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { id } from "date-fns/locale"

export default function GuruDashboard() {
  const { data: session } = useSession()
  const userName = session?.user?.name || "Guru"
  const tenantId = session?.user?.tenants?.[0]?.id

  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [scheduleToday, setScheduleToday] = useState<any[]>([])
  const [loadingSchedule, setLoadingSchedule] = useState(true)

  useEffect(() => {
    setCurrentTime(new Date())
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)

    if (tenantId) {
      // Fetch Announcements
      fetch(`/api/tenant/posts?tenantId=${tenantId}&type=PENGUMUMAN_GTK&limit=2`)
        .then(r => {
           if(!r.ok) throw new Error("Failed to fetch")
           return r.json()
        })
        .then(d => {
           const data = d.data || d || []
           if (Array.isArray(data)) setAnnouncements(data.slice(0, 2))
        })
        .catch(console.error)

      // Fetch Today's Schedule
      const dayOfWeek = new Date().getDay() || 7
      fetch(`/api/gtk/schedule?tenantId=${tenantId}`)
        .then(r => r.json())
        .then(data => {
          if (data.schedules) {
            const todays = data.schedules.filter((s: any) => s.dayOfWeek === dayOfWeek)
            setScheduleToday(todays)
          }
        })
        .catch(console.error)
        .finally(() => setLoadingSchedule(false))
    }

    return () => clearInterval(timer)
  }, [tenantId])

  const quickActions = [
    { label: "Absen Kehadiran", desc: "Check-in GPS harian", icon: Clock, color: "text-white", bg: "bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-md shadow-emerald-500/30 border-0", href: "/panel-gtk/absensi" },
    { label: "Jadwal Mengajar", desc: "Lihat roster mingguan", icon: Calendar, color: "text-white", bg: "bg-gradient-to-br from-indigo-400 to-indigo-600 shadow-md shadow-indigo-500/30 border-0", href: "/panel-gtk/jadwal" },
    { label: "Jurnal & Absen Siswa", desc: "Isi agenda & presensi kelas", icon: BookOpen, color: "text-white", bg: "bg-gradient-to-br from-blue-400 to-blue-600 shadow-md shadow-blue-500/30 border-0", href: "/panel-gtk/jurnal" },
    { label: "Input Nilai", desc: "Rekap nilai ujian & tugas", icon: Award, color: "text-white", bg: "bg-gradient-to-br from-amber-400 to-amber-600 shadow-md shadow-amber-500/30 border-0", href: "/panel-gtk/nilai" },
    { label: "Buku Poin Siswa", desc: "Catat pelanggaran/prestasi", icon: AlertCircle, color: "text-white", bg: "bg-gradient-to-br from-rose-400 to-rose-600 shadow-md shadow-rose-500/30 border-0", href: "/panel-gtk/poin" },
    { label: "Tulis Artikel", desc: "Bagikan tulisan ke web", icon: FileText, color: "text-white", bg: "bg-gradient-to-br from-violet-400 to-violet-600 shadow-md shadow-violet-500/30 border-0", href: "/panel-gtk/posts" },
  ]

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* Hero Banner Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/90 via-primary to-indigo-600 text-white shadow-xl shadow-primary/20 ring-1 ring-white/10">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 h-48 w-48 rounded-full bg-white/10 blur-2xl"></div>
        
        <div className="relative p-6 sm:p-10 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div className="space-y-3 text-center sm:text-left">
            <div className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-md border border-white/10">
              <span className="flex h-2 w-2 rounded-full bg-green-400 mr-2 animate-pulse"></span>
              Tahun Ajaran 2024/2025
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Halo, {userName.split(' ')[0]}! 👋
            </h1>
            <p className="text-primary-foreground/80 max-w-md text-sm sm:text-base">
              Semoga hari ini menjadi hari yang produktif. Mari inspirasi siswa-siswi kita untuk meraih cita-citanya.
            </p>
          </div>

          <div className="flex flex-col items-center sm:items-end bg-black/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 min-w-[180px]">
            <div className="flex items-center gap-2 text-primary-foreground/90 mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider">
                {currentTime ? currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }) : "Memuat..."}
              </span>
            </div>
            <div className="text-3xl font-bold tabular-nums tracking-tight">
              {currentTime ? currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : "--:--"}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions (App Grid Style) */}
      <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
         <h3 className="font-bold text-foreground mb-4 text-sm flex items-center gap-2">
           Aksi Cepat <ChevronRight className="h-4 w-4 text-muted-foreground" />
         </h3>
         <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-y-6 gap-x-2">
            {quickActions.map((action, i) => (
               <Link key={i} href={action.href} className="flex flex-col items-center gap-2 group outline-none">
                  <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm ring-1 ring-border/50 group-hover:ring-primary/20", action.bg, action.color)}>
                     <action.icon className="h-6 w-6" />
                  </div>
                  <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground group-hover:text-primary text-center line-clamp-2 leading-tight px-1 transition-colors">
                    {action.label}
                  </span>
               </Link>
            ))}
         </div>
      </div>

      {/* Widget Action Needed (Prioritas Hari Ini) */}
      <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
           <AlertCircle className="h-24 w-24 -mr-6 -mt-6 text-rose-600" />
        </div>
        <div className="flex items-center gap-2 mb-4 relative z-10">
          <AlertCircle className="h-5 w-5 text-rose-600" />
          <h3 className="font-bold text-rose-800 text-sm">Prioritas Hari Ini</h3>
        </div>
        <div className="space-y-3 relative z-10 grid sm:grid-cols-2 gap-3 sm:space-y-0">
          <Link href="/panel-gtk/absensi" className="flex items-center justify-between bg-white/60 hover:bg-white dark:bg-black/40 dark:hover:bg-black/60 border border-rose-500/10 p-3.5 rounded-xl transition-all hover:scale-[1.02] shadow-sm group outline-none">
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-600 shrink-0">
                  <Users className="h-5 w-5" />
               </div>
               <div>
                 <p className="text-xs font-bold text-rose-900 dark:text-rose-400">3 Siswa belum diabsen</p>
                 <p className="text-[10px] text-rose-700/70 dark:text-rose-500/70 mt-0.5">Kelas 10 IPA 1</p>
               </div>
            </div>
            <ChevronRight className="h-4 w-4 text-rose-400 group-hover:text-rose-600 transition-colors" />
          </Link>
          <Link href="/panel-gtk/jurnal" className="flex items-center justify-between bg-white/60 hover:bg-white dark:bg-black/40 dark:hover:bg-black/60 border border-amber-500/10 p-3.5 rounded-xl transition-all hover:scale-[1.02] shadow-sm group outline-none">
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600 shrink-0">
                  <PenTool className="h-5 w-5" />
               </div>
               <div>
                 <p className="text-xs font-bold text-amber-900 dark:text-amber-400">2 Jurnal belum diisi</p>
                 <p className="text-[10px] text-amber-700/70 dark:text-amber-500/70 mt-0.5">Segera isi sebelum pulang</p>
               </div>
            </div>
            <ChevronRight className="h-4 w-4 text-amber-400 group-hover:text-amber-600 transition-colors" />
          </Link>
        </div>
      </div>

      <div className="flex flex-col xl:grid xl:grid-cols-3 gap-6">
        
        {/* Mobile First: Pengumuman (Order 1 on Mobile, Order 2 on Desktop) */}
        <Card className="glass border-0 shadow-sm order-1 xl:order-2 xl:col-span-1 h-fit">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Pengumuman</CardTitle>
            </div>
            <div className="bg-primary/10 text-primary p-1.5 rounded-full">
              <Bell className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {announcements.length === 0 ? (
                 <div className="text-center py-4">
                    <p className="text-xs text-muted-foreground">Belum ada pengumuman.</p>
                 </div>
              ) : (
                announcements.map((item, i) => (
                  <Link href="/panel-gtk/messages" key={item.id} className="flex gap-3 group cursor-pointer outline-none">
                    <div className="w-1.5 rounded-full shrink-0 bg-primary/20 group-hover:bg-primary transition-colors"></div>
                    <div className="py-1">
                      <p className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-2">{item.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {format(new Date(item.createdAt), "dd MMM yyyy, HH:mm", { locale: id })}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
            <Button variant="ghost" className="w-full mt-4 text-xs font-medium text-primary hover:bg-primary/5" asChild>
              <Link href="/panel-gtk/messages">Lihat Semua Pengumuman</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Schedule (Order 2 on mobile, Order 1 on Desktop) */}
        <div className="xl:col-span-2 space-y-6 order-2 xl:order-1 xl:row-span-2">
          <Card className="glass border-0 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Jadwal Mengajar Hari Ini
                  </CardTitle>
                  <CardDescription className="mt-1">Anda memiliki {scheduleToday.length} jadwal kelas hari ini</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="hidden sm:flex rounded-full text-xs">
                  Lihat Semua Jadwal
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {loadingSchedule ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">Memuat jadwal...</div>
                ) : scheduleToday.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">Tidak ada jadwal hari ini.</div>
                ) : (
                  scheduleToday.map((schedule, idx) => (
                    <div key={schedule.id || idx} className="p-4 sm:p-5 flex items-start gap-4 hover:bg-muted/20 transition-colors group">
                      <div className="flex flex-col items-center justify-center bg-primary/5 border border-primary/10 rounded-xl py-2 px-3 min-w-[90px] group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <span className="text-xs font-bold">{schedule.startTime || "00:00"}</span>
                        <span className="text-[10px] opacity-70">s/d</span>
                        <span className="text-xs font-bold">{schedule.endTime || "00:00"}</span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-base sm:text-lg truncate">{schedule.subject?.name || "Mata Pelajaran"}</h4>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs font-medium text-muted-foreground">
                          <span className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-foreground">
                            <Users className="h-3 w-3" /> {schedule.classroom?.name || "-"}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {schedule.roomId || "Ruang Kelas"}
                          </span>
                        </div>
                      </div>
                      
                      <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 text-muted-foreground group-hover:text-primary rounded-full">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kehadiran (Order 3 on mobile, Order 3 on Desktop) */}
        <Card className="glass border-0 shadow-sm relative overflow-hidden order-3 xl:order-3 xl:col-span-1 h-fit">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Award className="h-24 w-24" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Tingkat Kehadiran Kelas</CardTitle>
            <CardDescription>Rata-rata persentase kehadiran siswa bulan ini.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-4xl font-extrabold text-emerald-500">96.5%</span>
              <span className="text-sm text-emerald-600 font-medium mb-1">↑ 2.1%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2 mt-4 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: '96.5%' }}></div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
