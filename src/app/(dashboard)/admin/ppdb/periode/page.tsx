"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, Calendar, CheckCircle, XCircle, GripVertical, Receipt } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { id } from "date-fns/locale"

interface ItemDaftarUlang {
  id: string
  nama: string
  nominal: number
}

export default function PpdbPeriodePage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [periods, setPeriods] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPeriod, setEditingPeriod] = useState<any>(null)
  const [formData, setFormData] = useState({
    nama: "", tanggalBuka: "", tanggalTutup: "",
    isActive: true, biayaPendaftaran: 0, kuota: 0,
  })
  const [itemsDaftarUlang, setItemsDaftarUlang] = useState<ItemDaftarUlang[]>([
    { id: "1", nama: "Seragam Sekolah", nominal: 500000 },
    { id: "2", nama: "Uang Pembangunan", nominal: 3000000 },
  ])

  useEffect(() => {
    const tid = session?.user?.tenants?.[0]?.id
    if (tid) setTenantId(tid)
  }, [session])

  const fetchPeriods = async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/ppdb/periode?tenantId=${tenantId}`)
      const data = await res.json()
      setPeriods(Array.isArray(data) ? data : [])
    } catch { } finally { setLoading(false) }
  }

  useEffect(() => { fetchPeriods() }, [tenantId])

  const handleSave = async () => {
    if (!tenantId || !formData.nama || !formData.tanggalBuka || !formData.tanggalTutup) {
      toast({ title: "Error", description: "Lengkapi semua field yang wajib diisi", variant: "destructive" })
      return
    }
    try {
      const totalDaftarUlang = itemsDaftarUlang.reduce((sum, i) => sum + i.nominal, 0)
      const res = await fetch("/api/ppdb/periode", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId, nama: formData.nama, tanggalBuka: formData.tanggalBuka,
          tanggalTutup: formData.tanggalTutup, isActive: formData.isActive,
          pengaturan: {
            biayaPendaftaran: formData.biayaPendaftaran,
            kuota: formData.kuota,
            itemDaftarUlang: itemsDaftarUlang.map(({ id, ...rest }) => rest),
            totalDaftarUlang,
          }
        }),
      })
      if (res.ok) {
        toast({ title: "Berhasil", description: "Gelombang pendaftaran berhasil disimpan" })
        setIsDialogOpen(false)
        fetchPeriods()
      } else { toast({ title: "Gagal", description: "Terjadi kesalahan", variant: "destructive" }) }
    } catch { }
  }

  const addItem = () => {
    setItemsDaftarUlang(prev => [...prev, { id: Date.now().toString(), nama: "", nominal: 0 }])
  }

  const removeItem = (id: string) => {
    setItemsDaftarUlang(prev => prev.filter(i => i.id !== id))
  }

  const updateItem = (id: string, field: "nama" | "nominal", value: string | number) => {
    setItemsDaftarUlang(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i))
  }

  const totalDaftarUlang = itemsDaftarUlang.reduce((s, i) => s + (i.nominal || 0), 0)

  const openCreate = () => {
    setEditingPeriod(null)
    setFormData({ nama: "", tanggalBuka: "", tanggalTutup: "", isActive: true, biayaPendaftaran: 0, kuota: 0 })
    setItemsDaftarUlang([
      { id: "1", nama: "Seragam Sekolah", nominal: 500000 },
      { id: "2", nama: "Uang Pembangunan", nominal: 3000000 },
    ])
    setIsDialogOpen(true)
  }

  const openEdit = (p: any) => {
    setEditingPeriod(p)
    setFormData({
      nama: p.nama, tanggalBuka: p.tanggalBuka?.split("T")[0], tanggalTutup: p.tanggalTutup?.split("T")[0],
      isActive: p.isActive, biayaPendaftaran: p.pengaturan?.biayaPendaftaran ?? 0, kuota: p.pengaturan?.kuota ?? 0,
    })
    const existingItems = p.pengaturan?.itemDaftarUlang ?? []
    setItemsDaftarUlang(existingItems.length > 0
      ? existingItems.map((item: any, idx: number) => ({ ...item, id: String(idx + 1) }))
      : [{ id: "1", nama: "Seragam Sekolah", nominal: 500000 }])
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gelombang Pendaftaran</h1>
          <p className="text-muted-foreground mt-1 text-sm">Kelola periode pembukaan pendaftaran siswa baru.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl btn-gradient text-white border-0 shadow-md shadow-primary/20 gap-2" onClick={openCreate}>
              <Plus className="h-4 w-4" /> Buat Gelombang
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPeriod ? "Edit Gelombang" : "Buat Gelombang Baru"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-2">
              {/* Info Dasar */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Informasi Dasar</h4>
                <div className="space-y-2">
                  <Label>Nama Gelombang <span className="text-red-500">*</span></Label>
                  <Input placeholder="Contoh: Gelombang I (Reguler)" value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value })} className="rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tanggal Buka <span className="text-red-500">*</span></Label>
                    <Input type="date" value={formData.tanggalBuka} onChange={(e) => setFormData({ ...formData, tanggalBuka: e.target.value })} className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Tanggal Tutup <span className="text-red-500">*</span></Label>
                    <Input type="date" value={formData.tanggalTutup} onChange={(e) => setFormData({ ...formData, tanggalTutup: e.target.value })} className="rounded-xl" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Biaya Pendaftaran (Rp)</Label>
                    <Input type="number" value={formData.biayaPendaftaran} onChange={(e) => setFormData({ ...formData, biayaPendaftaran: parseInt(e.target.value) || 0 })} className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Kuota Siswa</Label>
                    <Input type="number" value={formData.kuota} onChange={(e) => setFormData({ ...formData, kuota: parseInt(e.target.value) || 0 })} className="rounded-xl" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/30">
                  <div>
                    <p className="text-sm font-medium">Status Gelombang</p>
                    <p className="text-[11px] text-muted-foreground">Aktifkan agar pendaftar bisa melihat gelombang ini.</p>
                  </div>
                  <Switch checked={formData.isActive} onCheckedChange={(v) => setFormData({ ...formData, isActive: v })} />
                </div>
              </div>

              <Separator />

              {/* Item Daftar Ulang */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Item Tagihan Daftar Ulang</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Akan muncul otomatis ketika siswa dinyatakan diterima.</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" className="rounded-lg gap-1 text-xs" onClick={addItem}>
                    <Plus className="h-3.5 w-3.5" /> Tambah Item
                  </Button>
                </div>

                <div className="space-y-2">
                  {itemsDaftarUlang.map((item, idx) => (
                    <div key={item.id} className="flex items-center gap-2 p-3 rounded-xl border bg-muted/20 group">
                      <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Nama item, mis: Seragam"
                          value={item.nama}
                          onChange={(e) => updateItem(item.id, "nama", e.target.value)}
                          className="rounded-lg border-0 bg-white dark:bg-slate-900 h-9 text-sm"
                        />
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">Rp</span>
                          <Input
                            type="number"
                            placeholder="0"
                            value={item.nominal}
                            onChange={(e) => updateItem(item.id, "nominal", parseInt(e.target.value) || 0)}
                            className="rounded-lg border-0 bg-white dark:bg-slate-900 h-9 pl-9 text-sm"
                          />
                        </div>
                      </div>
                      <Button
                        type="button" variant="ghost" size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                        onClick={() => removeItem(item.id)}
                        disabled={itemsDaftarUlang.length === 1}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Receipt className="h-4 w-4 text-primary" />
                    Total Daftar Ulang
                  </div>
                  <span className="font-extrabold text-primary">
                    Rp {totalDaftarUlang.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl">Batal</Button>
              <Button onClick={handleSave} className="rounded-xl btn-gradient text-white border-0">Simpan Gelombang</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <div key={i} className="h-56 rounded-2xl skeleton" />)}
        </div>
      ) : periods.length === 0 ? (
        <Card className="glass border-dashed border-2 bg-transparent">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-2xl bg-primary/5 flex items-center justify-center mb-4">
              <Calendar className="h-8 w-8 text-primary/30" />
            </div>
            <h3 className="font-bold text-lg mb-1">Belum Ada Gelombang</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">Buat gelombang pendaftaran pertama untuk mulai menerima calon siswa baru.</p>
            <Button className="rounded-xl btn-gradient text-white border-0 gap-2" onClick={openCreate}>
              <Plus className="h-4 w-4" /> Buat Gelombang Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {periods.map((p) => {
            const items: any[] = p.pengaturan?.itemDaftarUlang ?? []
            const totalDU = p.pengaturan?.totalDaftarUlang ?? items.reduce((s: number, i: any) => s + i.nominal, 0)
            return (
              <Card key={p.id} className="glass border-0 overflow-hidden group hover:shadow-lg transition-shadow">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <Badge className={p.isActive ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"}>
                      {p.isActive ? <><CheckCircle className="mr-1 h-3 w-3 inline" />Aktif</> : <><XCircle className="mr-1 h-3 w-3 inline" />Tutup</>}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-bold text-base">{p.nama}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(p.tanggalBuka), "d MMM", { locale: id })} – {format(new Date(p.tanggalTutup), "d MMM yyyy", { locale: id })}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
                    <div>
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Pendaftar</p>
                      <p className="font-bold text-xl">{p._count?.pendaftar ?? 0}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Biaya Daftar</p>
                      <p className="font-bold text-sm">Rp {(p.pengaturan?.biayaPendaftaran ?? 0).toLocaleString()}</p>
                    </div>
                  </div>
                  {items.length > 0 && (
                    <div className="rounded-xl bg-muted/30 p-3 space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Receipt className="h-3 w-3" /> Daftar Ulang ({items.length} item)
                      </p>
                      {items.slice(0, 3).map((item: any, i: number) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-muted-foreground truncate max-w-[60%]">{item.nama}</span>
                          <span className="font-medium">Rp {item.nominal.toLocaleString()}</span>
                        </div>
                      ))}
                      {items.length > 3 && <p className="text-[10px] text-muted-foreground">+{items.length - 3} item lainnya...</p>}
                      <div className="pt-1 border-t border-border/50 flex justify-between text-xs font-bold">
                        <span>Total</span>
                        <span className="text-primary">Rp {totalDU.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                  <Button variant="outline" size="sm" className="w-full rounded-lg text-xs gap-1" onClick={() => openEdit(p)}>
                    <Edit className="h-3 w-3" /> Edit Gelombang
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
