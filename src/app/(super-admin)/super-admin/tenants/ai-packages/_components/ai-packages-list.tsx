"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/hooks/use-toast"
import { Zap, Edit, Save, Plus, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"

export interface AiTokenPackage {
  id: string
  name: string
  description: string | null
  price: number
  tokens: number
  isActive: boolean
  sortOrder: number
}

export function AiPackagesList() {
  const [loading, setLoading] = useState(true)
  const [packages, setPackages] = useState<AiTokenPackage[]>([])
  const [editingPackage, setEditingPackage] = useState<Partial<AiTokenPackage> | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/super-admin/ai-packages")
      const data = await res.json()
      setPackages(data)
    } catch {
      toast({ title: "Error", description: "Gagal memuat data paket AI.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { 
    fetchAll()
  }, [])

  const openEdit = (pkg: AiTokenPackage) => {
    setEditingPackage(pkg)
    setIsDialogOpen(true)
  }

  const openCreate = () => {
    setEditingPackage({
      name: "Starter AI",
      description: "Paket pemula untuk pembuatan soal dan konten.",
      price: 25000,
      tokens: 2500,
      isActive: true,
      sortOrder: 1,
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!editingPackage?.name?.trim() || !editingPackage.tokens) {
      toast({ title: "Validasi", description: "Nama paket dan jumlah token wajib diisi.", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      const method = editingPackage.id ? "PUT" : "POST"
      const res = await fetch("/api/super-admin/ai-packages", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingPackage),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Gagal menyimpan paket")
      }

      toast({ title: "Berhasil", description: "Paket AI berhasil disimpan." })
      setIsDialogOpen(false)
      fetchAll()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus paket ini?")) return
    
    try {
      const res = await fetch(`/api/super-admin/ai-packages?id=${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Gagal menghapus")
      toast({ title: "Berhasil", description: "Paket AI berhasil dihapus." })
      fetchAll()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  const handleToggleActive = async (pkg: AiTokenPackage) => {
    try {
      const res = await fetch(`/api/super-admin/ai-packages`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...pkg, isActive: !pkg.isActive }),
      })
      if (!res.ok) throw new Error("Gagal mengubah status")
      toast({ title: "Berhasil", description: `Status paket diperbarui.` })
      fetchAll()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  if (loading && packages.length === 0) {
    return <div className="space-y-4">{[1, 2].map(i => <div key={i} className="skeleton h-40 rounded-2xl" />)}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <p className="text-muted-foreground text-sm">
          Kelola paket *Top-Up* Token AI yang bisa dibeli oleh sekolah secara terpisah.
        </p>
        <Button onClick={openCreate} className="btn-gradient text-white border-0 rounded-xl gap-2 h-10 shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4" /> Tambah Paket
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {packages.map((pkg) => (
          <Card key={pkg.id} className="glass border-0 overflow-hidden relative">
            <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500" />
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle>{pkg.name}</CardTitle>
                      {!pkg.isActive && <Badge variant="outline" className="text-[10px] h-5 text-muted-foreground">Nonaktif</Badge>}
                    </div>
                    <CardDescription>{pkg.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={pkg.isActive}
                    onCheckedChange={() => handleToggleActive(pkg)}
                    className="scale-90"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold text-primary">
                Rp {pkg.price.toLocaleString("id-ID")}
              </div>
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 flex justify-between items-center">
                <span className="text-sm font-semibold text-blue-900">Total Didapat</span>
                <span className="text-lg font-bold text-blue-700">{pkg.tokens.toLocaleString("id-ID")} Token</span>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1 rounded-xl gap-1" onClick={() => openEdit(pkg)}>
                  <Edit className="h-4 w-4" /> Edit
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl px-3 text-destructive border-destructive/20 hover:bg-destructive/10" onClick={() => handleDelete(pkg.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {packages.length === 0 && !loading && (
          <div className="col-span-full py-10 text-center border-2 border-dashed rounded-3xl">
            <Zap className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="text-lg font-bold">Belum ada paket AI</h3>
            <p className="text-sm text-muted-foreground">Buat paket top-up Token AI pertama Anda sekarang.</p>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden border-0 shadow-2xl">
          <DialogHeader className="px-6 pt-6 pb-3 border-b border-border/50">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600">
                <Zap className="h-4 w-4" />
              </div>
              {editingPackage?.id ? "Edit Paket AI" : "Tambah Paket AI"}
            </DialogTitle>
          </DialogHeader>

          {editingPackage && (
            <div className="px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Nama Paket</Label>
                <Input
                  value={editingPackage.name || ""}
                  onChange={e => setEditingPackage({ ...editingPackage, name: e.target.value })}
                  className="rounded-xl"
                  placeholder="Contoh: Paket Starter AI"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Deskripsi Singkat</Label>
                <Input
                  value={editingPackage.description || ""}
                  onChange={e => setEditingPackage({ ...editingPackage, description: e.target.value })}
                  placeholder="Penjelasan singkat"
                  className="rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Harga Jual (Rp)</Label>
                  <Input
                    type="number"
                    value={editingPackage.price ?? 0}
                    onChange={e => setEditingPackage({ ...editingPackage, price: Number(e.target.value) })}
                    className="rounded-xl font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-blue-600">Jumlah Token</Label>
                  <Input
                    type="number"
                    value={editingPackage.tokens ?? 0}
                    onChange={e => setEditingPackage({ ...editingPackage, tokens: Number(e.target.value) })}
                    className="rounded-xl font-bold text-blue-600 bg-blue-50/50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Urutan Tampil</Label>
                <Input
                  type="number"
                  value={editingPackage.sortOrder ?? 0}
                  onChange={e => setEditingPackage({ ...editingPackage, sortOrder: Number(e.target.value) })}
                  className="rounded-xl"
                />
              </div>
            </div>
          )}

          <DialogFooter className="px-6 py-4 border-t bg-muted/20 gap-2">
            <Button variant="ghost" className="rounded-xl" onClick={() => setIsDialogOpen(false)}>Batal</Button>
            <button
              className="rounded-xl btn-gradient text-white border-0 px-8 gap-2"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Menyimpan...</>
              ) : (
                <><Save className="h-4 w-4" /> Simpan Paket</>
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
