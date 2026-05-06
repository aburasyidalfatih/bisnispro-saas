"use client"

import { useSession } from "next-auth/react"
import { Bell, CreditCard, CalendarDays, FileText, CheckCircle, Clock, BookOpen, MessageSquare, Award, MonitorSmartphone, Calendar, FileCheck, ClipboardList, Megaphone, User, ArrowRight, Receipt, Activity, Users } from "lucide-react"
import { cn } from "@/lib/utils"

export function ParentDashboard() {
  const { data: session } = useSession()
  const tenant = session?.user?.tenants?.[0]

  const layanan = [
    { label: "Tagihan", icon: CreditCard, color: "bg-rose-500/10 text-rose-600", href: "/dashboard/billing" },
    { label: "Akademik", icon: BookOpen, color: "bg-blue-500/10 text-blue-600", href: "#" },
    { label: "Kehadiran", icon: ClipboardList, color: "bg-emerald-500/10 text-emerald-600", href: "#" },
    { label: "Jadwal", icon: Calendar, color: "bg-purple-500/10 text-purple-600", href: "#" },
    { label: "Pesan Guru", icon: MessageSquare, color: "bg-cyan-500/10 text-cyan-600", href: "#" },
    { label: "PPDB", icon: Users, color: "bg-amber-500/10 text-amber-600", href: "/dashboard/ppdb/portal" },
    { label: "Ekstrakurikuler", icon: Activity, color: "bg-pink-500/10 text-pink-600", href: "#" },
    { label: "Prestasi", icon: Award, color: "bg-indigo-500/10 text-indigo-600", href: "#" },
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
                <p className="text-primary-foreground/80 text-xs">Selamat datang kembali,</p>
                <h2 className="text-primary-foreground font-bold text-lg leading-tight">Bpk/Ibu {session?.user?.name || "Orang Tua"}</h2>
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
        
        {/* Banner PPDB */}
        <div className="btn-gradient rounded-2xl p-5 text-white shadow-xl shadow-primary/20 relative overflow-hidden border border-white/20">
           {/* Abstract shapes */}
           <div className="absolute -right-6 -bottom-10 opacity-10 pointer-events-none">
              <div className="h-40 w-40 rounded-full border-[20px] border-white"></div>
           </div>
           
           <div className="relative z-10 flex items-center justify-between">
              <div>
                 <h3 className="text-lg font-bold mb-1 drop-shadow-sm">Portal PPDB</h3>
                 <p className="text-xs opacity-90 max-w-[180px] leading-relaxed">Daftarkan putra/putri Anda ke sekolah kami dengan mudah secara online.</p>
              </div>
              <a href="/dashboard/ppdb/portal" className="bg-white text-primary px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm hover:scale-105 transition-transform flex items-center gap-1.5 shrink-0">
                 Daftar <ArrowRight className="h-3.5 w-3.5" />
              </a>
           </div>
        </div>

        {/* Tanggungan Siswa (Anak) */}
        <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
          <div className="flex justify-between items-center mb-3">
             <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
               <User className="h-4 w-4 text-primary" /> Data Anak / Tanggungan
             </h3>
          </div>
          <div className="space-y-3">
             <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
               <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                 <User className="h-5 w-5 text-primary" />
               </div>
               <div className="flex-1 min-w-0">
                 <h4 className="text-sm font-bold text-foreground truncate">Ahmad Fatih</h4>
                 <p className="text-[11px] text-muted-foreground truncate">NISN: 24010001 • Kelas X MIPA 1</p>
               </div>
               <div className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 text-[10px] font-bold shrink-0">
                 Aktif
               </div>
             </div>
             {/* Dummy second child to show it can handle multiple */}
             <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/50">
               <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center shrink-0">
                 <User className="h-5 w-5 text-muted-foreground" />
               </div>
               <div className="flex-1 min-w-0">
                 <h4 className="text-sm font-bold text-foreground truncate">Siti Aisyah</h4>
                 <p className="text-[11px] text-muted-foreground truncate">NISN: 24010002 • Kelas VII B</p>
               </div>
               <div className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 text-[10px] font-bold shrink-0">
                 Aktif
               </div>
             </div>
          </div>
        </div>

        {/* Layanan Utama */}
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
           <h3 className="font-bold text-foreground mb-4 text-sm">Layanan Utama</h3>
           <div className="grid grid-cols-4 gap-y-6 gap-x-2">
              {layanan.map((item, i) => (
                 <a key={i} href={item.href} className="flex flex-col items-center gap-2 group">
                    <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105", item.color)}>
                       <item.icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-semibold text-muted-foreground text-center line-clamp-1">{item.label}</span>
                 </a>
              ))}
           </div>
        </div>

        {/* Ringkasan Tagihan */}
        <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
          <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
               <Receipt className="h-4 w-4 text-rose-500" /> Tagihan Belum Dibayar
             </h3>
             <a href="/dashboard/billing" className="text-[10px] font-bold text-primary hover:underline">Lihat Semua →</a>
          </div>
          <div className="space-y-3">
             <div className="flex items-center justify-between border-b border-border/50 pb-3">
               <div>
                 <p className="text-xs font-bold text-foreground">SPP Bulan Juli 2024</p>
                 <p className="text-[10px] text-muted-foreground">Ahmad Fatih</p>
               </div>
               <div className="text-right">
                 <p className="text-sm font-bold text-rose-500">Rp 350.000</p>
                 <p className="text-[9px] text-rose-500/80 uppercase font-bold">Jatuh Tempo: 10 Jul</p>
               </div>
             </div>
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-xs font-bold text-foreground">Uang Gedung (Cicilan 1)</p>
                 <p className="text-[10px] text-muted-foreground">Siti Aisyah</p>
               </div>
               <div className="text-right">
                 <p className="text-sm font-bold text-rose-500">Rp 1.500.000</p>
                 <p className="text-[9px] text-rose-500/80 uppercase font-bold">Jatuh Tempo: 15 Jul</p>
               </div>
             </div>
          </div>
        </div>

        {/* Pengumuman Terbaru */}
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
           <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                 <Megaphone className="h-4 w-4 text-primary" /> Pengumuman Sekolah
              </h3>
           </div>
           
           <div className="space-y-3">
              <div className="flex gap-3 items-start border-b border-border/50 pb-3">
                 <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Megaphone className="h-5 w-5 text-amber-500" />
                 </div>
                 <div>
                    <h4 className="text-xs font-bold text-foreground mb-1">Pengambilan Raport Semester Genap</h4>
                    <p className="text-[10px] text-muted-foreground line-clamp-2">Pengambilan raport akan dilaksanakan pada hari Sabtu, 20 Juli 2024. Harap melunasi seluruh administrasi.</p>
                    <p className="text-[9px] text-primary font-medium mt-1 flex items-center gap-1"><Clock className="h-3 w-3" /> 2 hari yang lalu</p>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  )
}
