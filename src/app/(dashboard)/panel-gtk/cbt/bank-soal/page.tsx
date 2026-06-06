"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Plus, BookOpen, Layers, Settings, FileText } from "lucide-react"
import Link from "next/link"

export default function BankSoalPage() {
  const { toast } = useToast()
  const [banks, setBanks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({ name: "", subject: "", level: "", description: "" })

  const fetchBanks = async () => {
    try {
      const res = await fetch("/api/cbt/bank-soal")
      const data = await res.json()
      if (res.ok) setBanks(data)
    } catch (error) {
      toast({ title: "Gagal memuat bank soal", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBanks()
  }, [])

  const handleSubmit = async () => {
    if (!formData.name) return toast({ title: "Nama bank soal wajib diisi", variant: "destructive" })
    
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/cbt/bank-soal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })
      if (!res.ok) throw new Error("Gagal membuat bank soal")
      
      toast({ title: "Bank Soal Berhasil Dibuat!" })
      setIsDialogOpen(false)
      setFormData({ name: "", subject: "", level: "", description: "" })
      fetchBanks()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bank Soal CBT</h1>
          <p className="text-muted-foreground">Kelola kumpulan soal ujian untuk siswa secara tersentralisasi.</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="rounded-xl shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4 mr-2" /> Buat Bank Soal Baru
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : banks.length === 0 ? (
        <Card className="glass border-dashed">
          <CardContent className="py-20 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
              <Layers className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Belum Ada Bank Soal</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">Anda belum membuat bank soal apapun. Buat sekarang untuk mulai menyusun soal ujian.</p>
            <Button onClick={() => setIsDialogOpen(true)} variant="outline" className="rounded-xl">Mulai Buat Bank Soal</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banks.map((bank) => (
            <Card key={bank.id} className="glass group hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                    <FileText className="w-3 h-3" /> {bank._count.questions} Soal
                  </div>
                </div>
                
                <h3 className="font-bold text-lg mb-1 line-clamp-1" title={bank.name}>{bank.name}</h3>
                <div className="flex gap-2 mb-4">
                  {bank.subject && <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{bank.subject}</span>}
                  {bank.level && <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{bank.level}</span>}
                </div>
                
                <p className="text-sm text-muted-foreground line-clamp-2 h-10 mb-6">
                  {bank.description || "Tidak ada deskripsi."}
                </p>

                <div className="flex gap-2">
                  <Link href={`/panel-gtk/cbt/bank-soal/${bank.id}`} className="flex-1">
                    <Button variant="outline" className="w-full rounded-xl group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      Kelola Soal
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" className="rounded-xl shrink-0">
                    <Settings className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog Buat Bank Soal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] max-w-full">
          <DialogHeader>
            <DialogTitle>Buat Bank Soal Baru</DialogTitle>
            <div id="dialog-description" className="text-sm text-muted-foreground">
              Masukkan detail bank soal yang akan dibuat.
            </div>
          </DialogHeader>
          <div className="space-y-4 py-4" aria-describedby="dialog-description">
            <div className="space-y-2">
              <Label>Nama Bank Soal <span className="text-red-500">*</span></Label>
              <Input placeholder="Contoh: UTS Matematika Gasal 2024" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mata Pelajaran</Label>
                <Input placeholder="Contoh: Matematika" value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Tingkat / Kelas</Label>
                <Input placeholder="Contoh: Kelas 10" value={formData.level} onChange={(e) => setFormData({...formData, level: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Deskripsi (Opsional)</Label>
              <Input placeholder="Catatan internal guru..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || !formData.name}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
