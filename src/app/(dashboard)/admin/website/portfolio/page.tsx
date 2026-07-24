"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit2, Trash2, Box, Loader2, Link as LinkIcon, Calendar } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ImageUploadDirect } from "@/components/ui/image-upload-direct"
import Image from "next/image"
import { format, parseISO } from "date-fns"
import { id } from "date-fns/locale"

export default function PortfolioPage() {
  const [portfolios, setPortfolios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ 
    title: "", slug: "", description: "", imageUrl: "", 
    category: "", clientName: "", projectUrl: "", completedAt: new Date().toISOString().substring(0,10), sortOrder: 0 
  })
  const [saving, setSaving] = useState(false)

  const fetchPortfolios = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/website/portfolio")
      if (res.ok) {
        setPortfolios(await res.json())
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPortfolios()
  }, [])

  const handleTitleChange = (val: string) => {
    const slug = val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")
    setForm(prev => ({ ...prev, title: val, slug }))
  }

  const handleSave = async () => {
    if (!form.title || !form.slug || !form.completedAt) {
      toast({ title: "Gagal", description: "Judul dan tanggal selesai wajib diisi", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const url = editingId ? `/api/admin/website/portfolio/${editingId}` : "/api/admin/website/portfolio"
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })

      if (!res.ok) throw new Error((await res.json()).error)
      toast({ title: "Berhasil", description: "Portofolio disimpan" })
      setIsModalOpen(false)
      fetchPortfolios()
    } catch (e: any) {
      toast({ title: "Gagal", description: e.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/website/portfolio/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Gagal menghapus")
      toast({ title: "Berhasil", description: "Portofolio dihapus" })
      fetchPortfolios()
    } catch (e) {
      toast({ title: "Gagal", description: "Terjadi kesalahan", variant: "destructive" })
    }
  }

  const openForm = (item?: any) => {
    if (item) {
      setEditingId(item.id)
      setForm({ 
        ...item, 
        completedAt: item.completedAt ? new Date(item.completedAt).toISOString().substring(0,10) : new Date().toISOString().substring(0,10)
      })
    } else {
      setEditingId(null)
      setForm({ 
        title: "", slug: "", description: "", imageUrl: "", 
        category: "", clientName: "", projectUrl: "", completedAt: new Date().toISOString().substring(0,10), sortOrder: portfolios.length 
      })
    }
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Portofolio</h1>
          <p className="text-muted-foreground mt-1">Tampilkan karya terbaik dan proyek klien Anda.</p>
        </div>
        <Button onClick={() => openForm()} className="rounded-xl gap-2">
          <Plus className="h-4 w-4" /> Tambah Portofolio
        </Button>
      </div>

      <Card className="glass border-0">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
              Memuat data...
            </div>
          ) : portfolios.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-muted/50 mb-4">
                <Box className="h-8 w-8 opacity-50" />
              </div>
              <p>Belum ada portofolio.</p>
              <Button variant="outline" className="mt-4 rounded-xl" onClick={() => openForm()}>Buat Sekarang</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {portfolios.map((item) => (
                <Card key={item.id} className="overflow-hidden group">
                  <div className="relative h-48 bg-muted">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.title} fill className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                        <Box className="h-8 w-8 opacity-20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button size="sm" variant="secondary" onClick={() => openForm(item)}><Edit2 className="h-4 w-4" /></Button>
                      <ConfirmDialog
                        title="Hapus Portofolio?"
                        description="Yakin ingin menghapus ini?"
                        onConfirm={() => handleDelete(item.id)}
                        trigger={<Button size="sm" variant="destructive"><Trash2 className="h-4 w-4" /></Button>}
                      />
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg leading-tight truncate mr-2">{item.title}</h3>
                      {item.category && <span className="text-[10px] uppercase font-bold tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">{item.category}</span>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                    <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                      {item.clientName && (
                        <div className="flex items-center gap-1">
                          <Box className="h-3 w-3" /> {item.clientName}
                        </div>
                      )}
                      {item.completedAt && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {format(new Date(item.completedAt), "MMM yyyy", { locale: id })}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit Portofolio" : "Tambah Portofolio"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Gambar Cover</Label>
              <ImageUploadDirect 
                tenantId="-" 
                value={form.imageUrl} 
                onChange={(url) => setForm(p => ({...p, imageUrl: url}))}
                subDir="portfolio"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Judul Proyek *</Label>
                <Input value={form.title} onChange={(e) => handleTitleChange(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Input value={form.category} onChange={(e) => setForm(p => ({...p, category: e.target.value}))} placeholder="Mis: Website, Branding" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nama Klien</Label>
                <Input value={form.clientName} onChange={(e) => setForm(p => ({...p, clientName: e.target.value}))} />
              </div>
              <div className="space-y-2">
                <Label>Tanggal Selesai *</Label>
                <Input type="date" value={form.completedAt} onChange={(e) => setForm(p => ({...p, completedAt: e.target.value}))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>URL Proyek / Referensi</Label>
              <div className="flex gap-2 items-center">
                <LinkIcon className="h-4 w-4 text-muted-foreground absolute ml-3" />
                <Input className="pl-9" placeholder="https://" value={form.projectUrl} onChange={(e) => setForm(p => ({...p, projectUrl: e.target.value}))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Deskripsi Lengkap</Label>
              <Textarea value={form.description} onChange={(e) => setForm(p => ({...p, description: e.target.value}))} rows={4} />
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
