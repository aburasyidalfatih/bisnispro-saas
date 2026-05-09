"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Calendar, Users, FileText, MessageSquare, ArrowRight, Clock, MapPin, BookOpen, PenTool, CheckCircle2, ChevronRight, Award, Bell, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function GuruDashboard() {
  const { data: session } = useSession()
  const userName = session?.user?.name || "Guru"
  const [currentTime, setCurrentTime] = useState<Date | null>(null)

  useEffect(() => {
    setCurrentTime(new Date())
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const quickActions = [
    { label: "Absen Kehadiran", desc: "Check-in GPS harian", icon: Clock, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", href: "/panel-gtk/absensi" },
    { label: "Jadwal Mengajar", desc: "Lihat roster mingguan", icon: Calendar, color: "text-indigo-500", bg: "bg-indigo-500/10", border: "border-indigo-500/20", href: "/panel-gtk/jadwal" },
    { label: "Jurnal & Absen Siswa", desc: "Isi agenda & presensi kelas", icon: BookOpen, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", href: "/panel-gtk/jurnal" },
    { label: "Input Nilai", desc: "Rekap nilai ujian & tugas", icon: Award, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", href: "/panel-gtk/nilai" },
    { label: "Buku Poin Siswa", desc: "Catat pelanggaran/prestasi", icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20", href: "/panel-gtk/poin" },
    { label: "Tulis Artikel", desc: "Bagikan tulisan ke web", icon: FileText, color: "text-violet-500", bg: "bg-violet-500/10", border: "border-violet-500/20", href: "/panel-gtk/posts" },
  ]

  const scheduleToday = [
    { time: "07:00 - 08:30", subject: "Matematika Wajib", class: "X MIPA 1", room: "Ruang 12" },
    { time: "08:30 - 10:00", subject: "Matematika Peminatan", class: "XI MIPA 2", room: "Ruang 15" },
    { time: "10:30 - 12:00", subject: "Matematika Wajib", class: "X IPS 1", room: "Ruang 04" },
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

      {/* Quick Actions (Bento Grid) */}
      <div>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          Aksi Cepat <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          {quickActions.map((action, i) => (
            <Link key={i} href={action.href} className="group outline-none">
              <div className={cn(
                "relative overflow-hidden rounded-2xl p-4 sm:p-5 h-full transition-all duration-300",
                "bg-card hover:shadow-lg hover:shadow-primary/5 ring-1 ring-border",
                "group-hover:-translate-y-1 group-hover:border-primary/30 group-focus-visible:ring-2 group-focus-visible:ring-primary"
              )}>
                {/* Decorative background circle */}
                <div className={cn("absolute -right-4 -top-4 h-16 w-16 rounded-full blur-2xl opacity-50 transition-transform group-hover:scale-150", action.bg)}></div>
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className={cn("h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", action.bg, action.color)}>
                    <action.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-card-foreground group-hover:text-primary transition-colors">
                    {action.label}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {action.desc}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column: Schedule */}
        <div className="xl:col-span-2 space-y-6">
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
                {scheduleToday.map((schedule, idx) => (
                  <div key={idx} className="p-4 sm:p-5 flex items-start gap-4 hover:bg-muted/20 transition-colors group">
                    <div className="flex flex-col items-center justify-center bg-primary/5 border border-primary/10 rounded-xl py-2 px-3 min-w-[90px] group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <span className="text-xs font-bold">{schedule.time.split(' - ')[0]}</span>
                      <span className="text-[10px] opacity-70">s/d</span>
                      <span className="text-xs font-bold">{schedule.time.split(' - ')[1]}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-base sm:text-lg truncate">{schedule.subject}</h4>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs font-medium text-muted-foreground">
                        <span className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-foreground">
                          <Users className="h-3 w-3" /> {schedule.class}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {schedule.room}
                        </span>
                      </div>
                    </div>
                    
                    <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 text-muted-foreground group-hover:text-primary rounded-full">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Info & Stats */}
        <div className="space-y-6">
          <Card className="glass border-0 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Award className="h-24 w-24" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Tingkat Kehadiran Kelas</CardTitle>
              <CardDescription>Rata-rata persentase kehadiran siswa di kelas yang Anda ampu bulan ini.</CardDescription>
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

          <Card className="glass border-0 shadow-sm">
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
                {[
                  { title: "Rapat Paripurna Kenaikan Kelas", date: "Besok, 13:00 WIB", type: "Penting" },
                  { title: "Batas Akhir Input Nilai PTS", date: "Lusa, 23:59 WIB", type: "Reminder" }
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 group cursor-pointer">
                    <div className="w-1.5 rounded-full shrink-0 bg-primary/20 group-hover:bg-primary transition-colors"></div>
                    <div className="py-1">
                      <p className="font-semibold text-sm group-hover:text-primary transition-colors">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="w-full mt-4 text-xs font-medium text-primary hover:bg-primary/5">
                Lihat Semua Pengumuman
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
