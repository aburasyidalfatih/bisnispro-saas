"use client"

import { useEffect, useState } from"react"
import { useSession } from"next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { Input } from"@/components/ui/input"
import { Label } from"@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from"@/components/ui/select"
import { Badge } from"@/components/ui/badge"
import { Textarea } from"@/components/ui/textarea"
import { ConfirmDialog } from"@/components/shared/confirm-dialog"
import { toast } from"@/hooks/use-toast"
import { ShieldAlert, Plus, Search, AlertTriangle, Star, Loader2, Calendar } from"lucide-react"
import { format } from"date-fns"
import { id as localeId } from"date-fns/locale"
import { cn } from"@/lib/utils"

const CATEGORIES = ["KEDISIPLINAN","AKADEMIK","ATRIBUT","PERILAKU"]
const TYPES = [
  { value:"PELANGGARAN", label:"Pelanggaran", color:"bg-red-500/10 text-red-700 border-red-300" },
  { value:"PENGHARGAAN", label:"Penghargaan", color:"bg-emerald-500/10 text-emerald-700 border-emerald-300" },
]

export default function DisciplinePage() {
  const { data: session } = useSession()
  const tenant = session?.user?.tenants?.[0]

  const [records, setRecords] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState("all")

  const [form, setForm] = useState({
    studentId:"", staffId:"", type:"PELANGGARAN",
    category:"KEDISIPLINAN", description:"", points:"5",
    date: new Date().toISOString().split("T")[0],
  })

  const load = async () => {
    if (!tenant) return
    setLoading(true)
    const [rec, stu, stf] = await Promise.all([
      fetch(`/api/discipline?tenantId=${tenant.id}`).then(r => r.json()),
      fetch(`/api/students?tenantId=${tenant.id}&take=200`).then(r => r.json()),
      fetch(`/api/gtk/staff?tenantId=${tenant.id}`).then(r => r.json()),
    ])
    setRecords(rec.records || [])
    setStudents(stu.students || [])
    setStaff(stf.staff || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [tenant?.id])

  const handleSave = async () => {
    if (!tenant || !form.studentId || !form.staffId || !form.description) return
    setSaving(true)
    try {
      const res = await fetch("/api/discipline", {
        method:"POST",
        headers: {"Content-Type":"application/json" },
        body: JSON.stringify({ tenantId: tenant.id, ...form, points: Number(form.points) }),
      })
      if (!res.ok) throw new Error()
      toast({ title:"Catatan berhasil disimpan" })
      setShowForm(false)
      setForm({ studentId:"", staffId:"", type:"PELANGGARAN", category:"KEDISIPLINAN", description:"", points:"5", date: new Date().toISOString().split("T")[0] })
      await load()
    } catch {
      toast({ title:"Gagal menyimpan catatan", variant:"destructive" })
    }
    setSaving(false)
  }

  const filtered = records.filter(r => {
    const matchSearch = !search || r.student.name.toLowerCase().includes(search.toLowerCase())
    const matchType = !filterType || filterType ==="all" || r.type === filterType
    return matchSearch && matchType
  })

  // Point tally per student
  const pointsByStudent: Record<string, number> = {}
  records.filter(r => r.type ==="PELANGGARAN").forEach(r => {
    pointsByStudent[r.studentId] = (pointsByStudent[r.studentId] || 0) + r.points
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Catatan Perilaku (BK)</h1>
          <p className="text-muted-foreground">Rekam pelanggaran dan penghargaan siswa</p>
        </div>
        <Button className="gap-2 btn-gradient flex items-center justify-center h-10 px-4" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" /> Tambah Catatan
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="glass border-0 border-l-4 border-l-primary">
          <CardHeader className="pb-3"><CardTitle className="text-base">Catatan Baru</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Jenis</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Siswa</Label>
                <Select value={form.studentId} onValueChange={v => setForm(f => ({ ...f, studentId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Pilih siswa" /></SelectTrigger>
                  <SelectContent>
                    {students.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Dicatat oleh</Label>
                <Select value={form.staffId} onValueChange={v => setForm(f => ({ ...f, staffId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Pilih guru/BK" /></SelectTrigger>
                  <SelectContent>
                    {staff.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Poin ({form.type ==="PELANGGARAN" ?"Penalti" :"Reward"})</Label>
                <Input type="number" min={0} max={100} value={form.points} onChange={e => setForm(f => ({ ...f, points: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Tanggal</Label>
                <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Deskripsi Kejadian <span className="text-destructive">*</span></Label>
              <Textarea placeholder="Ceritakan kejadian secara singkat..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="resize-none" />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving || !form.studentId || !form.staffId || !form.description} className="btn-gradient flex items-center justify-center h-10 px-4">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Simpan Catatan
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-10" placeholder="Cari siswa..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Semua Jenis" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            {TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Records */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="glass border-0">
          <CardContent className="p-12 text-center">
            <ShieldAlert className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Belum ada catatan perilaku</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((r: any) => {
            const isViolation = r.type ==="PELANGGARAN"
            const totalPoints = pointsByStudent[r.studentId] || 0
            return (
              <div key={r.id} className={cn("flex items-start gap-3 rounded-xl border px-4 py-3",
                isViolation ?"border-red-200 bg-red-500/5" :"border-emerald-200 bg-emerald-500/5")}>
                <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5",
                  isViolation ?"bg-red-500/10" :"bg-emerald-500/10")}>
                  {isViolation ? <AlertTriangle className="h-4 w-4 text-red-600" /> : <Star className="h-4 w-4 text-emerald-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold">{r.student.name}</p>
                    <Badge variant="outline" className={cn("text-[10px]", TYPES.find(t => t.value === r.type)?.color)}>
                      {r.type}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">{r.category}</Badge>
                    {isViolation && totalPoints > 50 && (
                      <Badge className="text-[10px] bg-red-500 text-white border-0">⚠ Poin Tinggi: {totalPoints}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {format(new Date(r.date),"d MMM yyyy", { locale: localeId })} · oleh {r.staff.name}
                  </p>
                </div>
                <div className={cn("text-sm font-bold shrink-0", isViolation ?"text-red-600" :"text-emerald-600")}>
                  {isViolation ?"-" :"+"}{r.points}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
