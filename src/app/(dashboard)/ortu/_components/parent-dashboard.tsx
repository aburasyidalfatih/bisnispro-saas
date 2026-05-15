"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import DOMPurify from "isomorphic-dompurify"
import { Bell, CreditCard, CalendarDays, FileText, CheckCircle, Clock, BookOpen, MessageSquare, Award, MonitorSmartphone, Calendar, FileCheck, ClipboardList, Megaphone, User, ArrowRight, Receipt, Activity, Users, UtensilsCrossed, Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Wallet, PlusCircle } from "lucide-react"

import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

export function ParentDashboard({ childrenData = [], unpaidInvoices = [], recentPosts = [], userRole = "orangtua" }: { childrenData?: any[], unpaidInvoices?: any[], recentPosts?: any[], userRole?: string }) {
  const { data: session } = useSession()
  const tenant = session?.user?.tenants?.[0]
  
  const [showBalance, setShowBalance] = useState(true)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)

  useEffect(() => {
    setCurrentTime(new Date())
  }, [])

  const getGreeting = () => {
    const hour = currentTime ? currentTime.getHours() : new Date().getHours()
    if (hour < 11) return "Selamat Pagi,"
    if (hour < 15) return "Selamat Siang,"
    if (hour < 18) return "Selamat Sore,"
    return "Selamat Malam,"
  }

  const totalBalance = childrenData.reduce((acc, child) => acc + (child.walletAccount?.balance || 0), 0)

  const layanan = [
    { label: "Tagihan", icon: CreditCard, color: "bg-rose-500/10 text-rose-600", href: "/ortu/tagihan" },
    { label: "Akademik", icon: BookOpen, color: "bg-indigo-500/10 text-indigo-600", href: "/ortu/akademik" },
    { label: "Kehadiran", icon: ClipboardList, color: "bg-emerald-500/10 text-emerald-600", href: "/ortu/absensi" },
    { label: "Izin/Sakit", icon: FileCheck, color: "bg-amber-500/10 text-amber-600", href: "/ortu/izin" },
    { label: "Kantin", icon: UtensilsCrossed, color: "bg-orange-500/10 text-orange-600", href: "/ortu/kantin" },
    { label: "KTM / Kartu", icon: Award, color: "bg-purple-500/10 text-purple-600", href: "/ortu/student-card" },
    { label: "Rapor", icon: FileText, color: "bg-teal-500/10 text-teal-600", href: "/ortu/rapor" },
    { label: "PPDB", icon: Users, color: "bg-cyan-500/10 text-cyan-600", href: "/ortu/ppdb" },
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
                <p className="text-primary-foreground/80 text-xs">{getGreeting()}</p>
                <h2 className="text-primary-foreground font-bold text-lg leading-tight">{userRole === "siswa" ? (session?.user?.name || "Siswa") : `Bpk/Ibu ${session?.user?.name || "Orang Tua"}`}</h2>
             </div>
          </div>
          <div className="flex gap-2">
             <Link href="/ortu/tagihan" className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-primary-foreground relative backdrop-blur-sm">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 h-2 w-2 bg-destructive rounded-full border border-primary"></span>
             </Link>
          </div>
        </div>
      </div>

      {/* Main Content Area overlapping header */}
      <div className="px-5 -mt-24 relative z-10 space-y-5">
        
        {/* Banner Alert Tagihan */}
        {unpaidInvoices.length > 0 && (
          <div className="bg-rose-500 rounded-[1.5rem] p-4 text-white shadow-lg shadow-rose-500/30 flex items-center justify-between border-2 border-white/20 animate-in slide-in-from-top-4 duration-500">
             <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                   <Bell className="h-5 w-5 animate-bounce" />
                </div>
                <div>
                   <h3 className="font-bold text-sm">Pemberitahuan Tagihan</h3>
                   <p className="text-[10px] text-white/80">Anda memiliki {unpaidInvoices.length} tagihan yang belum dilunasi.</p>
                </div>
             </div>
             <Link href="/ortu/tagihan" className="h-8 px-3 bg-white text-rose-600 font-bold text-xs rounded-xl flex items-center justify-center hover:bg-white/90 transition-colors shrink-0">
                Bayar
             </Link>
          </div>
        )}

        {/* Status Anak & Keuangan (Bird's Eye View) */}
        <div className="space-y-4">
           {childrenData.map((child: any) => {
              const latestAttendance = child.attendanceRecords?.[0]
              const isHadir = latestAttendance?.status === "HADIR" || latestAttendance?.status === "PRESENT"
              const attColor = isHadir ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : 
                               latestAttendance ? "bg-rose-500/10 text-rose-600 border-rose-500/20" : 
                               "bg-muted text-muted-foreground border-border"
              const attText = isHadir ? "Hadir di Sekolah" : 
                              latestAttendance ? latestAttendance.status : "Belum Ada Info"
              
              return (
                <div key={child.id} className="bg-card rounded-saas-card p-5 shadow-sm border border-border relative overflow-hidden">
                   {/* Header Anak */}
                   <div className="flex items-center gap-4 mb-5">
                     <div className="h-14 w-14 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                       <User className="h-7 w-7 text-primary" />
                     </div>
                     <div className="flex-1">
                       <h3 className="font-extrabold text-foreground text-lg">{child.name}</h3>
                       <p className="text-xs text-muted-foreground">{child.classroom?.name || "Belum ada kelas"}</p>
                     </div>
                     <div className={cn("px-3 py-1.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 whitespace-nowrap", attColor)}>
                       {isHadir && <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
                       {attText}
                     </div>
                   </div>

                   {/* Tabungan & Tagihan Row */}
                   {tenant?.plan !== "free" && (
                     <div className="grid grid-cols-2 gap-3">
                       {child.walletAccount ? (
                         <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4 flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-[10px] font-bold text-indigo-600/80 uppercase tracking-wider flex items-center gap-1"><Wallet className="h-3 w-3" /> Tabungan</p>
                              <button onClick={() => setShowBalance(!showBalance)} className="text-indigo-400 hover:text-indigo-600 transition-colors">
                                {showBalance ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                            <h4 className="text-lg font-black text-indigo-700 transition-all duration-300">
                              {showBalance ? `Rp ${child.walletAccount.balance.toLocaleString("id-ID")}` : "••••••"}
                            </h4>
                            <Link href="/ortu/wallet/topup" className="mt-3 text-[10px] font-bold text-white bg-indigo-500 hover:bg-indigo-600 px-3 py-1.5 rounded-lg w-fit transition-colors">
                               + Nabung
                            </Link>
                         </div>
                       ) : (
                         <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4 flex flex-col justify-between opacity-50">
                            <p className="text-[10px] font-bold text-indigo-600/80 uppercase tracking-wider mb-1 flex items-center gap-1"><Wallet className="h-3 w-3" /> Tabungan</p>
                            <h4 className="text-sm font-bold text-indigo-700 mt-2">Belum Aktif</h4>
                         </div>
                       )}
                       <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-4 flex flex-col justify-between">
                          <p className="text-[10px] font-bold text-rose-600/80 uppercase tracking-wider mb-1 flex items-center gap-1"><Receipt className="h-3 w-3" /> Tagihan</p>
                          <h4 className="text-lg font-black text-rose-700">
                             {unpaidInvoices.filter((inv: any) => inv.studentId === child.id).length} Belum Lunas
                          </h4>
                          <Link href="/ortu/tagihan" className="mt-3 text-[10px] font-bold text-rose-700 bg-rose-500/20 hover:bg-rose-500/30 px-3 py-1.5 rounded-lg w-fit transition-colors">
                             Lihat & Bayar
                          </Link>
                       </div>
                     </div>
                   )}

                   {/* Ringkasan Akademik (MOCK) */}
                   <div className="mt-3 bg-muted/30 border border-border/50 rounded-2xl p-4 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                       <div className="h-10 w-10 bg-indigo-500/10 rounded-xl flex items-center justify-center shrink-0">
                         <BookOpen className="h-5 w-5 text-indigo-600" />
                       </div>
                       <div>
                         <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Progress Akademik</p>
                         <h4 className="text-sm font-bold text-foreground">Sangat Baik <span className="text-emerald-500 text-xs ml-1">â†‘</span></h4>
                       </div>
                     </div>
                     <Link href="/ortu/akademik" className="text-[11px] font-bold text-indigo-600 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg transition-colors">
                       Lihat Detail
                     </Link>
                   </div>
                </div>
              )
           })}

           {childrenData.length === 0 && (
             <div className="bg-card rounded-saas-card p-8 text-center shadow-sm border border-border">
               <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-8 w-8 text-muted-foreground" />
               </div>
               <h3 className="font-bold text-lg mb-1">{userRole === "siswa" ? "Data Belum Terhubung" : "Belum Ada Data Anak"}</h3>
               <p className="text-sm text-muted-foreground">{userRole === "siswa" ? "Akun Anda belum terhubung dengan data siswa. Silakan hubungi admin sekolah." : "Silakan hubungi admin sekolah untuk menghubungkan akun Anda dengan data siswa."}</p>
             </div>
           )}
        </div>

        {/* Layanan Utama */}
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
           <h3 className="font-bold text-foreground mb-4 text-sm">Layanan Utama</h3>
            <div className="grid grid-cols-4 gap-y-6 gap-x-2">
               {layanan.map((item, i) => (
                  <Link key={i} href={item.href} className="flex flex-col items-center gap-2 group">
                     <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105", item.color)}>
                        <item.icon className="h-5 w-5" />
                     </div>
                     <span className="text-[10px] font-semibold text-muted-foreground text-center line-clamp-1">{item.label}</span>
                  </Link>
               ))}
            </div>
        </div>

        {/* Ringkasan Tagihan */}
        <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
          <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
               <Receipt className="h-4 w-4 text-rose-500" /> Tagihan Belum Dibayar
             </h3>
             <a href="/ortu/tagihan" className="text-[10px] font-bold text-primary hover:underline">Lihat Semua â†’</a>
          </div>
          <div className="space-y-3">
             {unpaidInvoices.length > 0 ? unpaidInvoices.map((inv: any) => (
                <div key={inv.id} className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-xs font-bold text-foreground">{inv.title}</p>
                    <p className="text-[10px] text-muted-foreground">{inv.student?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-rose-500">Rp {(inv.amountDue || inv.amount).toLocaleString('id-ID')}</p>
                    <p className="text-[9px] text-rose-500/80 uppercase font-bold">Jatuh Tempo: {format(new Date(inv.dueDate), "dd MMM yyyy", { locale: localeId })}</p>
                  </div>
                </div>
             )) : (
                <div className="py-4 text-center">
                   <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-50" />
                   <p className="text-xs text-muted-foreground">Tidak ada tagihan yang belum dibayar. Terima kasih!</p>
                </div>
             )}
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
              {recentPosts.length > 0 ? recentPosts.map((post: any) => (
                 <div key={post.id} className="flex gap-3 items-start border-b border-border/50 pb-3 last:border-0 last:pb-0">
                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                       <Megaphone className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                       <h4 className="text-xs font-bold text-foreground mb-1">{post.title}</h4>
                       <p className="text-[10px] text-muted-foreground line-clamp-2" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content?.substring(0, 150) || "") }}></p>
                       <p className="text-[9px] text-primary font-medium mt-1 flex items-center gap-1"><Clock className="h-3 w-3" /> {format(new Date(post.createdAt), "dd MMM yyyy", { locale: localeId })}</p>
                    </div>
                 </div>
              )) : (
                 <div className="py-4 text-center">
                    <p className="text-xs text-muted-foreground">Belum ada pengumuman terbaru.</p>
                 </div>
              )}
           </div>
        </div>

      </div>
    </div>
  )
}

