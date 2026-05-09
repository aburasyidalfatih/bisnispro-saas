"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { BookOpen, Calendar, CheckCircle, Clock, Loader2, Users, FileText, ChevronRight, ChevronDown } from "lucide-react"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { cn } from "@/lib/utils"

const PRESENCE_STATUS = [
  { value: "HADIR", label: "Hadir", color: "bg-emerald-500/10 text-emerald-700 border-emerald-300" },
  { value: "IZIN", label: "Izin", color: "bg-blue-500/10 text-blue-700 border-blue-300" },
  { value: "SAKIT", label: "Sakit", color: "bg-amber-500/10 text-amber-700 border-amber-300" },
  { value: "ALPHA", label: "Alpha", color: "bg-red-500/10 text-red-700 border-red-300" },
]

export default function GTKJournalPage() {
  const { data: session } = useSession()
  const tenant = session?.user?.tenants?.[0]

  const [todaySchedules, setTodaySchedules] = useState<any[]>([])
  const [recentJournals, setRecentJournals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSchedule, setActiveSchedule] = useState<any | null>(null)
  const [topic, setTopic] = useState("")
  const [notes, setNotes] = useState("")
  const [presences, setPresences] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const load = async () => {
    if (!tenant) return
    setLoading(true)
    const [sched, jour] = await Promise.all([
      fetch(`/api/gtk/schedules?tenantId=${tenant.id}`).then(r => r.json()),
      fetch(`/api/gtk/journals?tenantId=${tenant.id}`).then(r => r.json()),
    ])
    setTodaySchedules(sched.schedules || [])
    setRecentJournals(jour.journals || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [tenant?.id])

  const openJournal = (schedule: any) => {
    setActiveSchedule(schedule)
    setTopic("")
    setNotes("")
    // Init all students to HADIR
    const init: Record<string, string> = {}
    schedule.classroom.students.forEach((s: any) => { init[s.id] = "HADIR" })
    setPresences(init)
  }

  const handleSave = async () => {
    if (!tenant || !activeSchedule || !topic.trim()) return
    setSaving(true)
    try {
      const res = await fetch("/api/gtk/journals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: tenant.id,
          classroomId: activeSchedule.classroom.id,
          subjectId: activeSchedule.subject.id,
          date: new Date().toISOString().split("T")[0],
          topic: topic.trim(),
          notes: notes.trim() || null,
          presences: Object.entries(presences).map(([studentId, status]) => ({ studentId, status })),
        }),
      })
      if (!res.ok) throw new Error()
      toast({ title: "Jurnal berhasil disimpan", description: `${activeSchedule.subject.name} - ${activeSchedule.classroom.name}` })
      setActiveSchedule(null)
      await load()
    } catch {
      toast({ title: "Gagal menyimpan jurnal", variant: "destructive" })
    }
    setSaving(false)
  }

  const today = format(new Date(), "EEEE, d MMMM yyyy", { locale: localeId })
  const hadirCount = Object.values(presences).filter(v => v === "HADIR").length

  if (loading) return (
    <div className="space-y-4">
      <div className="skeleton h-8 w-48" />
      {[1,2].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Jurnal Mengajar</h1>
        <p className="text-muted-foreground">{today}</p>
      </div>

      {/* Jadwal Hari Ini */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Jadwal Hari Ini</h2>
        {todaySchedules.length === 0 ? (
          <Card className="glass border-0">
            <CardContent className="p-8 text-center">
              <Calendar className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">Tidak ada jadwal mengajar hari ini</p>
            </CardContent>
          </Card>
        ) : todaySchedules.map((schedule: any) => {
          const isOpen = activeSchedule?.id === schedule.id
          return (
            <Card key={schedule.id} className={cn("glass border-0 transition-all", isOpen && "border border-primary/30")}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3 cursor-pointer" onClick={() => isOpen ? setActiveSchedule(null) : openJournal(schedule)}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{schedule.subject.name}</p>
                      <p className="text-xs text-muted-foreground">{schedule.classroom.name} · {schedule.startTime}–{schedule.endTime}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{schedule.classroom.students.length} siswa</Badge>
                    {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-4 space-y-4 border-t border-border/50 pt-4">
                    {/* Topic */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Topik / Materi <span className="text-destructive">*</span></Label>
                      <Input placeholder="Misal: Persamaan Linear Dua Variabel" value={topic} onChange={e => setTopic(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Catatan (Opsional)</Label>
                      <Textarea placeholder="Catatan tambahan untuk jurnal..." value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="resize-none" />
                    </div>

                    {/* Presensi Siswa */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Presensi Siswa</Label>
                        <span className="text-xs text-muted-foreground">{hadirCount}/{schedule.classroom.students.length} hadir</span>
                      </div>
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {schedule.classroom.students.map((student: any, idx: number) => (
                          <div key={student.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-3 py-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs text-muted-foreground w-6 text-right shrink-0">{idx + 1}.</span>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{student.name}</p>
                                {student.nis && <p className="text-[11px] text-muted-foreground">{student.nis}</p>}
                              </div>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              {PRESENCE_STATUS.map(ps => (
                                <button key={ps.value}
                                  className={cn("rounded-lg border px-2 py-1 text-[10px] font-bold transition-all",
                                    presences[student.id] === ps.value ? ps.color : "border-border text-muted-foreground hover:bg-muted")}
                                  onClick={() => setPresences(p => ({ ...p, [student.id]: ps.value }))}>
                                  {ps.label[0]}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button onClick={handleSave} disabled={saving || !topic.trim()} className="btn-gradient">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                        Simpan Jurnal
                      </Button>
                      <Button variant="outline" onClick={() => setActiveSchedule(null)}>Batal</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Riwayat Jurnal */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Riwayat Jurnal (30 Terakhir)</h2>
        {recentJournals.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Belum ada jurnal yang diisi</p>
        ) : (
          <div className="space-y-2">
            {recentJournals.map((j: any) => {
              const hadir = j.presences?.filter((p: any) => p.status === "HADIR").length || 0
              return (
                <div key={j.id} className="flex items-center gap-3 rounded-xl bg-muted/30 px-4 py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{j.subject.name} — {j.classroom.name}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(j.date), "d MMM yyyy", { locale: localeId })} · {j.topic}</p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">{hadir} hadir</Badge>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
