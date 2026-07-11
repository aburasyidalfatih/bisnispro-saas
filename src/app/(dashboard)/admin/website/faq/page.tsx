"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit2, Trash2, HelpCircle, Loader2, Save, X } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"

export default function FaqPage() {
  const [faqs, setFaqs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ question: "", answer: "", isActive: true, sortOrder: 0 })
  const [saving, setSaving] = useState(false)

  const fetchFaqs = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/website/faq")
      if (res.ok) {
        setFaqs(await res.json())
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFaqs()
  }, [])

  const handleSave = async () => {
    if (!form.question || !form.answer) {
      toast({ title: "Gagal", description: "Pertanyaan dan Jawaban wajib diisi", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      const url = editingId ? `/api/admin/website/faq/${editingId}` : "/api/admin/website/faq"
      const method = editingId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Gagal menyimpan FAQ")
      }

      toast({ title: "Berhasil", description: "FAQ berhasil disimpan" })
      setIsModalOpen(false)
      fetchFaqs()
    } catch (e: any) {
      toast({ title: "Gagal", description: e.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/website/faq/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Gagal menghapus")
      toast({ title: "Berhasil", description: "FAQ dihapus" })
      fetchFaqs()
    } catch (e) {
      toast({ title: "Gagal", description: "Terjadi kesalahan", variant: "destructive" })
    }
  }

  const openForm = (faq?: any) => {
    if (faq) {
      setEditingId(faq.id)
      setForm({ question: faq.question, answer: faq.answer, isActive: faq.isActive, sortOrder: faq.sortOrder })
    } else {
      setEditingId(null)
      setForm({ question: "", answer: "", isActive: true, sortOrder: faqs.length })
    }
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tanya Jawab (FAQ)</h1>
          <p className="text-muted-foreground mt-1">Kelola pertanyaan umum yang sering ditanyakan di website publik.</p>
        </div>
        <Button onClick={() => openForm()} className="rounded-xl gap-2">
          <Plus className="h-4 w-4" /> Tambah FAQ
        </Button>
      </div>

      <Card className="glass border-0">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
              Memuat data...
            </div>
          ) : faqs.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-muted/50 mb-4">
                <HelpCircle className="h-8 w-8 opacity-50" />
              </div>
              <p>Belum ada daftar tanya jawab.</p>
              <Button variant="outline" className="mt-4 rounded-xl" onClick={() => openForm()}>Buat Sekarang</Button>
            </div>
          ) : (
            <div className="divide-y">
              {faqs.map((faq) => (
                <div key={faq.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0 mt-1">
                      <span className="font-bold text-primary">Q</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-base">{faq.question}</h3>
                      <p className="text-muted-foreground text-sm mt-1 whitespace-pre-wrap">{faq.answer}</p>
                      <div className="mt-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${faq.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                          {faq.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => openForm(faq)} className="rounded-lg h-9">
                      <Edit2 className="h-4 w-4 mr-1.5" /> Edit
                    </Button>
                    <ConfirmDialog
                      title="Hapus FAQ?"
                      description={`Yakin ingin menghapus pertanyaan "${faq.question}"?`}
                      onConfirm={() => handleDelete(faq.id)}
                      trigger={
                        <Button variant="destructive" size="icon" className="rounded-lg h-9 w-9">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit FAQ" : "Tambah FAQ Baru"}</DialogTitle>
            <DialogDescription>
              Tambahkan pertanyaan dan jawaban untuk website.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Pertanyaan</Label>
              <Input 
                value={form.question} 
                onChange={e => setForm(p => ({ ...p, question: e.target.value }))} 
                placeholder="Contoh: Kapan pendaftaran ditutup?" 
              />
            </div>
            <div className="space-y-2">
              <Label>Jawaban</Label>
              <Textarea 
                value={form.answer} 
                onChange={e => setForm(p => ({ ...p, answer: e.target.value }))} 
                placeholder="Tuliskan jawaban yang informatif..."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Urutan</Label>
                <Input 
                  type="number"
                  value={form.sortOrder} 
                  onChange={e => setForm(p => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))} 
                />
              </div>
            </div>
            <div className="flex items-center space-x-2 pt-2 border-t">
              <Switch 
                id="active" 
                checked={form.isActive} 
                onCheckedChange={c => setForm(p => ({ ...p, isActive: c }))} 
              />
              <Label htmlFor="active">Tampilkan di website publik</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
