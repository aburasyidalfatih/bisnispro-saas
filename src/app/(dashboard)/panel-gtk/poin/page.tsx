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
import { Users, ChevronLeft, Plus, Save, AlertTriangle, Trophy, Search, User } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function BukuPoinPage() {
  const { data: session } = useSession()
  const tenantId = session?.user?.tenants?.[0]?.id

  const [mode, setMode] = useState<"list" | "create">("list")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [metadata, setMetadata] = useState<any>(null)
  const [records, setRecords] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  // Form State
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    classroomId: "",
    studentId: "",
    type: "PELANGGARAN",
    category: "KEDISIPLINAN",
    points: "10",
    description: ""
  })

  useEffect(() => {
    if (!tenantId) return
    fetchMetadata()
  }, [tenantId])

  useEffect(() => {
    if (mode === "list" && metadata?.staffId) {
      fetchRecords()
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
        setMetadata(await res.json())
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const fetchRecords = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/gtk/discipline?tenantId=${tenantId}&staffId=${metadata?.staffId}`)
      if (res.ok) {
        setRecords(await res.json())
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
        setStudents(await res.json())
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleSubmit = async () => {
    if (!metadata?.staffId) return toast({ title: "Error", description: "Data staf tidak ditemukan", variant: "destructive" })
    if (!formData.studentId || !formData.description || !formData.points) {
      return toast({ title: "Validasi", description: "Siswa, Keterangan, dan Jumlah Poin wajib diisi", variant: "destructive" })
    }

    setSaving(true)
    try {
      const payload = {
        tenantId,
        staffId: metadata.staffId,
        ...formData
      }

      const res = await fetch("/api/gtk/discipline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        toast({ title: "Berhasil", description: "Catatan kedisiplinan tersimpan" })
        setMode("list")
        setFormData({ ...formData, studentId: "", description: "", points: "10" })
      } else {
        toast({ title: "Gagal", description: "Gagal menyimpan data", variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "Gagal", description: "Terjadi kesalahan sistem", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || (s.nisn && s.nisn.includes(searchQuery)))

  if (loading && !metadata) return <div className="skeleton h-96 rounded-3xl" />

  if (mode === "create") {
    return (
      <div className="space-y-6 max-w-4xl mx-auto pb-10 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" onClick={() => setMode("list")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              Buku Poin Baru
            </h1>
            <p className="text-muted-foreground text-sm">Catat pelanggaran atau prestasi siswa secara real-time.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="glass border-0 shadow-sm md:col-span-2">
             <CardHeader className="bg-muted/30 border-b border-border/50">
               <CardTitle className="text-lg flex items-center gap-2">
                 1. Pilih Siswa
               </CardTitle>
             </CardHeader>
             <CardContent className="p-6 grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Kelas</label>
                  <Select value={formData.classroomId} onValueChange={(val) => { setFormData({ ...formData, classroomId: val, studentId: "" }); setSearchQuery("") }}>
                    <SelectTrigger className="bg-muted/40">
                      <SelectValue placeholder="Pilih Kelas" />
                    </SelectTrigger>
                    <SelectContent>
                      {metadata?.classrooms.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2 relative">
                   <label className="text-sm font-semibold">Siswa</label>
                   {formData.classroomId ? (
                     <Select value={formData.studentId} onValueChange={(val) => setFormData({ ...formData, studentId: val })}>
                       <SelectTrigger className="bg-muted/40">
                         <SelectValue placeholder="Pilih Siswa" />
                       </SelectTrigger>
                       <SelectContent>
                          <div className="p-2">
                            <Input placeholder="Cari siswa..." className="h-8 mb-2" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                          </div>
                         {filteredStudents.map((s: any) => (
                           <SelectItem key={s.id} value={s.id}>{s.name} ({s.nisn || '-'})</SelectItem>
                         ))}
                         {filteredStudents.length === 0 && <div className="p-2 text-xs text-center text-muted-foreground">Tidak ditemukan</div>}
                       </SelectContent>
                     </Select>
                   ) : (
                     <div className="h-10 border rounded-md flex items-center px-3 bg-muted/20 text-muted-foreground text-sm">
                       Pilih kelas terlebih dahulu
                     </div>
                   )}
                </div>
             </CardContent>
          </Card>

          {formData.studentId && (
            <Card className="glass border-0 shadow-sm md:col-span-2 animate-in fade-in slide-in-from-top-4 duration-300">
               <CardHeader className="bg-muted/30 border-b border-border/50">
                 <CardTitle className="text-lg flex items-center gap-2">
                   2. Detail Catatan
                 </CardTitle>
               </CardHeader>
               <CardContent className="p-6 grid sm:grid-cols-2 gap-6">
                  
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-semibold mb-2 block">Jenis Catatan</label>
                    <div className="grid grid-cols-2 gap-4">
                       <button
                         onClick={() => setFormData({ ...formData, type: "PELANGGARAN" })}
                         className={cn(
                           "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 gap-2",
                           formData.type === "PELANGGARAN" ? "border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-400" : "border-transparent bg-muted/40 text-muted-foreground hover:bg-muted"
                         )}
                       >
                         <AlertTriangle className="h-8 w-8" />
                         <span className="font-bold">Pelanggaran</span>
                       </button>
                       <button
                         onClick={() => setFormData({ ...formData, type: "PENGHARGAAN" })}
                         className={cn(
                           "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 gap-2",
                           formData.type === "PENGHARGAAN" ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "border-transparent bg-muted/40 text-muted-foreground hover:bg-muted"
                         )}
                       >
                         <Trophy className="h-8 w-8" />
                         <span className="font-bold">Penghargaan / Prestasi</span>
                       </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Kategori</label>
                    <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                      <SelectTrigger className="bg-muted/40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KEDISIPLINAN">Kedisiplinan (Keterlambatan, Bolos)</SelectItem>
                        <SelectItem value="AKADEMIK">Akademik (Tugas, Partisipasi)</SelectItem>
                        <SelectItem value="ATRIBUT">Atribut & Seragam</SelectItem>
                        <SelectItem value="PERILAKU">Perilaku & Etika</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Jumlah Poin</label>
                    <Input type="number" min="1" max="100" value={formData.points} onChange={(e) => setFormData({ ...formData, points: e.target.value })} className="bg-muted/40" />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-semibold">Keterangan / Kronologi Singkat</label>
                    <Textarea 
                      placeholder={formData.type === "PELANGGARAN" ? "Contoh: Terlambat masuk kelas lebih dari 15 menit tanpa alasan jelas." : "Contoh: Aktif membantu teman menjelaskan materi matematika."}
                      value={formData.description} 
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                      className="bg-muted/40 min-h-[100px]" 
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-semibold">Tanggal Kejadian</label>
                    <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="bg-muted/40 w-full sm:w-1/2" />
                  </div>

               </CardContent>
            </Card>
          )}

          <div className="md:col-span-2 pt-4 flex justify-end gap-3 sticky bottom-0 bg-background/80 backdrop-blur-md p-4 border-t z-10 -mx-4 sm:mx-0 sm:rounded-2xl sm:border sm:static">
             <Button variant="outline" className="rounded-xl px-6" onClick={() => setMode("list")} disabled={saving}>Batal</Button>
             <Button className="rounded-xl px-8 shadow-md shadow-primary/20" onClick={handleSubmit} disabled={saving || !formData.studentId}>
               {saving ? <div className="animate-spin h-5 w-5 border-2 border-white/20 border-t-white rounded-full" /> : <><Save className="mr-2 h-4 w-4" /> Simpan Catatan</>}
             </Button>
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
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
             Buku Poin & Kedisiplinan
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Riwayat poin pelanggaran dan penghargaan siswa yang Anda laporkan.</p>
        </div>
        <Button className="rounded-xl w-full sm:w-auto shadow-md shadow-primary/20" onClick={() => setMode("create")}>
          <Plus className="mr-2 h-4 w-4" /> Catat Poin Baru
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 skeleton rounded-2xl" />)}
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-20 bg-muted/20 border border-dashed rounded-3xl">
          <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="font-semibold text-muted-foreground">Belum ada riwayat</h3>
          <p className="text-sm text-muted-foreground mt-1">Anda belum pernah mencatat poin pelanggaran atau prestasi.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {records.map(r => {
            const isViolation = r.type === "PELANGGARAN"
            return (
              <Card key={r.id} className="glass border-0 hover:border-border/50 transition-colors group">
                <CardContent className="p-5 flex flex-col sm:flex-row gap-4 sm:items-center">
                  
                  <div className={cn(
                    "flex flex-col items-center justify-center rounded-xl p-3 shrink-0 min-w-[80px]",
                    isViolation ? "bg-rose-500/10 text-rose-600" : "bg-emerald-500/10 text-emerald-600"
                  )}>
                    {isViolation ? <AlertTriangle className="h-6 w-6 mb-1" /> : <Trophy className="h-6 w-6 mb-1" />}
                    <span className="font-black leading-none">{r.points > 0 ? `+${r.points}` : r.points}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold bg-muted px-2 py-0.5 rounded text-foreground flex items-center gap-1">
                        <User className="h-3 w-3" /> {r.student?.name}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground">{r.student?.classroom?.name || ''}</span>
                    </div>
                    <h3 className="font-bold text-base leading-tight mt-2">{r.description}</h3>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                       <span className="uppercase">{r.category}</span>
                       <span className="opacity-50">•</span>
                       <span>{format(new Date(r.date), 'dd MMM yyyy', { locale: localeId })}</span>
                    </p>
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
