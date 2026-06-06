"use client"

import { useEffect, useState } from"react"
import { useSession } from"next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from"@/components/ui/select"
import { Label } from"@/components/ui/label"
import { ConfirmDialog } from"@/components/shared/confirm-dialog"
import { toast } from"@/hooks/use-toast"
import { Calendar, Clock, Plus, Trash2, Loader2, BookOpen, Users, GraduationCap } from"lucide-react"
import { cn } from"@/lib/utils"

const DAYS = ["","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"]
const HOURS = Array.from({ length: 14 }, (_, i) => {
  const h = i + 6
  return { value: `${String(h).padStart(2,"0")}:00`, label: `${String(h).padStart(2,"0")}:00` }
})

interface Schedule {
  id: string; dayOfWeek: number; startTime: string; endTime: string
  subject: { id: string; name: string; code: string | null }
  classroom: { id: string; name: string; level: string | null }
  staff: { id: string; name: string }
}

export default function SchedulesPage() {
  const { data: session } = useSession()
  const tenant = session?.user?.tenants?.[0]

  const [classrooms, setClassrooms] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [selectedClass, setSelectedClass] = useState("")
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({ subjectId:"", staffId:"", dayOfWeek:"", startTime:"07:00", endTime:"08:30" })

  useEffect(() => {
    if (!tenant) return
    Promise.all([
      fetch(`/api/classrooms?tenantId=${tenant.id}`).then(r => r.json()),
      fetch(`/api/subjects?tenantId=${tenant.id}`).then(r => r.json()),
      fetch(`/api/gtk/staff?tenantId=${tenant.id}`).then(r => r.json()).catch(() => ({ staff: [] })),
    ]).then(([cls, subj, stf]) => {
      setClassrooms(cls.classrooms || [])
      setSubjects(subj.subjects || [])
      setStaff(stf.staff || [])
    })
  }, [tenant?.id])

  const loadSchedules = async (classroomId: string) => {
    if (!tenant || !classroomId) return
    setLoading(true)
    const res = await fetch(`/api/schedules?tenantId=${tenant.id}&classroomId=${classroomId}`)
    const data = await res.json()
    setSchedules(data.schedules || [])
    setLoading(false)
  }

  const handleClassChange = (v: string) => {
    setSelectedClass(v)
    loadSchedules(v)
  }

  const handleAdd = async () => {
    if (!tenant || !form.subjectId || !form.staffId || !form.dayOfWeek || !selectedClass) return
    setSaving(true)
    try {
      const res = await fetch("/api/schedules", {
        method:"POST",
        headers: {"Content-Type":"application/json" },
        body: JSON.stringify({
          tenantId: tenant.id, classroomId: selectedClass,
          subjectId: form.subjectId, staffId: form.staffId,
          dayOfWeek: Number(form.dayOfWeek),
          startTime: form.startTime, endTime: form.endTime,
        }),
      })
      if (!res.ok) throw new Error()
      toast({ title:"Jadwal ditambahkan" })
      setForm({ subjectId:"", staffId:"", dayOfWeek:"", startTime:"07:00", endTime:"08:30" })
      setShowForm(false)
      await loadSchedules(selectedClass)
    } catch {
      toast({ title:"Gagal", description:"Tidak bisa menambahkan jadwal", variant:"destructive" })
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await fetch(`/api/schedules/${deleteId}`, { method:"DELETE" })
    toast({ title:"Jadwal dihapus" })
    setDeleteId(null)
    if (selectedClass) await loadSchedules(selectedClass)
  }

  // Group by day
  const byDay = DAYS.slice(1).map((day, idx) => ({
    day, idx: idx + 1,
    items: schedules.filter(s => s.dayOfWeek === idx + 1),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Jadwal Pelajaran</h1>
          <p className="text-muted-foreground">Kelola roster jadwal per kelas</p>
        </div>
        {selectedClass && (
          <Button className="gap-2 btn-gradient flex items-center justify-center h-10 px-4" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" /> Tambah Slot
          </Button>
        )}
      </div>

      {/* Pilih Kelas */}
      <Card className="glass border-0">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-5 w-5 text-primary shrink-0" />
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground mb-1 block">Pilih Kelas</Label>
              <Select value={selectedClass} onValueChange={handleClassChange}>
                <SelectTrigger className="border-0 bg-muted/40 h-9">
                  <SelectValue placeholder="— Pilih kelas —" />
                </SelectTrigger>
                <SelectContent>
                  {classrooms.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name} {c.level ? `(${c.level})` :""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Tambah */}
      {showForm && (
        <Card className="glass border-0 border-l-4 border-l-primary">
          <CardHeader className="pb-3"><CardTitle className="text-base">Tambah Slot Jadwal</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Hari</Label>
                <Select value={form.dayOfWeek} onValueChange={v => setForm(f => ({ ...f, dayOfWeek: v }))}>
                  <SelectTrigger><SelectValue placeholder="Pilih hari" /></SelectTrigger>
                  <SelectContent>{DAYS.slice(1).map((d, i) => <SelectItem key={i+1} value={String(i+1)}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Jam Mulai</Label>
                <Select value={form.startTime} onValueChange={v => setForm(f => ({ ...f, startTime: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{HOURS.map(h => <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Jam Selesai</Label>
                <Select value={form.endTime} onValueChange={v => setForm(f => ({ ...f, endTime: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{HOURS.map(h => <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Mata Pelajaran</Label>
                <Select value={form.subjectId} onValueChange={v => setForm(f => ({ ...f, subjectId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Pilih mapel" /></SelectTrigger>
                  <SelectContent>{subjects.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Guru Pengampu</Label>
                <Select value={form.staffId} onValueChange={v => setForm(f => ({ ...f, staffId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Pilih guru" /></SelectTrigger>
                  <SelectContent>{staff.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd} disabled={saving || !form.subjectId || !form.staffId || !form.dayOfWeek} className="btn-gradient flex items-center justify-center h-10 px-4">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Simpan Jadwal
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid Jadwal per Hari */}
      {!selectedClass ? (
        <Card className="glass border-0">
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Pilih kelas untuk melihat jadwal pelajarannya</p>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {byDay.map(({ day, idx, items }) => (
            <Card key={day} className="glass border-0">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold",
                    items.length > 0 ?"bg-primary/15 text-primary" :"bg-muted text-muted-foreground")}>
                    {idx}
                  </span>
                  {day}
                  <span className="ml-auto text-xs text-muted-foreground font-normal">{items.length} jam</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                {items.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Tidak ada jadwal</p>
                ) : items.map(s => (
                  <div key={s.id} className="flex items-start justify-between gap-2 rounded-xl bg-muted/40 px-3 py-2 group/item">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{s.subject.name}</p>
                      <p className="text-[11px] text-muted-foreground">{s.staff.name}</p>
                      <p className="text-[11px] text-primary font-mono">{s.startTime} – {s.endTime}</p>
                    </div>
                    <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0 rounded-lg text-destructive hover:text-destructive opacity-0 group-hover/item:opacity-100 transition-opacity"
                      onClick={() => setDeleteId(s.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId} onOpenChange={() => setDeleteId(null)}
        title="Hapus slot jadwal ini?" description="Jadwal akan dihapus secara permanen."
        onConfirm={handleDelete} confirmText="Hapus" variant="destructive"
      />
    </div>
  )
}
