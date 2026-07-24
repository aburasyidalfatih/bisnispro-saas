"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit2, Trash2, Box, Loader2, Star, Quote } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ImageUploadDirect } from "@/components/ui/image-upload-direct"
import Image from "next/image"

export default function TestimonialPage() {
  const [testimonials, setTestimonials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ 
    name: "", role: "", company: "", testimonial: "", imageUrl: "", rating: 5 
  })
  const [saving, setSaving] = useState(false)

  const fetchTestimonials = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/website/testimonials")
      if (res.ok) {
        setTestimonials(await res.json())
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTestimonials()
  }, [])

  const handleSave = async () => {
    if (!form.name || !form.testimonial) {
      toast({ title: "Gagal", description: "Nama dan testimoni wajib diisi", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const url = editingId ? `/api/admin/website/testimonials/${editingId}` : "/api/admin/website/testimonials"
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })

      if (!res.ok) throw new Error((await res.json()).error)
      toast({ title: "Berhasil", description: "Testimoni disimpan" })
      setIsModalOpen(false)
      fetchTestimonials()
    } catch (e: any) {
      toast({ title: "Gagal", description: e.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/website/testimonials/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Gagal menghapus")
      toast({ title: "Berhasil", description: "Testimoni dihapus" })
      fetchTestimonials()
    } catch (e) {
      toast({ title: "Gagal", description: "Terjadi kesalahan", variant: "destructive" })
    }
  }

  const openForm = (item?: any) => {
    if (item) {
      setEditingId(item.id)
      setForm({ ...item })
    } else {
      setEditingId(null)
      setForm({ name: "", role: "", company: "", testimonial: "", imageUrl: "", rating: 5 })
    }
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Testimoni Klien</h1>
          <p className="text-muted-foreground mt-1">Kelola ulasan dan testimoni dari klien Anda.</p>
        </div>
        <Button onClick={() => openForm()} className="rounded-xl gap-2">
          <Plus className="h-4 w-4" /> Tambah Testimoni
        </Button>
      </div>

      <Card className="glass border-0">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
              Memuat data...
            </div>
          ) : testimonials.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-muted/50 mb-4">
                <Quote className="h-8 w-8 opacity-50" />
              </div>
              <p>Belum ada testimoni.</p>
              <Button variant="outline" className="mt-4 rounded-xl" onClick={() => openForm()}>Buat Sekarang</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {testimonials.map((item) => (
                <Card key={item.id} className="overflow-hidden group p-4 border relative">
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10 rounded-xl">
                    <Button size="sm" variant="secondary" onClick={() => openForm(item)}><Edit2 className="h-4 w-4" /></Button>
                    <ConfirmDialog
                      title="Hapus Testimoni?"
                      description="Yakin ingin menghapus ini?"
                      onConfirm={() => handleDelete(item.id)}
                      trigger={<Button size="sm" variant="destructive"><Trash2 className="h-4 w-4" /></Button>}
                    />
                  </div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 rounded-full overflow-hidden bg-muted relative shrink-0">
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold">
                          {item.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold leading-tight">{item.name}</h3>
                      <p className="text-xs text-muted-foreground">{item.role} {item.company && `di ${item.company}`}</p>
                    </div>
                  </div>
                  <div className="flex mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3 w-3 ${i < (item.rating || 5) ? "fill-yellow-500 text-yellow-500" : "text-muted"}`} />
                    ))}
                  </div>
                  <p className="text-sm italic text-muted-foreground">"{item.testimonial}"</p>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit Testimoni" : "Tambah Testimoni"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="flex gap-4">
              <div className="space-y-2 w-32 shrink-0">
                <Label>Foto Profil</Label>
                <div className="aspect-square">
                  <ImageUploadDirect 
                    tenantId="-" 
                    value={form.imageUrl} 
                    onChange={(url) => setForm(p => ({...p, imageUrl: url}))}
                    subDir="testimonials"
                  />
                </div>
              </div>
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nama Klien *</Label>
                    <Input value={form.name} onChange={(e) => setForm(p => ({...p, name: e.target.value}))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Rating (1-5)</Label>
                    <Input type="number" min={1} max={5} value={form.rating} onChange={(e) => setForm(p => ({...p, rating: parseInt(e.target.value)}))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Jabatan / Peran</Label>
                    <Input value={form.role} onChange={(e) => setForm(p => ({...p, role: e.target.value}))} placeholder="Mis: CEO" />
                  </div>
                  <div className="space-y-2">
                    <Label>Nama Perusahaan</Label>
                    <Input value={form.company} onChange={(e) => setForm(p => ({...p, company: e.target.value}))} />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Ulasan / Testimoni *</Label>
              <Textarea value={form.testimonial} onChange={(e) => setForm(p => ({...p, testimonial: e.target.value}))} rows={4} />
            </div>
            <div className="pt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
