"use client"

import { useEffect, useState } from"react"
import { useSession } from"next-auth/react"
import { useToast } from"@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from"@/components/ui/select"
import { Badge } from"@/components/ui/badge"
import {
  CalendarCheck, Plus, Users, CheckCircle, XCircle, Loader2,
  Clock, AlertTriangle, BookOpen, ChevronRight
} from "lucide-react"
import Link from"next/link"
import { format } from"date-fns"
import { id as localeId } from"date-fns/locale"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { EmptyState } from "@/components/ui/empty-state"

export default function AttendanceSessionsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const tenant = session?.user?.tenants?.[0]
  const [sessions, setSessions] = useState<any[]>([])
  const [classrooms, setClassrooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedType, setSelectedType] = useState("DAILY")

  useEffect(() => {
    if (!tenant) return
    Promise.all([
      fetch(`/api/attendance/sessions?tenantId=${tenant.id}`).then(r => r.json()),
      fetch(`/api/classrooms?tenantId=${tenant.id}`).then(r => r.json()),
    ]).then(([sessData, classData]) => {
      setSessions(sessData.data || [])
      setClassrooms(classData || [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [tenant])

  const handleCreate = async () => {
    if (!tenant || !selectedClass) return toast({ title:"Pilih kelas terlebih dahulu", variant:"destructive" })
    setCreating(true)
    try {
      const res = await fetch("/api/attendance/sessions", {
        method:"POST",
        headers: {"Content-Type":"application/json" },
        body: JSON.stringify({
          tenantId: tenant.id,
          classroomId: selectedClass,
          date: new Date().toISOString().split("T")[0],
          type: selectedType,
        }),
      })
      const data = await res.json()
      if (!res.ok && res.status !== 409) throw new Error(data.error)
      if (res.status === 409) {
        toast({ title:"Sesi sudah ada hari ini", description:"Langsung buka sesi tersebut." })
      } else {
        toast({ title:"Sesi absensi dibuat!" })
      }
      const sessionId = data.session?.id || data.id
      window.location.href = `/admin/attendance/sessions/${sessionId}`
    } catch (err: any) {
      toast({ title:"Gagal", description: err.message, variant:"destructive" })
    } finally {
      setCreating(false)
    }
  }

  const statusCounts = sessions.reduce((acc: any, s: any) => {
    const total = s._count?.records || 0
    acc.total = (acc.total || 0) + 1
    acc.students = (acc.students || 0) + total
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sesi Absensi</h1>
          <p className="text-sm text-muted-foreground">Buat dan kelola sesi kehadiran harian per kelas.</p>
        </div>
      </div>

      {/* Create new session */}
      <Card className="glass border-0 border-primary/10 bg-primary/5">
        <CardContent className="p-5">
          <p className="font-bold mb-3 flex items-center gap-2">
            <Plus className="h-4 w-4" /> Buka Sesi Absensi Hari Ini
            <span className="text-muted-foreground font-normal text-sm ml-1">({format(new Date(),"EEEE, d MMMM yyyy", { locale: localeId })})</span>
          </p>
          <div className="flex gap-3">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="rounded-xl glass border-0 flex-1">
                <SelectValue placeholder="Pilih kelas..." />
              </SelectTrigger>
              <SelectContent>
                {classrooms.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="rounded-xl glass border-0 w-32 md:w-40">
                <SelectValue placeholder="Jenis Sesi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DAILY">Harian</SelectItem>
                <SelectItem value="EXAM">Ujian</SelectItem>
                <SelectItem value="EXTRACURRICULAR">Ekstrakurikuler</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleCreate} disabled={creating || !selectedClass} className="rounded-xl shrink-0">
              {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarCheck className="mr-2 h-4 w-4" />}
              Buka Sesi
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label:"Total Sesi", value: statusCounts.total || 0, icon: CalendarCheck, color:"text-primary bg-primary/10" },
          { label:"Total Siswa Dicatat", value: statusCounts.students || 0, icon: Users, color:"text-emerald-600 bg-emerald-500/10" },
          { label:"Pengajuan Izin", value:"—", icon: Clock, color:"text-amber-600 bg-amber-500/10" },
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

      {/* Sessions List */}
      <Card className="glass border-0">
        <CardHeader><CardTitle className="text-base">Riwayat Sesi</CardTitle></CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                {["Tanggal","Kelas","Jenis","Siswa","Aksi"].map(h => (
                  <TableHead key={h} className="text-xs font-bold uppercase">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-16 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
                  </TableCell>
                </TableRow>
              ) : sessions.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="p-0">
                    <EmptyState
                      icon={CalendarCheck}
                      title="Belum ada sesi absensi"
                      description="Buat sesi baru untuk mulai mencatat kehadiran."
                      className="border-0 rounded-none shadow-none bg-transparent min-h-[300px]"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                sessions.map((s: any) => (
                  <TableRow key={s.id} className="hover:bg-white/50 dark:hover:bg-white/5 transition-colors border-b last:border-0">
                    <TableCell className="font-semibold py-3">
                      {format(new Date(s.date),"d MMM yyyy", { locale: localeId })}
                    </TableCell>
                    <TableCell className="py-3">{s.classroom?.name || <span className="text-muted-foreground">Semua</span>}</TableCell>
                    <TableCell className="py-3">
                      <Badge className="bg-blue-500/10 text-blue-600 border-blue-200 border text-[10px]">{s.type}</Badge>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        {s._count?.records || 0} siswa
                      </span>
                    </TableCell>
                    <TableCell className="py-3">
                      <Link href={`/admin/attendance/sessions/${s.id}`}>
                        <Button size="sm" variant="outline" className="rounded-lg text-xs h-8 gap-1">
                          Buka <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
