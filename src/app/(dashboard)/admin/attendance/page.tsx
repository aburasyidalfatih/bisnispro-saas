"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  CalendarCheck, Users, CheckCircle, XCircle, Clock,
  Minus, Loader2, TrendingUp, FileCheck, ArrowRight, GraduationCap
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

export default function AttendanceDashboardPage() {
  const { data: session } = useSession()
  const tenant = session?.user?.tenants?.[0]
  const [sessions, setSessions] = useState<any[]>([])
  const [classrooms, setClassrooms] = useState<any[]>([])
  const [pendingPermits, setPendingPermits] = useState(0)
  const [loading, setLoading] = useState(true)
  const [classFilter, setClassFilter] = useState("all")

  useEffect(() => {
    if (!tenant) return
    Promise.all([
      fetch(`/api/attendance/sessions?tenantId=${tenant.id}`).then(r => r.json()),
      fetch(`/api/classrooms?tenantId=${tenant.id}`).then(r => r.json()),
      fetch(`/api/attendance/permits?tenantId=${tenant.id}&status=PENDING`).then(r => r.json()),
    ]).then(([sessData, classData, permitsData]) => {
      setSessions(sessData.data || [])
      setClassrooms(classData || [])
      setPendingPermits(Array.isArray(permitsData) ? permitsData.length : 0)
    }).catch(console.error).finally(() => setLoading(false))
  }, [tenant])

  const today = format(new Date(), "yyyy-MM-dd")
  const todaySessions = sessions.filter(s => s.date?.startsWith(today))
  const totalSessions = sessions.length
  const totalRecords = sessions.reduce((a, s) => a + (s._count?.records || 0), 0)

  const navItems = [
    { label: "Absensi Siswa", href: "/admin/attendance/sessions", icon: CalendarCheck, color: "from-blue-500 to-indigo-500", desc: `${todaySessions.length} sesi dibuka hari ini` },
    { label: "Absensi Guru & Staf", href: "/admin/attendance/gtk", icon: GraduationCap, color: "from-violet-500 to-purple-600", desc: "Monitor dengan GPS & foto" },
    { label: "Pengajuan Izin", href: "/admin/attendance/permits", icon: FileCheck, color: "from-amber-500 to-orange-500", desc: `${pendingPermits} menunggu persetujuan`, badge: pendingPermits },
    { label: "Rekap Per Kelas", href: "/admin/attendance/sessions", icon: Users, color: "from-emerald-500 to-teal-500", desc: `${classrooms.length} kelas terdaftar` },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kehadiran & Absensi</h1>
        <p className="text-sm text-muted-foreground">Pantau kehadiran siswa dan kelola surat izin.</p>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Sesi Hari Ini", value: todaySessions.length, icon: CalendarCheck, color: "text-primary bg-primary/10" },
          { label: "Total Sesi", value: totalSessions, icon: TrendingUp, color: "text-indigo-600 bg-indigo-500/10" },
          { label: "Siswa Dicatat", value: totalRecords, icon: Users, color: "text-emerald-600 bg-emerald-500/10" },
          { label: "Izin Menunggu", value: pendingPermits, icon: Clock, color: pendingPermits > 0 ? "text-amber-600 bg-amber-500/10" : "text-slate-400 bg-slate-100" },
        ].map((s, i) => (
          <Card key={i} className="glass border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="font-black text-xl">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alert izin menunggu */}
      {pendingPermits > 0 && (
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-200">
          <Clock className="h-8 w-8 text-amber-600 shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-amber-800">{pendingPermits} pengajuan izin menunggu</p>
            <p className="text-sm text-amber-700">Tinjau dan setujui pengajuan dari orang tua.</p>
          </div>
          <Link href="/admin/attendance/permits">
            <Button size="sm" className="rounded-xl bg-amber-500 hover:bg-amber-600 shrink-0">Tinjau</Button>
          </Link>
        </div>
      )}

      {/* Nav Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {navItems.map((item, i) => (
          <Link key={i} href={item.href}>
            <Card className="glass border-0 hover:shadow-lg transition-all cursor-pointer group overflow-hidden">
              <CardContent className="p-0">
                <div className={`bg-gradient-to-br ${item.color} p-5 text-white`}>
                  <item.icon className="h-8 w-8 mb-3" />
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-lg leading-tight">{item.label}</p>
                    {item.badge && item.badge > 0 && (
                      <span className="bg-white/30 text-white text-xs font-bold px-2 py-0.5 rounded-full">{item.badge}</span>
                    )}
                  </div>
                  <p className="text-white/80 text-sm mt-1">{item.desc}</p>
                </div>
                <div className="p-4 flex items-center text-sm text-muted-foreground group-hover:text-primary transition-colors">
                  Buka <ArrowRight className="ml-auto h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Sesi Terbaru */}
      <Card className="glass border-0">
        <CardHeader className="flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Sesi Absensi Terbaru</CardTitle>
          <Link href="/admin/attendance/sessions" className="text-xs text-primary hover:underline">Lihat Semua →</Link>
        </CardHeader>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : sessions.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">Belum ada sesi absensi.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  {["Tanggal", "Kelas", "Siswa Dicatat", "Aksi"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {sessions.slice(0, 8).map((s: any) => (
                  <tr key={s.id} className="hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-semibold text-sm">
                      {format(new Date(s.date), "d MMM yyyy", { locale: localeId })}
                    </td>
                    <td className="px-4 py-3 text-sm">{s.classroom?.name || <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-sm">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" /> {s._count?.records || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/attendance/sessions/${s.id}`}>
                        <Button size="sm" variant="outline" className="rounded-lg h-7 text-xs gap-1">
                          Buka <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  )
}
