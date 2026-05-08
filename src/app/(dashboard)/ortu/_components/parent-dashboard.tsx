"use client"

import { useSession } from "next-auth/react"
import { Bell, CreditCard, CalendarDays, FileText, CheckCircle, Clock, BookOpen, MessageSquare, Award, MonitorSmartphone, Calendar, FileCheck, ClipboardList, Megaphone, User, ArrowRight, Receipt, Activity, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Wallet, PlusCircle } from "lucide-react"

import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

export function ParentDashboard({ childrenData = [], unpaidInvoices = [], recentPosts = [] }: { childrenData?: any[], unpaidInvoices?: any[], recentPosts?: any[] }) {
  const { data: session } = useSession()
  const tenant = session?.user?.tenants?.[0]
  
  const totalBalance = childrenData.reduce((acc, child) => acc + (child.walletAccount?.balance || 0), 0)

  const layanan = [
    { label: "Tagihan", icon: CreditCard, color: "bg-rose-500/10 text-rose-600", href: "/ortu/tagihan" },
    { label: "Kehadiran", icon: ClipboardList, color: "bg-emerald-500/10 text-emerald-600", href: "/ortu/absensi" },
    { label: "Izin/Sakit", icon: FileCheck, color: "bg-amber-500/10 text-amber-600", href: "/ortu/izin" },
    { label: "Donasi", icon: Award, color: "bg-pink-500/10 text-pink-600", href: "/ortu/donasi" },
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
              <a href="/ortu/ppdb" className="bg-white text-primary px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm hover:scale-105 transition-transform flex items-center gap-1.5 shrink-0">
                 Daftar <ArrowRight className="h-3.5 w-3.5" />
              </a>
           </div>
        </div>

        {/* SchoolPay Wallet Card (EPIC 1) - PREMIUM ONLY */}
        {tenant?.plan !== "free" && (
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 shadow-lg shadow-indigo-500/30 text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-20">
                <Wallet className="h-24 w-24 -mr-6 -mt-6" />
             </div>
             <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                   <p className="text-sm font-medium text-white/80">Total Saldo SchoolPay</p>
                   <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0">Wallet Aktif</Badge>
                </div>
                <h2 className="text-3xl font-black mb-1">Rp {totalBalance.toLocaleString("id-ID")}</h2>
                <p className="text-xs text-white/70 mb-5">Terakumulasi dari {childrenData.length} rekening siswa</p>
                
                <div className="flex gap-3">
                   <Link href="/ortu/wallet/topup">
                     <Button size="sm" className="bg-white text-indigo-600 hover:bg-white/90 rounded-xl text-xs h-9">
                        <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Top Up Saldo
                     </Button>
                   </Link>
                   <Link href="/ortu/wallet">
                     <Button size="sm" variant="outline" className="border-white/30 text-white hover:bg-white/10 rounded-xl text-xs h-9 bg-transparent">
                        Riwayat Transaksi
                     </Button>
                   </Link>
                </div>
             </div>
          </div>
        )}

        {/* Tanggungan Siswa (Anak) */}
        <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
          <div className="flex justify-between items-center mb-3">
             <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
               <User className="h-4 w-4 text-primary" /> Data Anak / Tanggungan
             </h3>
          </div>
          <div className="space-y-3">
             {childrenData.length > 0 ? childrenData.map((child: any) => (
               <div key={child.id} className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors">
                 <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                   <User className="h-5 w-5 text-primary" />
                 </div>
                 <div className="flex-1 min-w-0">
                   <h4 className="text-sm font-bold text-foreground truncate">{child.name}</h4>
                   <p className="text-[11px] text-muted-foreground truncate">
                     {child.nisn ? `NISN: ${child.nisn} • ` : ""} 
                     {child.classroom ? child.classroom.name : "Belum masuk kelas"}
                   </p>
                 </div>
                 <div className="flex flex-col items-end gap-1">
                   <div className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 text-[10px] font-bold shrink-0">
                     {child.isActive ? "Aktif" : "Nonaktif"}
                   </div>
                   {tenant?.plan !== "free" && child.walletAccount && (
                     <span className="text-[10px] font-bold text-primary">Rp {child.walletAccount.balance.toLocaleString("id-ID")}</span>
                   )}
                 </div>
               </div>
             )) : (
               <div className="p-6 text-center border-2 border-dashed rounded-xl border-border">
                 <p className="text-xs text-muted-foreground">Belum ada data siswa yang tertaut.</p>
               </div>
             )}
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
             <a href="/ortu/tagihan" className="text-[10px] font-bold text-primary hover:underline">Lihat Semua →</a>
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
                       <p className="text-[10px] text-muted-foreground line-clamp-2" dangerouslySetInnerHTML={{ __html: post.content.substring(0, 150) }}></p>
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
