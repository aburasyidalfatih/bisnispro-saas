"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { Calendar, Users, BookOpen, Clock, ChevronLeft, Plus, CheckCircle2, UserX, UserMinus, AlertCircle, Save, Mic } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

type Metadata = {
  classrooms: any[]
  subjects: any[]
  scheduleToday: any[]
  staffId: string | null
}

export default function JurnalPage() {
  const { data: session } = useSession()
  const tenantId = session?.user?.tenants?.[0]?.id

  const [mode, setMode] = useState<"list" | "create">("list")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [metadata, setMetadata] = useState<Metadata | null>(null)
  const [journals, setJournals] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])

  // Form State
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    classroomId: "",
    subjectId: "",
    topic: "",
    notes: ""
  })
  const [presences, setPresences] = useState<Record<string, { status: string, notes: string }>>({})

  useEffect(() => {
    if (!tenantId) return
    fetchMetadata()
  }, [tenantId])

  useEffect(() => {
    if (mode === "list" && metadata?.staffId) {
      fetchJournals()
    }
  }, [mode, metadata?.staffId])

  useEffect(() => {
    if (formData.classroomId && mode === "create") {
      fetchStudents(formData.classroomId)
    }
  }, [formData.classroomId, mode])

  const fetchMetadata = async () => {
    try {
      const res = await fetch(`/api/gtk/metadata?tenantId=${tenantId}`)
      if (res.ok) {
        const data = await res.json()
        setMetadata(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const fetchJournals = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/gtk/jurnal?tenantId=${tenantId}&staffId=${metadata?.staffId}`)
      if (res.ok) {
        setJournals(await res.json())
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async (classId: string) => {
    try {
      const res = await fetch(`/api/gtk/classrooms/${classId}/students?tenantId=${tenantId}`)
      if (res.ok) {
        const data = await res.json()
        setStudents(data)
        
        // Initialize all as HADIR
        const initialPresences: Record<string, { status: string, notes: string }> = {}
        data.forEach((s: any) => {
          initialPresences[s.id] = { status: "HADIR", notes: "" }
        })
        setPresences(initialPresences)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handlePresenceChange = (studentId: string, status: string) => {
    setPresences(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status }
    }))
  }

  const handleSubmit = async () => {
    if (!metadata?.staffId) return toast({ title: "Error", description: "Data staf tidak ditemukan", variant: "destructive" })
    if (!formData.classroomId || !formData.subjectId || !formData.topic) {
      return toast({ title: "Validasi", description: "Kelas, Mata Pelajaran, dan Materi wajib diisi", variant: "destructive" })
    }

    setSaving(true)
    try {
      const payload = {
        tenantId,
        staffId: metadata.staffId,
        classroomId: formData.classroomId,
        subjectId: formData.subjectId,
        date: new Date(formData.date).toISOString(),
        topic: formData.topic,
        notes: formData.notes,
        presences: Object.entries(presences).map(([studentId, data]) => ({
          studentId,
          status: data.status,
          notes: data.notes
        }))
      }

      const res = await fetch("/api/gtk/jurnal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        toast({ title: "Berhasil", description: "Jurnal & Absensi berhasil disimpan" })
        setMode("list")
        // Reset form
        setFormData({ ...formData, topic: "", notes: "", classroomId: "", subjectId: "" })
        setPresences({})
        setStudents([])
      } else {
        const err = await res.text()
        toast({ title: "Gagal", description: err, variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "Gagal", description: "Terjadi kesalahan sistem", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (loading && !metadata) return <div className="skeleton h-96 rounded-3xl" />

  if (mode === "create") {
    return (
      <div className="space-y-6 pb-10 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" onClick={() => setMode("list")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Buat Jurnal Baru</h1>
            <p className="text-muted-foreground text-sm">Catat materi pembelajaran dan absensi siswa hari ini.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="glass border-0 shadow-sm md:col-span-2">
            <CardHeader className="bg-muted/30 border-b border-border/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" /> Informasi Jurnal
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Tanggal</label>
                <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="rounded-xl bg-muted/40" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Mata Pelajaran</label>
                <Select value={formData.subjectId} onValueChange={(val) => setFormData({ ...formData, subjectId: val })}>
                  <SelectTrigger className="rounded-xl bg-muted/40">
                    <SelectValue placeholder="Pilih Mata Pelajaran" />
                  </SelectTrigger>
                  <SelectContent>
                    {metadata?.subjects.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Kelas</label>
                <Select value={formData.classroomId} onValueChange={(val) => setFormData({ ...formData, classroomId: val })}>
                  <SelectTrigger className="rounded-xl bg-muted/40">
                    <SelectValue placeholder="Pilih Kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    {metadata?.classrooms.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold">Materi / Topik Bahasan</label>
                  <div className="flex gap-2">
                     <Button type="button" onClick={() => setFormData(p => ({...p, topic: "Melanjutkan materi sebelumnya"}))} className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary/20 transition-colors">Lanjut Materi</Button>
                     <Button type="button" onClick={() => setFormData(p => ({...p, topic: "Ulangan Harian"}))} className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary/20 transition-colors">Ulangan</Button>
                  </div>
                </div>
                <div className="relative">
                  <Input placeholder="Contoh: Bab 1. Eksponen dan Logaritma" value={formData.topic} onChange={(e) => setFormData({ ...formData, topic: e.target.value })} className="rounded-xl bg-muted/40 pr-10" />
                  <Button type="button" onClick={() => toast({ title: "🎙️ Fitur Dikte Suara Aktif", description: "Mulai berbicara, kami akan mengubahnya menjadi teks..."})} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-primary transition-colors">
                     <Mic className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-semibold">Catatan Khusus (Opsional)</label>
                <div className="relative">
                  <Textarea placeholder="Ada kejadian khusus hari ini? (Siswa tidur, ribut, dll)" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="rounded-xl bg-muted/40 min-h-[80px] pr-10" />
                  <Button type="button" onClick={() => toast({ title: "🎙️ Fitur Dikte Suara Aktif", description: "Silakan sampaikan catatan kelas Anda secara lisan..."})} className="absolute right-2 bottom-3 p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-primary transition-colors">
                     <Mic className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {formData.classroomId && (
            <Card className="glass border-0 shadow-sm md:col-span-2">
              <CardHeader className="bg-muted/30 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" /> Absensi Siswa
                  </CardTitle>
                  <div className="text-sm font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">
                    {students.length} Siswa
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {students.length === 0 ? (
                  <div className="p-10 text-center text-muted-foreground">Tidak ada data siswa di kelas ini.</div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {students.map((student, index) => (
                      <div key={student.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-bold text-sm text-muted-foreground shrink-0">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-bold">{student.name}</p>
                            <p className="text-xs text-muted-foreground">NISN: {student.nisn || '-'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1.5 shrink-0 bg-muted/30 p-1.5 rounded-2xl w-full sm:w-auto justify-between sm:justify-start">
                          {[
                            { val: "HADIR", icon: CheckCircle2, label: "H", color: "text-emerald-600", active: "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" },
                            { val: "SAKIT", icon: Plus, label: "S", color: "text-blue-600", active: "bg-blue-500 text-white shadow-md shadow-blue-500/20" },
                            { val: "IZIN", icon: UserMinus, label: "I", color: "text-amber-600", active: "bg-amber-500 text-white shadow-md shadow-amber-500/20" },
                            { val: "ALPHA", icon: UserX, label: "A", color: "text-rose-600", active: "bg-rose-500 text-white shadow-md shadow-rose-500/20" },
                          ].map(btn => (
                            <Button
                              key={btn.val}
                              type="button"
                              onClick={() => handlePresenceChange(student.id, btn.val)}
                              className={cn(
                                "flex items-center justify-center gap-1.5 h-10 px-4 sm:px-5 rounded-xl text-sm font-semibold transition-all duration-200 outline-none",
                                presences[student.id]?.status === btn.val 
                                  ? btn.active 
                                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                              )}
                            >
                              <btn.icon className="h-4 w-4 hidden sm:block" />
                              {btn.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="md:col-span-2 pt-4 flex justify-end gap-3 sticky bottom-0 bg-background/80 backdrop-blur-md p-4 border-t z-10 -mx-4 sm:mx-0 sm:rounded-2xl sm:border sm:static">
             <Button variant="outline" className="rounded-xl px-6" onClick={() => setMode("list")} disabled={saving}>Batal</Button>
             <button className="rounded-xl px-8" onClick={handleSubmit} disabled={saving || !formData.classroomId}>
               {saving ? <div className="animate-spin h-5 w-5 border-2 border-white/20 border-t-white rounded-full" /> : <><Save className="mr-2 h-4 w-4" /> Simpan Jurnal & Absensi</>}
             </button>
          </div>
        </div>
      </div>
    )
  }

  // LIST MODE
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Jurnal Mengajar</h1>
          <p className="text-muted-foreground mt-1 text-sm">Riwayat materi pembelajaran dan presensi kelas.</p>
        </div>
        <Button className="rounded-xl w-full sm:w-auto shadow-md shadow-primary/20" onClick={() => setMode("create")}>
          <Plus className="mr-2 h-4 w-4" /> Buat Jurnal
        </Button>
      </div>

      {metadata?.scheduleToday && metadata.scheduleToday.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-primary text-sm">Saran Kelas Hari Ini</h4>
            <div className="flex flex-wrap gap-2 mt-2">
              {metadata.scheduleToday.map(s => (
                <Button 
                  key={s.id}
                  onClick={() => {
                    setFormData({ ...formData, classroomId: s.classroom.id, subjectId: s.subject.id })
                    setMode("create")
                  }}
                  className="text-xs bg-white dark:bg-black border rounded-lg px-3 py-1.5 hover:border-primary hover:text-primary transition-colors flex items-center gap-1.5 font-medium"
                >
                  <Clock className="h-3 w-3" /> {s.startTime} - {s.classroom.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 skeleton rounded-2xl" />)}
        </div>
      ) : journals.length === 0 ? (
        <div className="text-center py-20 bg-muted/20 border border-dashed rounded-3xl">
          <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="font-semibold text-muted-foreground">Belum ada jurnal</h3>
          <p className="text-sm text-muted-foreground mt-1">Anda belum membuat jurnal mengajar satupun.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {journals.map(j => {
            const hadirCount = j.presences.filter((p: any) => p.status === "HADIR").length
            const totalCount = j.presences.length
            return (
              <Card key={j.id} className="glass border-0 hover:border-border/50 transition-colors group">
                <CardContent className="p-5 flex flex-col sm:flex-row gap-4 sm:items-center">
                  <div className="flex flex-col items-center justify-center bg-primary/10 text-primary rounded-xl p-3 shrink-0 min-w-[80px]">
                    <span className="text-2xl font-black leading-none">{format(new Date(j.date), 'dd')}</span>
                    <span className="text-xs font-bold uppercase mt-1">{format(new Date(j.date), 'MMM', { locale: localeId })}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold bg-muted px-2 py-0.5 rounded text-foreground">{j.classroom.name}</span>
                      <span className="text-xs font-medium text-muted-foreground truncate">{j.subject.name}</span>
                    </div>
                    <h3 className="font-bold text-lg leading-tight truncate group-hover:text-primary transition-colors">{j.topic}</h3>
                    {j.notes && <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{j.notes}</p>}
                  </div>

                  <div className="flex items-center gap-4 shrink-0 sm:pl-4 sm:border-l sm:ml-2">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground font-medium mb-1">Kehadiran</p>
                      <p className="font-bold text-lg">{hadirCount}<span className="text-sm text-muted-foreground font-normal">/{totalCount}</span></p>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-full bg-muted/50 hover:bg-primary/10 hover:text-primary">
                      <ChevronLeft className="h-4 w-4 rotate-180" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
