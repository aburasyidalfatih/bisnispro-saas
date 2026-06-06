"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Clock, Wallet, Award, FileText, QrCode, MonitorSmartphone, Bell, ChevronRight, BookOpen, ChevronDown, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { DashboardSkeleton } from "@/components/shared/dashboard-skeleton"
import { Button } from "@/components/ui/button"

export default function PanelSiswaDashboard() {
  const { data: session } = useSession()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showBalance, setShowBalance] = useState(true)

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 11) return "Selamat Pagi,"
    if (hour < 15) return "Selamat Siang,"
    if (hour < 18) return "Selamat Sore,"
    return "Selamat Malam,"
  }

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch("/api/siswa/dashboard")
        if (res.ok) {
          setData(await res.json())
        }
      } catch (e) {
        console.error("Failed to load dashboard data", e)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  const layananSiswa = [
    { icon: MonitorSmartphone, label: "Ujian CBT", color: "text-rose-500", bg: "bg-rose-50", border: "border-rose-100", href: "/siswa/cbt" },
    { icon: Calendar, label: "Jadwal", color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-100", href: "/siswa/jadwal" },
    { icon: Clock, label: "Kehadiran", color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-100", href: "/siswa/absensi" },
    { icon: Award, label: "Nilai", color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100", href: "/siswa/nilai" },
    { icon: Wallet, label: "Tabungan", color: "text-indigo-500", bg: "bg-indigo-50", border: "border-indigo-100", href: "/siswa/wallet" },
    { icon: FileText, label: "Tugas", color: "text-pink-500", bg: "bg-pink-50", border: "border-pink-100", href: "/siswa/tugas" },
    { icon: QrCode, label: "E-KTM", color: "text-purple-500", bg: "bg-purple-50", border: "border-purple-100", href: "/siswa/kartu" },
    { icon: BookOpen, label: "Materi", color: "text-cyan-500", bg: "bg-cyan-50", border: "border-cyan-100", href: "/siswa/materi" },
  ]

  const jadwalEsok = data?.tomorrowSchedules || []

  const announcements = data?.announcements || []

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      {/* Profil Header Premium dengan Saldo */}
      <div className="bg-gradient-to-br from-indigo-600 via-primary to-blue-700 rounded-saas-card p-4 sm:p-6 text-white shadow-xl shadow-primary/30 relative overflow-hidden">
        {/* Ornamen Latar */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-2xl -ml-5 -mb-5" />
        
        {/* Identitas */}
        <div className="relative flex justify-between items-start z-10 mb-6">
          <div>
            <p className="text-sm text-indigo-100 font-medium mb-1">{getGreeting()}</p>
            <h2 className="font-bold text-2xl leading-tight">{data?.student?.name || session?.user?.name || "Siswa"}</h2>
            <div className="flex gap-2 mt-2">
              <span className="text-[10px] bg-white/20 border border-white/30 px-2.5 py-0.5 rounded-full font-bold tracking-wider backdrop-blur-sm">
                {data?.student?.className ? data.student.className.toUpperCase() : "BELUM ADA KELAS"}
              </span>
              {data?.student?.nis && (
                <span className="text-[10px] bg-black/20 border border-white/10 px-2.5 py-0.5 rounded-full font-bold tracking-wider backdrop-blur-sm">
                  NIS: {data.student.nis}
                </span>
              )}
            </div>
          </div>
          <Link href="/siswa/kartu" className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center shrink-0 border-2 border-white/50 backdrop-blur-sm shadow-inner cursor-pointer">
            <QrCode className="w-6 h-6 text-white" />
          </Link>
        </div>

        {/* Saldo Tabungan Widget */}
        <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-inner">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-semibold text-indigo-100 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5" /> Saldo Tabungan
            </span>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowBalance(!showBalance)} className="text-indigo-100 hover:text-white transition-colors" title={showBalance ? "Sembunyikan Saldo" : "Tampilkan Saldo"}>
                {showBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </Button>
              <Link href="/siswa/wallet" className="text-xs font-bold text-white hover:underline flex items-center">
                Riwayat <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-bold text-indigo-50">Rp</span>
            <span className="text-3xl font-black tracking-tight drop-shadow-sm transition-all duration-300">
              {showBalance ? (data?.wallet?.balance ? data.wallet.balance.toLocaleString("id-ID") : "0") : "••••••"}
            </span>
          </div>
        </div>
      </div>

      {/* Menu Layanan Utama Siswa */}
      <div>
        <h3 className="font-bold text-slate-800 mb-3 ml-1">Layanan Akademik</h3>
        <Card className="glass border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="grid grid-cols-4 gap-y-6 gap-x-2">
              {layananSiswa.map((item, idx) => (
                <Link key={idx} href={item.href} className="flex flex-col items-center gap-2 group cursor-pointer">
                  <div className={`w-14 h-14 rounded-2xl ${item.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-sm border ${item.border}`}>
                    <item.icon className={`w-6 h-6 ${item.color}`} />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-600 text-center leading-tight px-1">
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Papan Pengumuman */}
      <div>
        <div className="flex items-center justify-between mb-3 ml-1 mr-1">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-500" /> Pengumuman
          </h3>
        </div>
        <div className="space-y-3">
          {announcements.length > 0 ? announcements.map((ann: any, idx: number) => (
            <Card key={idx} className="glass border-l-4 border-l-amber-500 shadow-sm overflow-hidden bg-gradient-to-r from-amber-50/50 to-white dark:from-amber-500/5 dark:to-card">
              <CardContent className="p-4 flex gap-3 items-start">
                <div className="w-10 h-10 bg-white dark:bg-card rounded-full flex items-center justify-center shrink-0 shadow-sm border border-amber-100 dark:border-amber-500/20">
                  <MonitorSmartphone className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-sm">{ann.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{ann.excerpt}</p>
                  <p className="text-[10px] text-muted-foreground font-semibold mt-2">{ann.timeAgo || "Baru saja"} • Tata Usaha</p>
                </div>
              </CardContent>
            </Card>
          )) : (
            <Card className="glass border-0 shadow-sm">
              <CardContent className="py-8 text-center">
                <Bell className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Belum ada pengumuman terbaru.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Jadwal Pelajaran Esok Hari */}
      <div>
        <div className="flex items-center justify-between mb-3 ml-1 mr-1">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" /> Jadwal Besok
          </h3>
          <Link href="/siswa/jadwal" className="text-xs font-bold text-primary flex items-center">
            Selengkapnya <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        
        <div className="space-y-3">
        {jadwalEsok.length > 0 ? jadwalEsok.map((item: any, idx: number) => (
            <Card key={idx} className="glass border-0 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="p-4 flex items-center justify-between bg-card hover:bg-muted/40 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="bg-muted px-2 py-1.5 rounded-lg text-center min-w-[60px] border">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase">Jam Ke</div>
                      <div className="text-sm font-black text-foreground">{idx + 1}</div>
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-sm">{item.subject}</h4>
                      <p className="text-xs font-medium text-muted-foreground mt-0.5">{item.teacher}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-muted-foreground">{item.time}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )) : (
            <Card className="glass border-0 shadow-sm">
              <CardContent className="py-8 text-center">
                <Calendar className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Jadwal besok belum tersedia.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

    </div>
  )
}
