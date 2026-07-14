"use client"

import { useEffect, useState } from"react"
import { useSession } from"next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from"@/components/ui/select"
import { Label } from"@/components/ui/label"
import { Input } from"@/components/ui/input"
import { ConfirmDialog } from"@/components/shared/confirm-dialog"
import { toast } from"@/hooks/use-toast"
import { Calendar, Clock, Plus, Trash2, Loader2, BookOpen, Users, GraduationCap, Download } from"lucide-react"
import { cn } from"@/lib/utils"

const DAYS = ["","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"]

interface Schedule {
  id: string; dayOfWeek: number; startTime: string; endTime: string
  isBreak: boolean; breakName: string | null
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
  const [form, setForm] = useState({ id: "", subjectId:"", staffId:"", dayOfWeek:"", startTime:"07:00", endTime:"08:30", isBreak: false, breakName:"" })

  useEffect(() => {
    if (!tenant) return
    Promise.all([
      fetch(`/api/classrooms?tenantId=${tenant.id}`).then(r => r.json()),
      fetch(`/api/subjects?tenantId=${tenant.id}`).then(r => r.json()),
      fetch(`/api/gtk/staff?tenantId=${tenant.id}`).then(r => r.json()).catch(() => ({ staff: [] })),
    ]).then(([cls, subj, stf]) => {
      setClassrooms(Array.isArray(cls) ? cls : cls.classrooms || [])
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

  const handleSave = async () => {
    if (!tenant || !form.dayOfWeek || !selectedClass) return
    if (!form.isBreak && (!form.subjectId || !form.staffId)) return
    if (form.isBreak && !form.breakName) return
    setSaving(true)
    try {
      const isEdit = !!form.id
      const url = isEdit ? `/api/schedules/${form.id}` : "/api/schedules"
      const method = isEdit ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: {"Content-Type":"application/json" },
        body: JSON.stringify({
          tenantId: tenant.id, classroomId: selectedClass,
          subjectId: form.subjectId, staffId: form.staffId,
          dayOfWeek: Number(form.dayOfWeek),
          startTime: form.startTime, endTime: form.endTime,
          isBreak: form.isBreak, breakName: form.breakName
        }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || "Terjadi kesalahan saat menyimpan jadwal")
      }
      
      toast({ title: isEdit ? "Jadwal diperbarui" : "Jadwal ditambahkan" })
      setForm({ id: "", subjectId:"", staffId:"", dayOfWeek:"", startTime:"07:00", endTime:"08:30", isBreak: false, breakName:"" })
      setShowForm(false)
      await loadSchedules(selectedClass)
    } catch (error: any) {
      toast({ title:"Gagal Menyimpan", description: error.message, variant:"destructive" })
    }
    setSaving(false)
  }

  const handleEditClick = (s: Schedule) => {
    setForm({
      id: s.id,
      subjectId: s.subjectId || "",
      staffId: s.staffId || "",
      dayOfWeek: String(s.dayOfWeek),
      startTime: s.startTime,
      endTime: s.endTime,
      isBreak: s.isBreak,
      breakName: s.breakName || "",
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await fetch(`/api/schedules/${deleteId}`, { method:"DELETE" })
    toast({ title:"Jadwal dihapus" })
    setDeleteId(null)
    if (selectedClass) await loadSchedules(selectedClass)
  }

  const exportToExcel = async () => {
    if (!selectedClass || schedules.length === 0) {
      toast({ title: "Gagal", description: "Tidak ada jadwal untuk kelas ini.", variant: "destructive" })
      return
    }

    try {
      const ExcelJS = (await import("exceljs")).default
      const workbook = new ExcelJS.Workbook()
      const sheet = workbook.addWorksheet("Jadwal Pelajaran")
      
      const className = classrooms.find(c => c.id === selectedClass)?.name || "Kelas"
      
      // Setup styles & columns
      sheet.columns = [
        { header: "", key: "time", width: 18 },
        { header: "", key: "1", width: 22 },
        { header: "", key: "2", width: 22 },
        { header: "", key: "3", width: 22 },
        { header: "", key: "4", width: 22 },
        { header: "", key: "5", width: 22 },
        { header: "", key: "6", width: 22 },
      ]

      // Headers
      sheet.mergeCells('A1:G1')
      const titleCell = sheet.getCell('A1')
      titleCell.value = "JADWAL PELAJARAN"
      titleCell.font = { bold: true, size: 14 }
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
      
      sheet.mergeCells('A2:G2')
      const subtitleCell = sheet.getCell('A2')
      subtitleCell.value = `Kelas: ${className}`
      subtitleCell.font = { bold: true, size: 12 }
      subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' }

      sheet.addRow([])

      // Table Headers
      const headerRow = sheet.addRow(["Jam & Waktu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"])
      headerRow.font = { bold: true }
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' }
      headerRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } }
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
      })

      // Get unique time slots and sort them
      const timeSlots = Array.from(new Set(schedules.map(s => `${s.startTime} - ${s.endTime}`)))
        .sort((a, b) => a.localeCompare(b))

      // Fill data
      timeSlots.forEach(timeLabel => {
        const rowData: any = { time: timeLabel }
        let rowHeight = 30
        
        for (let day = 1; day <= 6; day++) {
          const classInSlot = schedules.find(s => s.dayOfWeek === day && `${s.startTime} - ${s.endTime}` === timeLabel)
          if (classInSlot) {
            if (classInSlot.isBreak) {
              rowData[String(day)] = classInSlot.breakName || "Istirahat"
            } else {
              rowData[String(day)] = `${classInSlot.subject?.name || "-"}\n(${classInSlot.staff?.name || "-"})`
            }
            rowHeight = 45 // taller if content exists
          } else {
            rowData[String(day)] = "-"
          }
        }
        
        const row = sheet.addRow(rowData)
        row.height = rowHeight
        row.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
        row.eachCell(cell => {
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
        })
      })

      // Generate and Download
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Jadwal_${className.replace(/\s+/g, '_')}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
      
      toast({ title: "Berhasil", description: "File Excel berhasil diunduh" })
    } catch (e) {
      console.error(e)
      toast({ title: "Gagal", description: "Terjadi kesalahan saat membuat Excel", variant: "destructive" })
    }
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
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2 h-10 px-4 font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border-emerald-200" onClick={exportToExcel}>
              <Download className="h-4 w-4" /> Export Excel
            </Button>
            <Button className="gap-2 btn-gradient flex items-center justify-center h-10 px-4" onClick={() => {
              setForm({ id: "", subjectId:"", staffId:"", dayOfWeek:"", startTime:"07:00", endTime:"08:30", isBreak: false, breakName:"" })
              setShowForm(true)
            }}>
              <Plus className="h-4 w-4" /> Tambah Slot
            </Button>
          </div>
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

      {/* Form Tambah/Edit */}
      {showForm && (
        <Card className="glass border-0 border-l-4 border-l-primary">
          <CardHeader className="pb-3"><CardTitle className="text-base">{form.id ? "Edit Slot Jadwal" : "Tambah Slot Jadwal"}</CardTitle></CardHeader>
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
                <Input 
                  type="time" 
                  value={form.startTime} 
                  onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Jam Selesai</Label>
                <Input 
                  type="time" 
                  value={form.endTime} 
                  onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                  required
                />
              </div>
              {!form.isBreak ? (
                <>
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
                </>
              ) : (
                <div className="space-y-2 sm:col-span-3">
                  <Label>Nama Istirahat</Label>
                  <Input 
                    placeholder="Contoh: Istirahat, Sholat Dhuha..." 
                    value={form.breakName} 
                    onChange={e => setForm(f => ({ ...f, breakName: e.target.value }))}
                  />
                </div>
              )}
              <div className="sm:col-span-3 flex items-center gap-2 mt-2 bg-amber-500/10 text-amber-900 dark:text-amber-500 p-3 rounded-lg border border-amber-500/20">
                <input 
                  type="checkbox" 
                  id="isBreak"
                  checked={form.isBreak}
                  onChange={e => setForm(f => ({ ...f, isBreak: e.target.checked }))}
                  className="h-4 w-4 rounded border-amber-500/50 text-amber-600 focus:ring-amber-600"
                />
                <Label htmlFor="isBreak" className="font-semibold cursor-pointer">Ini adalah waktu istirahat (bukan mata pelajaran)</Label>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving} className="btn-gradient flex items-center justify-center h-10 px-4">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Simpan Jadwal
              </Button>
              <Button variant="outline" onClick={() => {
                setForm({ id: "", subjectId:"", staffId:"", dayOfWeek:"", startTime:"07:00", endTime:"08:30", isBreak: false, breakName:"" })
                setShowForm(false)
              }}>Batal</Button>
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
                  <div key={s.id} className={cn("flex items-start justify-between gap-2 rounded-xl px-3 py-2 group/item", s.isBreak ? "bg-amber-500/10 border border-amber-500/20" : "bg-muted/40")}>
                    <div className="min-w-0">
                      <p className={cn("text-xs font-semibold truncate", s.isBreak ? "text-amber-700 dark:text-amber-500" : "text-foreground")}>
                        {s.isBreak ? s.breakName : s.subject?.name}
                      </p>
                      {!s.isBreak && <p className="text-[11px] text-muted-foreground">{s.staff?.name}</p>}
                      <p className={cn("text-[11px] font-mono", s.isBreak ? "text-amber-600/80" : "text-primary")}>{s.startTime} – {s.endTime}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0 rounded-lg text-primary hover:text-primary"
                        onClick={() => handleEditClick(s)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0 rounded-lg text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(s.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
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
