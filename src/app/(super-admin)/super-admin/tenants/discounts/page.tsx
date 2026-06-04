"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { Tag, Edit, Plus, Trash2, Save, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useConfirm } from "@/components/providers/confirm-provider"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"

interface DiscountCode {
  id: string
  code: string
  description: string | null
  type: string
  percentage: number
  cashbackAmount: number
  affiliateId: string | null
  linkedTenantId: string | null
  isActive: boolean
  bonusMonths: number
  maxUses: number | null
  usedCount: number
  expiresAt: string | null
  createdAt: string
}

export default function DiscountsPage() {
  const [loading, setLoading] = useState(true)
  const [discounts, setDiscounts] = useState<DiscountCode[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingDiscount, setEditingDiscount] = useState<Partial<DiscountCode> | null>(null)
  const { confirm } = useConfirm()

  const fetchDiscounts = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/super-admin/discounts")
      const data = await res.json()
      if (res.ok && Array.isArray(data)) {
        setDiscounts(data)
      } else {
        throw new Error(data.error || "Format respons tidak valid")
      }
    } catch {
      toast({ title: "Error", description: "Gagal memuat data diskon.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDiscounts() }, [])

  const openCreate = () => {
    setEditingDiscount({
      code: "",
      description: "",
      type: "DISCOUNT",
      percentage: 10,
      cashbackAmount: 0,
      affiliateId: "",
      linkedTenantId: "",
      isActive: true,
      bonusMonths: 0,
      maxUses: null,
      expiresAt: null
    })
    setIsDialogOpen(true)
  }

  const openEdit = (discount: DiscountCode) => {
    let localDatetime = null;
    if (discount.expiresAt) {
      const d = new Date(discount.expiresAt);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      localDatetime = d.toISOString().slice(0, 16);
    }
    setEditingDiscount({
      ...discount,
      expiresAt: localDatetime
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!(await confirm({ 
      title: "Hapus Kode Diskon?", 
      description: "Yakin ingin menghapus kode diskon ini? Tindakan ini tidak dapat dibatalkan." 
    }))) return
    try {
      const res = await fetch(`/api/super-admin/discounts/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Gagal menghapus diskon")
      toast({ title: "Berhasil", description: "Kode diskon dihapus." })
      fetchDiscounts()
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    }
  }

  const handleSave = async () => {
    if (editingDiscount.type === "CASHBACK") {
      if (!editingDiscount?.affiliateId?.trim()) {
        toast({ title: "Validasi", description: "ID Afiliasi Penerima wajib diisi untuk kupon Cashback.", variant: "destructive" })
        return
      }
    } else {
      if (!editingDiscount?.code?.trim()) {
        toast({ title: "Validasi", description: "Kode diskon wajib diisi.", variant: "destructive" })
        return
      }
    }

    setSaving(true)
    try {
      const isEdit = !!editingDiscount.id
      const url = isEdit ? `/api/super-admin/discounts/${editingDiscount.id}` : "/api/super-admin/discounts"
      const method = isEdit ? "PUT" : "POST"

      const payload = {
        ...editingDiscount,
        code: editingDiscount.code.toUpperCase().replace(/\s+/g, '')
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Gagal menyimpan kode diskon")
      }

      toast({ title: "Berhasil", description: `Kode diskon berhasil ${isEdit ? "diperbarui" : "dibuat"}.` })
      setIsDialogOpen(false)
      fetchDiscounts()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (loading && discounts.length === 0) {
    return <div className="space-y-4">{[1, 2].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}</div>
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kode Diskon</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Kelola kode diskon potongan harga untuk upgrade tenant.
          </p>
        </div>
        <Button onClick={openCreate} className="btn-gradient rounded-xl px-4 gap-2 border-0 text-white shadow-lg">
          <Plus className="w-4 h-4" /> Tambah Diskon
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {discounts.map((discount) => (
          <Card key={discount.id} className={cn("glass border-0 overflow-hidden relative", !discount.isActive && "opacity-60 grayscale")}>
            <div className={cn("h-1.5", discount.isActive ? "bg-emerald-500" : "bg-slate-300")} />
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <CardTitle className="text-xl font-bold font-mono tracking-widest">{discount.code}</CardTitle>
                  <CardDescription className="mt-1">{discount.description || "Tanpa deskripsi"}</CardDescription>
                </div>
                <div className="flex gap-2">
                  {discount.type === "CASHBACK" && (
                    <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100">
                      CASHBACK
                    </Badge>
                  )}
                  {discount.bonusMonths > 0 && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100">
                      + {discount.bonusMonths} Bulan
                    </Badge>
                  )}
                  <Badge variant={discount.isActive ? "default" : "secondary"} className={cn(discount.isActive && "bg-emerald-500 hover:bg-emerald-600")}>
                    {discount.type === "CASHBACK" && discount.cashbackAmount > 0 
                      ? `CB Rp ${discount.cashbackAmount.toLocaleString()}`
                      : `${discount.percentage}% OFF`}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-sm text-muted-foreground mb-4">
                <span>Digunakan: {discount.usedCount} / {discount.maxUses || "∞"}</span>
                {discount.expiresAt && <span>Exp: {new Date(discount.expiresAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</span>}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" className="rounded-lg h-8 px-3" onClick={() => openEdit(discount)}>
                  <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit
                </Button>
                <Button variant="ghost" size="sm" className="rounded-lg h-8 px-3 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(discount.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {discounts.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed rounded-3xl">
            <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <h3 className="text-lg font-semibold">Belum Ada Diskon</h3>
            <p className="text-muted-foreground">Buat kode diskon pertama untuk dibagikan ke sekolah.</p>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden border-0 shadow-2xl">
          <DialogHeader className="px-6 pt-6 pb-3 border-b border-border/50">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Tag className="h-4 w-4" />
              </div>
              {editingDiscount?.id ? "Edit Kode Diskon" : "Tambah Kode Diskon"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Formulir untuk membuat atau mengedit kode diskon.
            </DialogDescription>
          </DialogHeader>

          {editingDiscount && (
            <div className="px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Tipe Kupon</Label>
                <select
                  value={editingDiscount.type || "DISCOUNT"}
                  onChange={e => setEditingDiscount({ ...editingDiscount, type: e.target.value })}
                  className="flex h-10 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="DISCOUNT">Diskon Normal (Potong Harga)</option>
                  <option value="CASHBACK">Cashback Afiliasi (Komisi Saldo)</option>
                </select>
              </div>

              {editingDiscount.type !== "CASHBACK" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Kode Diskon</Label>
                  <Input
                    value={editingDiscount.code || ""}
                    onChange={e => setEditingDiscount({ ...editingDiscount, code: e.target.value })}
                    placeholder="Contoh: MERDEKA20"
                    className="rounded-xl uppercase font-mono tracking-widest"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Deskripsi</Label>
                <Input
                  value={editingDiscount.description || ""}
                  onChange={e => setEditingDiscount({ ...editingDiscount, description: e.target.value })}
                  placeholder="Keterangan singkat"
                  className="rounded-xl"
                />
              </div>

              {editingDiscount.type === "CASHBACK" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">ID Afiliasi Penerima</Label>
                    <Input
                      value={editingDiscount.affiliateId || ""}
                      onChange={e => setEditingDiscount({ ...editingDiscount, affiliateId: e.target.value })}
                      placeholder="ID Profile Affiliate"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Nominal Cashback (Rp)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={editingDiscount.cashbackAmount || 0}
                      onChange={e => setEditingDiscount({ ...editingDiscount, cashbackAmount: Number(e.target.value) })}
                      placeholder="Atau gunakan persentase di bawah"
                      className="rounded-xl"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Persentase Potongan (%)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={editingDiscount.percentage || 0}
                    onChange={e => setEditingDiscount({ ...editingDiscount, percentage: Number(e.target.value) })}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Bonus Perpanjangan (Bulan)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={editingDiscount.bonusMonths || 0}
                    onChange={e => setEditingDiscount({ ...editingDiscount, bonusMonths: Number(e.target.value) })}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Batas Kuota Penggunaan</Label>
                  <Input
                    type="number"
                    value={editingDiscount.maxUses || ""}
                    onChange={e => setEditingDiscount({ ...editingDiscount, maxUses: e.target.value ? Number(e.target.value) : null })}
                    placeholder="Kosongkan jika unlimited"
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Batas Waktu (Expired)</Label>
                <Input
                  type="datetime-local"
                  value={editingDiscount.expiresAt || ""}
                  onChange={e => setEditingDiscount({ ...editingDiscount, expiresAt: e.target.value || null })}
                  className="rounded-xl"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editingDiscount.isActive}
                  onChange={e => setEditingDiscount({ ...editingDiscount, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-primary"
                />
                <Label htmlFor="isActive" className="text-sm font-medium">Aktif (bisa digunakan)</Label>
              </div>
            </div>
          )}

          <DialogFooter className="px-6 py-4 border-t bg-muted/20 gap-2">
            <Button variant="ghost" className="rounded-xl" onClick={() => setIsDialogOpen(false)}>
              Batal
            </Button>
            <Button
              className="rounded-xl btn-gradient text-white border-0 px-8 gap-2"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Menyimpan...</>
              ) : (
                <><Save className="h-4 w-4" /> Simpan</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
