"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/hooks/use-toast"
import { Zap, Edit, Save, Plus, Trash2, History, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { ServerPagination } from "@/components/shared/server-pagination"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"

interface AiTokenPackage {
  id: string
  name: string
  description: string | null
  price: number
  tokens: number
  isActive: boolean
  sortOrder: number
}

export default function AiPackagesPage() {
  const [loading, setLoading] = useState(true)
  const [packages, setPackages] = useState<AiTokenPackage[]>([])
  const [editingPackage, setEditingPackage] = useState<Partial<AiTokenPackage> | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [usageLogs, setUsageLogs] = useState<any[]>([])
  const [usageTotalItems, setUsageTotalItems] = useState(0)
  const [usageTotalPages, setUsageTotalPages] = useState(0)
  const [usagePage, setUsagePage] = useState(1)
  const [usageLoading, setUsageLoading] = useState(false)

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

  const fetchUsageLogs = async (p = 1) => {
    setUsageLoading(true)
    try {
      const res = await fetch(`/api/super-admin/ai-usage?page=${p}&limit=10`)
      const data = await res.json()
      if (data.data) {
        setUsageLogs(data.data)
        setUsageTotalPages(data.totalPages || 0)
        setUsageTotalItems(data.total || 0)
      }
    } catch {
      toast({ title: "Error", description: "Gagal memuat histori penggunaan.", variant: "destructive" })
    } finally {
      setUsageLoading(false)
    }
  }

  useEffect(() => { 
    fetchAll()
    fetchUsageLogs(1)
  }, [])

  useEffect(() => {
    fetchUsageLogs(usagePage)
  }, [usagePage])

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
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Katalog Paket Token AI</h1>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-1">
          <p className="text-muted-foreground text-sm">
            Kelola paket *Top-Up* Token AI yang bisa dibeli oleh sekolah secara terpisah.
          </p>
          <Button onClick={openCreate} className="btn-gradient text-white border-0 rounded-xl gap-2 h-10 shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" /> Tambah Paket
          </Button>
        </div>
      </div>

      {/* Package Cards */}
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

      <div className="pt-8">
        <h2 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Histori Penggunaan Token AI Tenant
        </h2>
        
        <Card className="glass border-0 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-4 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Waktu</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Tenant</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">User</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Fitur / Penggunaan</th>
                  <th className="px-4 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-widest">Token Digunakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {usageLoading && usageLogs.length === 0 ? (
                  [...Array(3)].map((_, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-4 py-5" colSpan={5}><div className="skeleton h-10 w-full rounded-xl" /></td>
                    </tr>
                  ))
                ) : usageLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center">
                      <Building2 className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
                      <p className="text-muted-foreground italic">Belum ada histori penggunaan token.</p>
                    </td>
                  </tr>
                ) : (
                  usageLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/20 transition-all">
                      <td className="px-4 py-4 text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="font-bold text-sm">{log.tenant?.name || "-"}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">{log.user?.name || "-"}</td>
                      <td className="px-4 py-4">
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                          {log.feature}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="font-bold text-rose-600 bg-rose-500/10 px-2.5 py-1 rounded-lg">
                          -{log.tokens.toLocaleString("id-ID")}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {usageTotalPages > 1 && (
            <div className="px-6 py-4 border-t border-border/40 bg-muted/10">
              <ServerPagination page={usagePage} totalPages={usageTotalPages} total={usageTotalItems} onPageChange={setUsagePage} />
            </div>
          )}
        </Card>
      </div>

      {/* ─── Edit Dialog ─── */}
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
                  {!!editingPackage.tokens && editingPackage.tokens > 0 && (
                    <p className="text-[10px] text-muted-foreground pt-1 pl-1 leading-tight">
                      Setara dengan <strong className="text-blue-600">~{Math.floor(editingPackage.tokens / 50).toLocaleString("id-ID")}</strong> artikel berita.
                    </p>
                  )}
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
            <Button
              className="rounded-xl btn-gradient text-white border-0 px-8 gap-2"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Menyimpan...</>
              ) : (
                <><Save className="h-4 w-4" /> Simpan Paket</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
