"use client"

import { useSession } from "next-auth/react"
import { Bell, CreditCard, CalendarDays, FileText, CheckCircle, Clock, BookOpen, MessageSquare, Award, MonitorSmartphone, Calendar, FileCheck, ClipboardList, Megaphone } from "lucide-react"
import { cn } from "@/lib/utils"

export function ParentDashboard() {
  const { data: session } = useSession()
  const tenant = session?.user?.tenants?.[0]
  
  const studentData = {
    name: session?.user?.name || "Nama Siswa",
    nisn: "24010001",
    kelas: "X MIPA 1",
    status: "Aktif",
    tahunAjaran: "2024/2025-Ganjil"
  }

  const layanan = [
    { label: "Nilai", icon: FileCheck, color: "bg-blue-500/10 text-blue-600" },
    { label: "Kehadiran", icon: ClipboardList, color: "bg-emerald-500/10 text-emerald-600" },
    { label: "Jadwal", icon: Calendar, color: "bg-purple-500/10 text-purple-600" },
    { label: "Kalender", icon: CalendarDays, color: "bg-orange-500/10 text-orange-600" },
    { label: "Surat", icon: FileText, color: "bg-cyan-500/10 text-cyan-600" },
    { label: "Tagihan", icon: CreditCard, color: "bg-rose-500/10 text-rose-600" },
    { label: "Tugas", icon: BookOpen, color: "bg-pink-500/10 text-pink-600" },
    { label: "Pesan", icon: MessageSquare, color: "bg-indigo-500/10 text-indigo-600" },
  ]

  return (
    <div className="pb-10">
      {/* Curved Header */}
      <div className="bg-primary rounded-b-[2.5rem] pt-8 pb-32 px-6 relative z-0">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
             {tenant?.logo ? (
                <img src={tenant.logo} alt="Logo" className="h-10 w-10 object-contain bg-white rounded-full p-1 shadow-sm" />
             ) : (
                <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
                  <MonitorSmartphone className="h-5 w-5 text-primary-foreground" />
                </div>
             )}
             <div>
                <p className="text-primary-foreground/80 text-xs">Selamat datang,</p>
                <h2 className="text-primary-foreground font-bold text-lg leading-tight">{session?.user?.name}</h2>
             </div>
          </div>
          <div className="flex gap-2">
             <button className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-primary-foreground relative backdrop-blur-sm">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 h-2 w-2 bg-destructive rounded-full border border-primary"></span>
             </button>
          </div>
        </div>
      </div>

      {/* Main Content Area overlapping header */}
      <div className="px-5 -mt-24 relative z-10 space-y-5">
        
        {/* Virtual Student Card */}
        <div className="btn-gradient rounded-2xl p-5 text-white shadow-xl shadow-primary/20 relative overflow-hidden border border-white/20">
           {/* Abstract shapes inside card */}
           <div className="absolute -right-6 -bottom-10 opacity-10 pointer-events-none">
              <div className="h-40 w-40 rounded-full border-[20px] border-white"></div>
           </div>
           
           <div className="flex justify-between items-start relative z-10 mb-6">
              <div className="h-8 w-12 bg-amber-400/90 rounded-md shadow-sm border border-amber-300"></div>
              <span className="text-[10px] font-bold tracking-widest uppercase opacity-90">KARTU PELAJAR</span>
           </div>

           <div className="relative z-10">
              <h3 className="text-2xl font-mono tracking-widest font-bold mb-1 drop-shadow-sm">{studentData.nisn}</h3>
              <div className="flex justify-between items-end">
                 <div>
                    <p className="text-[9px] uppercase tracking-wider opacity-80">Atas Nama</p>
                    <p className="font-semibold text-sm drop-shadow-sm">{studentData.name}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[9px] uppercase tracking-wider opacity-80">Tahun Ajaran</p>
                    <p className="font-semibold text-xs drop-shadow-sm">{studentData.tahunAjaran}</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Quick Stats Blocks */}
        <div className="grid grid-cols-3 gap-3">
           <div className="bg-card rounded-xl p-3 shadow-sm flex flex-col items-center justify-center text-center border border-border">
              <div className="text-lg font-black text-foreground">12</div>
              <div className="text-[9px] uppercase font-bold text-muted-foreground mt-1">Kehadiran</div>
           </div>
           <div className="bg-card rounded-xl p-3 shadow-sm flex flex-col items-center justify-center text-center border border-border">
              <div className="text-sm font-black text-primary flex items-center gap-1">
                 <CheckCircle className="h-4 w-4" /> Aktif
              </div>
              <div className="text-[9px] uppercase font-bold text-muted-foreground mt-1">Status</div>
           </div>
           <div className="bg-card rounded-xl p-3 shadow-sm flex flex-col items-center justify-center text-center border border-border">
              <div className="text-lg font-black text-destructive">0</div>
              <div className="text-[9px] uppercase font-bold text-muted-foreground mt-1">Tagihan</div>
           </div>
        </div>

        {/* Layanan Akademik */}
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
           <h3 className="font-bold text-foreground mb-4 text-sm">Layanan Akademik</h3>
           <div className="grid grid-cols-4 gap-y-6 gap-x-2">
              {layanan.map((item, i) => (
                 <button key={i} className="flex flex-col items-center gap-2 group">
                    <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105", item.color)}>
                       <item.icon className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-semibold text-muted-foreground">{item.label}</span>
                 </button>
              ))}
           </div>
        </div>

        {/* Pengumuman Terbaru */}
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
           <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                 <Megaphone className="h-4 w-4 text-primary" />
                 Pengumuman Terbaru
              </h3>
              <button className="text-[10px] font-bold text-primary hover:underline">Semua →</button>
           </div>
           
           <div className="space-y-3">
              <div className="flex gap-3 items-start border-b border-border/50 pb-3">
                 <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Megaphone className="h-5 w-5 text-amber-500" />
                 </div>
                 <div>
                    <h4 className="text-xs font-bold text-foreground mb-1">Pemberitahuan Ujian Akhir Semester</h4>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> 2 hari yang lalu</p>
                 </div>
              </div>
              <div className="flex gap-3 items-start">
                 <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Award className="h-5 w-5 text-blue-500" />
                 </div>
                 <div>
                    <h4 className="text-xs font-bold text-foreground mb-1">Pendaftaran Ekstrakurikuler Dibuka</h4>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> 5 hari yang lalu</p>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  )
}
