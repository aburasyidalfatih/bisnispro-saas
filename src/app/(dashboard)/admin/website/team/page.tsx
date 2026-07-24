"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit2, Trash2, Box, Loader2, Users, Link as LinkIcon } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ImageUploadDirect } from "@/components/ui/image-upload-direct"
import Image from "next/image"

export default function TeamPage() {
  const [team, setTeam] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ 
    name: "", role: "", bio: "", imageUrl: "", socialLinks: "", sortOrder: 0 
  })
  const [saving, setSaving] = useState(false)

  const fetchTeam = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/website/team")
      if (res.ok) {
        setTeam(await res.json())
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeam()
  }, [])

  const handleSave = async () => {
    if (!form.name || !form.role) {
      toast({ title: "Gagal", description: "Nama dan jabatan wajib diisi", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const url = editingId ? `/api/admin/website/team/${editingId}` : "/api/admin/website/team"
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })

      if (!res.ok) throw new Error((await res.json()).error)
      toast({ title: "Berhasil", description: "Anggota tim disimpan" })
      setIsModalOpen(false)
      fetchTeam()
    } catch (e: any) {
      toast({ title: "Gagal", description: e.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/website/team/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Gagal menghapus")
      toast({ title: "Berhasil", description: "Anggota tim dihapus" })
      fetchTeam()
    } catch (e) {
      toast({ title: "Gagal", description: "Terjadi kesalahan", variant: "destructive" })
    }
  }

  const openForm = (item?: any) => {
    if (item) {
      setEditingId(item.id)
      setForm({ 
        name: item.name, 
        role: item.role, 
        bio: item.bio || "", 
        imageUrl: item.imageUrl || "", 
        socialLinks: typeof item.socialLinks === 'string' ? item.socialLinks : JSON.stringify(item.socialLinks || {}),
        sortOrder: item.sortOrder 
      })
    } else {
      setEditingId(null)
      setForm({ name: "", role: "", bio: "", imageUrl: "", socialLinks: "", sortOrder: team.length })
    }
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tim Kami</h1>
          <p className="text-muted-foreground mt-1">Kelola profil anggota tim perusahaan Anda.</p>
        </div>
        <Button onClick={() => openForm()} className="rounded-xl gap-2">
          <Plus className="h-4 w-4" /> Tambah Anggota
        </Button>
      </div>

      <Card className="glass border-0">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
              Memuat data...
            </div>
          ) : team.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-muted/50 mb-4">
                <Users className="h-8 w-8 opacity-50" />
              </div>
              <p>Belum ada anggota tim.</p>
              <Button variant="outline" className="mt-4 rounded-xl" onClick={() => openForm()}>Buat Sekarang</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
              {team.map((item) => (
                <Card key={item.id} className="overflow-hidden group flex flex-col items-center text-center p-6 relative">
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 z-10">
                    <Button size="sm" variant="secondary" onClick={() => openForm(item)}><Edit2 className="h-4 w-4 mr-2" /> Edit</Button>
                    <ConfirmDialog
                      title="Hapus Anggota?"
                      description="Yakin ingin menghapus ini?"
                      onConfirm={() => handleDelete(item.id)}
                      trigger={<Button size="sm" variant="destructive"><Trash2 className="h-4 w-4 mr-2" /> Hapus</Button>}
                    />
                  </div>
                  
                  <div className="h-24 w-24 rounded-full overflow-hidden bg-muted mb-4 relative">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-2xl font-bold">
                        {item.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  
                  <h3 className="font-bold text-lg leading-tight">{item.name}</h3>
                  <p className="text-sm font-medium text-primary mt-1">{item.role}</p>
                  {item.bio && <p className="text-xs text-muted-foreground mt-3 line-clamp-3">{item.bio}</p>}
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit Anggota Tim" : "Tambah Anggota Tim"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="flex flex-col items-center space-y-2 mb-2">
              <Label>Foto Profil</Label>
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-muted">
                <ImageUploadDirect 
                  tenantId="-" 
                  value={form.imageUrl} 
                  onChange={(url) => setForm(p => ({...p, imageUrl: url}))}
                  subDir="team"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nama Lengkap *</Label>
                <Input value={form.name} onChange={(e) => setForm(p => ({...p, name: e.target.value}))} />
              </div>
              <div className="space-y-2">
                <Label>Jabatan *</Label>
                <Input value={form.role} onChange={(e) => setForm(p => ({...p, role: e.target.value}))} placeholder="Mis: CEO, Designer" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Biodata Singkat</Label>
              <Textarea value={form.bio} onChange={(e) => setForm(p => ({...p, bio: e.target.value}))} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Social Links (Opsional)</Label>
              <div className="flex gap-2 items-center">
                <LinkIcon className="h-4 w-4 text-muted-foreground absolute ml-3" />
                <Input className="pl-9" placeholder="https://linkedin.com/in/..." value={form.socialLinks} onChange={(e) => setForm(p => ({...p, socialLinks: e.target.value}))} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Masukkan URL LinkedIn atau profil sosial media lainnya.</p>
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
