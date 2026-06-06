"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Plus, Calendar, Clock, Lock, RefreshCw, Trash2, CheckCircle2, PlayCircle, EyeOff, Users } from "lucide-react"
import Link from "next/link"

export default function JadwalUjianPage() {
  const { toast } = useToast()
  const [exams, setExams] = useState<any[]>([])
  const [banks, setBanks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    title: "",
    questionBankId: "",
    startTime: "",
    endTime: "",
    duration: "90",
    status: "DRAFT"
  })

  const fetchData = async () => {
    try {
      const [resExams, resBanks] = await Promise.all([
        fetch("/api/cbt/jadwal"),
        fetch("/api/cbt/bank-soal")
      ])
      
      if (resExams.ok) setExams(await resExams.json())
      if (resBanks.ok) setBanks(await resBanks.json())
    } catch (error) {
      toast({ title: "Gagal memuat data", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubmit = async () => {
    if (!formData.title || !formData.questionBankId || !formData.startTime || !formData.endTime) {
      return toast({ title: "Harap isi semua kolom wajib", variant: "destructive" })
    }
    
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/cbt/jadwal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal membuat jadwal")
      
      toast({ title: "Jadwal Ujian Berhasil Dibuat!" })
      setIsDialogOpen(false)
      setFormData({ title: "", questionBankId: "", startTime: "", endTime: "", duration: "90", status: "DRAFT" })
      fetchData()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRegeneratePin = async (id: string) => {
    try {
      const res = await fetch(`/api/cbt/jadwal/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REGENERATE_PIN" })
      })
      if (!res.ok) throw new Error("Gagal generate PIN baru")
      toast({ title: "PIN Ujian Berhasil Diperbarui" })
      fetchData()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "PUBLISHED" ? "DRAFT" : "PUBLISHED"
    try {
      const res = await fetch(`/api/cbt/jadwal/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      })
      if (!res.ok) throw new Error("Gagal mengubah status")
      toast({ title: `Ujian ${newStatus === 'PUBLISHED' ? 'Diterbitkan' : 'Disembunyikan'}` })
      fetchData()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus jadwal ujian ini? Data siswa yang sudah ujian akan ikut terhapus!")) return
    try {
      const res = await fetch(`/api/cbt/jadwal/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Gagal menghapus")
      toast({ title: "Jadwal dihapus" })
      fetchData()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Jadwal & PIN Ujian</h1>
          <p className="text-muted-foreground">Aktifkan ujian, dapatkan PIN, dan pantau sesi siswa secara langsung.</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="rounded-xl shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4 mr-2" /> Buat Jadwal Ujian
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : exams.length === 0 ? (
        <Card className="glass border-dashed">
          <CardContent className="py-20 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Belum Ada Jadwal Ujian</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">Pilih bank soal Anda dan jadwalkan ujian untuk mendapatkan PIN akses siswa.</p>
            <Button onClick={() => setIsDialogOpen(true)} variant="outline" className="rounded-xl">Jadwalkan Sekarang</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {exams.map((exam) => (
            <Card key={exam.id} className={`glass overflow-hidden border-2 transition-all ${exam.status === 'PUBLISHED' ? 'border-primary/50 shadow-md shadow-primary/5' : 'border-border opacity-80'}`}>
              <div className={`h-1.5 w-full ${exam.status === 'PUBLISHED' ? 'bg-primary' : 'bg-slate-200'}`} />
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-xl line-clamp-1 flex-1 pr-4">{exam.title}</h3>
                  <div className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${exam.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {exam.status}
                  </div>
                </div>
                
                <p className="text-sm font-medium text-muted-foreground mb-6 flex items-center gap-1.5">
                  <span className="text-primary">{exam.questionBank?.name}</span>
                  <span className="w-1 h-1 bg-slate-300 rounded-full" />
                  {exam.questionBank?._count?.questions} Soal
                </p>

                <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Waktu Mulai</p>
                      <p className="text-xs font-semibold text-slate-700">{new Date(exam.startTime).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Durasi</p>
                      <p className="text-xs font-semibold text-slate-700">{exam.duration} Menit</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* PIN Display */}
                  <div className="flex-1 bg-slate-900 rounded-xl p-3 flex items-center justify-between border border-slate-800 w-full">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PIN UJIAN:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-black text-xl tracking-[0.2em] ${exam.status === 'PUBLISHED' ? 'text-cyan-400' : 'text-slate-600'}`}>
                        {exam.pin || "------"}
                      </span>
                      {exam.status === 'PUBLISHED' && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white" onClick={() => handleRegeneratePin(exam.id)} title="Reset PIN">
                          <RefreshCw className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button variant="secondary" className="rounded-xl shadow-sm" asChild>
                      <Link href={`/panel-gtk/cbt/jadwal/${exam.id}`}>
                        <Users className="w-4 h-4 mr-2" /> Hasil
                      </Link>
                    </Button>
                    <Button 
                      variant={exam.status === 'PUBLISHED' ? "outline" : "default"} 
                      className={`flex-1 sm:flex-none rounded-xl ${exam.status === 'PUBLISHED' ? 'border-amber-200 text-amber-700 hover:bg-amber-50' : 'shadow-lg shadow-primary/20'}`}
                      onClick={() => handleToggleStatus(exam.id, exam.status)}
                    >
                      {exam.status === 'PUBLISHED' ? <EyeOff className="w-4 h-4 mr-2" /> : <PlayCircle className="w-4 h-4 mr-2" />}
                      {exam.status === 'PUBLISHED' ? "Tutup Ujian" : "Terbitkan"}
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-xl text-red-500 hover:bg-red-50 shrink-0" onClick={() => handleDelete(exam.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog Add Jadwal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-w-full">
          <DialogHeader>
            <DialogTitle>Buat Jadwal Ujian CBT</DialogTitle>
            <DialogDescription>Pilih bank soal dan tentukan waktu ujian agar siswa bisa mendapatkan akses masuk.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Pilih Bank Soal <span className="text-red-500">*</span></Label>
              <Select value={formData.questionBankId} onValueChange={(val) => setFormData({...formData, questionBankId: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="-- Pilih Bank Soal --" />
                </SelectTrigger>
                <SelectContent>
                  {banks.length === 0 ? (
                     <SelectItem value="none" disabled>Tidak ada bank soal, buat dulu!</SelectItem>
                  ) : (
                    banks.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.name} ({b._count.questions} Soal)</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Nama / Judul Ujian (Tampil ke Siswa) <span className="text-red-500">*</span></Label>
              <Input placeholder="Contoh: Ujian Tengah Semester PAI" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Waktu Mulai <span className="text-red-500">*</span></Label>
                <Input type="datetime-local" value={formData.startTime} onChange={(e) => setFormData({...formData, startTime: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Batas Akhir (Ditutup) <span className="text-red-500">*</span></Label>
                <Input type="datetime-local" value={formData.endTime} onChange={(e) => setFormData({...formData, endTime: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Durasi Pengerjaan (Menit) <span className="text-red-500">*</span></Label>
                <Input type="number" min="1" value={formData.duration} onChange={(e) => setFormData({...formData, duration: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Status Awal</Label>
                <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft (Disembunyikan)</SelectItem>
                    <SelectItem value="PUBLISHED">Published (Terbitkan Sekarang)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || !formData.title || !formData.questionBankId}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Simpan Jadwal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
