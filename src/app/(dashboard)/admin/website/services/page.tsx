"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit2, Trash2, Box, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ImageUploadDirect } from "@/components/ui/image-upload-direct"
import Image from "next/image"

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ 
    name: "", slug: "", description: "", imageUrl: "", 
    category: "", pricing: "", icon: "", sortOrder: 0 
  })
  const [saving, setSaving] = useState(false)

  const fetchServices = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/website/services")
      if (res.ok) {
        setServices(await res.json())
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServices()
  }, [])

  const handleNameChange = (val: string) => {
    const slug = val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")
    setForm(prev => ({ ...prev, name: val, slug }))
  }

  const handleSave = async () => {
    if (!form.name || !form.slug) {
      toast({ title: "Gagal", description: "Nama layanan wajib diisi", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const url = editingId ? `/api/admin/website/services/${editingId}` : "/api/admin/website/services"
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })

      if (!res.ok) throw new Error((await res.json()).error)
      toast({ title: "Berhasil", description: "Layanan disimpan" })
      setIsModalOpen(false)
      fetchServices()
    } catch (e: any) {
      toast({ title: "Gagal", description: e.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/website/services/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Gagal menghapus")
      toast({ title: "Berhasil", description: "Layanan dihapus" })
      fetchServices()
    } catch (e) {
      toast({ title: "Gagal", description: "Terjadi kesalahan", variant: "destructive" })
    }
  }

  const openForm = (srv?: any) => {
    if (srv) {
      setEditingId(srv.id)
      setForm({ ...srv })
    } else {
      setEditingId(null)
      setForm({ name: "", slug: "", description: "", imageUrl: "", category: "", pricing: "", icon: "", sortOrder: services.length })
    }
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Layanan / Produk</h1>
          <p className="text-muted-foreground mt-1">Kelola daftar layanan atau produk bisnis Anda.</p>
        </div>
        <Button onClick={() => openForm()} className="rounded-xl gap-2">
          <Plus className="h-4 w-4" /> Tambah Layanan
        </Button>
      </div>

      <Card className="glass border-0">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
              Memuat data...
            </div>
          ) : services.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-muted/50 mb-4">
                <Box className="h-8 w-8 opacity-50" />
              </div>
              <p>Belum ada layanan yang ditambahkan.</p>
              <Button variant="outline" className="mt-4 rounded-xl" onClick={() => openForm()}>Tambah Sekarang</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {services.map((srv) => (
                <Card key={srv.id} className="overflow-hidden group">
                  <div className="relative h-40 bg-muted">
                    {srv.imageUrl ? (
                      <Image src={srv.imageUrl} alt={srv.name} fill className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                        <Box className="h-8 w-8 opacity-20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button size="sm" variant="secondary" onClick={() => openForm(srv)}><Edit2 className="h-4 w-4" /></Button>
                      <ConfirmDialog
                        title="Hapus Layanan?"
                        description="Yakin ingin menghapus ini?"
                        onConfirm={() => handleDelete(srv.id)}
                        trigger={<Button size="sm" variant="destructive"><Trash2 className="h-4 w-4" /></Button>}
                      />
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg leading-tight">{srv.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{srv.description}</p>
                    {srv.pricing && <p className="text-sm font-semibold text-primary mt-2">{srv.pricing}</p>}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit Layanan" : "Tambah Layanan"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Gambar Layanan</Label>
              <ImageUploadDirect 
                tenantId="-" 
                value={form.imageUrl} 
                onChange={(url) => setForm(p => ({...p, imageUrl: url}))}
                subDir="services"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nama Layanan *</Label>
                <Input value={form.name} onChange={(e) => handleNameChange(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Harga (Opsional)</Label>
                <Input value={form.pricing} onChange={(e) => setForm(p => ({...p, pricing: e.target.value}))} placeholder="Mulai dari Rp 500.000" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
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
