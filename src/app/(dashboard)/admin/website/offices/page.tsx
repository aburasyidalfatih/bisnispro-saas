"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Plus, Edit2, Trash2, Box, Loader2, MapPin, Phone, Mail, Building2, Map } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ImageUploadDirect } from "@/components/ui/image-upload-direct"
import Image from "next/image"

export default function OfficesPage() {
  const [offices, setOffices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ 
    name: "", slug: "", address: "", city: "", phone: "", email: "", mapUrl: "", imageUrl: "", isHeadquarter: false, sortOrder: 0 
  })
  const [saving, setSaving] = useState(false)

  const fetchOffices = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/website/offices")
      if (res.ok) {
        setOffices(await res.json())
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOffices()
  }, [])

  const handleNameChange = (val: string) => {
    const slug = val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")
    setForm(prev => ({ ...prev, name: val, slug }))
  }

  const handleSave = async () => {
    if (!form.name || !form.slug) {
      toast({ title: "Gagal", description: "Nama cabang dan slug wajib diisi", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const url = editingId ? `/api/admin/website/offices/${editingId}` : "/api/admin/website/offices"
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })

      if (!res.ok) throw new Error((await res.json()).error)
      toast({ title: "Berhasil", description: "Kantor cabang disimpan" })
      setIsModalOpen(false)
      fetchOffices()
    } catch (e: any) {
      toast({ title: "Gagal", description: e.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/website/offices/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Gagal menghapus")
      toast({ title: "Berhasil", description: "Kantor cabang dihapus" })
      fetchOffices()
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
      setForm({ name: "", slug: "", address: "", city: "", phone: "", email: "", mapUrl: "", imageUrl: "", isHeadquarter: false, sortOrder: offices.length })
    }
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kantor Cabang</h1>
          <p className="text-muted-foreground mt-1">Kelola lokasi kantor, cabang, atau toko Anda.</p>
        </div>
        <Button onClick={() => openForm()} className="rounded-xl gap-2">
          <Plus className="h-4 w-4" /> Tambah Cabang
        </Button>
      </div>

      <Card className="glass border-0">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
              Memuat data...
            </div>
          ) : offices.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-muted/50 mb-4">
                <Building2 className="h-8 w-8 opacity-50" />
              </div>
              <p>Belum ada data kantor cabang.</p>
              <Button variant="outline" className="mt-4 rounded-xl" onClick={() => openForm()}>Buat Sekarang</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              {offices.map((item) => (
                <Card key={item.id} className="overflow-hidden group flex flex-col relative">
                  <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <Button size="sm" variant="secondary" className="h-8 w-8 p-0" onClick={() => openForm(item)}><Edit2 className="h-4 w-4" /></Button>
                    <ConfirmDialog
                      title="Hapus Cabang?"
                      description="Yakin ingin menghapus ini?"
                      onConfirm={() => handleDelete(item.id)}
                      trigger={<Button size="sm" variant="destructive" className="h-8 w-8 p-0"><Trash2 className="h-4 w-4" /></Button>}
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row h-full">
                    <div className="w-full sm:w-2/5 h-48 sm:h-auto relative bg-muted shrink-0">
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/5 text-muted-foreground">
                          <Building2 className="h-8 w-8 opacity-20" />
                        </div>
                      )}
                      {item.isHeadquarter && (
                        <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                          KANTOR PUSAT
                        </div>
                      )}
                    </div>
                    
                    <div className="p-5 flex-1 flex flex-col justify-center">
                      <h3 className="font-bold text-lg leading-tight mb-1">{item.name}</h3>
                      {item.city && <p className="text-sm font-medium text-primary mb-3">{item.city}</p>}
                      
                      <div className="space-y-2 mt-2">
                        {item.address && (
                          <div className="flex items-start gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                            <span className="line-clamp-2 leading-snug">{item.address}</span>
                          </div>
                        )}
                        {item.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4 shrink-0" />
                            <span>{item.phone}</span>
                          </div>
                        )}
                        {item.email && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-4 w-4 shrink-0" />
                            <span className="truncate">{item.email}</span>
                          </div>
                        )}
                      </div>
                      
                      {item.mapUrl && (
                        <div className="mt-4 pt-4 border-t">
                          <a href={item.mapUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline">
                            <Map className="h-3 w-3" /> Lihat di Google Maps
                          </a>
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
          <DialogHeader><DialogTitle>{editingId ? "Edit Cabang" : "Tambah Cabang"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Foto Gedung / Kantor</Label>
              <ImageUploadDirect 
                tenantId="-" 
                value={form.imageUrl} 
                onChange={(url) => setForm(p => ({...p, imageUrl: url}))}
                subDir="offices"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nama Cabang *</Label>
                <Input value={form.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Mis: Kantor Pusat Jakarta" />
              </div>
              <div className="space-y-2">
                <Label>Kota</Label>
                <Input value={form.city} onChange={(e) => setForm(p => ({...p, city: e.target.value}))} placeholder="Mis: Jakarta Selatan" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Alamat Lengkap</Label>
              <Textarea value={form.address} onChange={(e) => setForm(p => ({...p, address: e.target.value}))} rows={2} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nomor Telepon</Label>
                <Input value={form.phone} onChange={(e) => setForm(p => ({...p, phone: e.target.value}))} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm(p => ({...p, email: e.target.value}))} />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Link Google Maps</Label>
              <Input value={form.mapUrl} onChange={(e) => setForm(p => ({...p, mapUrl: e.target.value}))} placeholder="https://goo.gl/maps/..." />
            </div>
            
            <div className="flex items-center space-x-2 border rounded-xl p-4">
              <Switch checked={form.isHeadquarter} onCheckedChange={(c) => setForm(p => ({...p, isHeadquarter: c}))} id="hq" />
              <Label htmlFor="hq" className="flex-1 cursor-pointer">Jadikan sebagai Kantor Pusat</Label>
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
