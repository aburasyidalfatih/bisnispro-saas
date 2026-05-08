"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  BadgeDollarSign, Plus, Edit2, Trash2, Loader2,
  ToggleLeft, Repeat, MoreVertical, ChevronDown
} from "lucide-react"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"

type BillingType = {
  id: string; name: string; category: string; description?: string
  amount: number; isRecurring: boolean; isActive: boolean
  _count?: { invoices: number }
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  SPP: { label: "SPP Bulanan", color: "bg-blue-500/10 text-blue-600 border-blue-200" },
  UANG_GEDUNG: { label: "Uang Gedung", color: "bg-purple-500/10 text-purple-600 border-purple-200" },
  EKSKUL: { label: "Ekstrakulikuler", color: "bg-pink-500/10 text-pink-600 border-pink-200" },
  SERAGAM: { label: "Seragam", color: "bg-amber-500/10 text-amber-600 border-amber-200" },
  BUKU: { label: "Buku / LKS", color: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
  LAINNYA: { label: "Lainnya", color: "bg-slate-500/10 text-slate-500 border-slate-200" },
}

const EMPTY_FORM = {
  name: "", category: "SPP", description: "", amount: 0,
  isRecurring: true, isActive: true,
}

export default function BillingTypesPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const tenant = session?.user?.tenants?.[0]
  const [types, setTypes] = useState<BillingType[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)

  const fetchTypes = async () => {
    if (!tenant) return
    setLoading(true)
    const res = await fetch(`/api/finance/billing-types?tenantId=${tenant.id}`)
    setTypes(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchTypes() }, [tenant])

  const openCreate = () => {
    setEditId(null)
    setForm({ ...EMPTY_FORM })
    setShowForm(true)
  }

  const openEdit = (bt: BillingType) => {
    setEditId(bt.id)
    setForm({
      name: bt.name, category: bt.category, description: bt.description || "",
      amount: bt.amount, isRecurring: bt.isRecurring, isActive: bt.isActive,
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!tenant) return
    if (!form.name || !form.amount) return toast({ title: "Nama dan nominal wajib diisi", variant: "destructive" })
    setSaving(true)
    try {
      const url = editId ? `/api/finance/billing-types/${editId}` : "/api/finance/billing-types"
      const method = editId ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: tenant.id, ...form, amount: Number(form.amount) }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast({ title: editId ? "Jenis tagihan diperbarui!" : "Jenis tagihan ditambahkan!" })
      setShowForm(false)
      setEditId(null)
      fetchTypes()
    } catch (err: any) {
      toast({ title: "Gagal", description: err.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus jenis tagihan ini?")) return
    if (!tenant) return
    await fetch(`/api/finance/billing-types/${id}?tenantId=${tenant.id}`, { method: "DELETE" })
    toast({ title: "Jenis tagihan dihapus" })
    fetchTypes()
  }

  const handleToggle = async (id: string, isActive: boolean) => {
    if (!tenant) return
    await fetch(`/api/finance/billing-types/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId: tenant.id, isActive: !isActive }),
    })
    fetchTypes()
  }

  const totalSPP = types.filter(t => t.category === "SPP" && t.isActive).reduce((a, t) => a + t.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Jenis Tagihan</h1>
          <p className="text-sm text-muted-foreground">Template tagihan yang digunakan untuk membuat invoice siswa.</p>
        </div>
        <Button className="rounded-xl gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Tambah Jenis
        </Button>
      </div>

      {/* Info card */}
      {totalSPP > 0 && (
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-blue-500/10 border border-blue-200">
          <BadgeDollarSign className="h-8 w-8 text-blue-600 shrink-0" />
          <div>
            <p className="font-bold text-blue-800">Total SPP Aktif: Rp {totalSPP.toLocaleString("id-ID")}/bulan</p>
            <p className="text-sm text-blue-600">{types.filter(t => t.category === "SPP" && t.isActive).length} tipe SPP aktif terdaftar.</p>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <Card className="glass border-0 border-primary/20 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <BadgeDollarSign className="h-4 w-4 text-primary" />
              {editId ? "Edit Jenis Tagihan" : "Tambah Jenis Tagihan Baru"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nama Tagihan *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="SPP Reguler / Uang Gedung" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Kategori *</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nominal (Rp) *</Label>
                <Input type="number" value={form.amount || ""} onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))} placeholder="500000" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Deskripsi</Label>
                <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Catatan opsional..." className="rounded-xl" />
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border flex-1">
                <div className="flex-1">
                  <p className="font-semibold text-sm">Berulang (Recurring)</p>
                  <p className="text-xs text-muted-foreground">Tagihan ini dibuat setiap bulan</p>
                </div>
                <Switch checked={form.isRecurring} onCheckedChange={v => setForm(f => ({ ...f, isRecurring: v }))} />
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border flex-1">
                <div className="flex-1">
                  <p className="font-semibold text-sm">Status Aktif</p>
                  <p className="text-xs text-muted-foreground">Bisa digunakan untuk buat invoice</p>
                </div>
                <Switch checked={form.isActive} onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving} className="rounded-xl">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Simpan"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)} className="rounded-xl">Batal</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : types.length === 0 ? (
        <Card className="glass border-0">
          <CardContent className="py-20 text-center">
            <BadgeDollarSign className="h-14 w-14 mx-auto mb-4 text-muted-foreground opacity-40" />
            <p className="text-muted-foreground font-medium">Belum ada jenis tagihan.</p>
            <p className="text-sm text-muted-foreground mt-1">Mulai dengan menambahkan template SPP bulanan.</p>
            <Button className="rounded-xl mt-4" onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Tambah Sekarang</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {types.map(bt => {
            const catCfg = CATEGORY_CONFIG[bt.category] || CATEGORY_CONFIG.LAINNYA
            return (
              <Card key={bt.id} className={`glass border-0 shadow-sm transition-all ${!bt.isActive ? "opacity-60" : ""}`}>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <Badge className={`${catCfg.color} border text-[10px] mb-2`}>{catCfg.label}</Badge>
                      <h3 className="font-bold text-base leading-tight">{bt.name}</h3>
                      {bt.description && <p className="text-xs text-muted-foreground mt-0.5">{bt.description}</p>}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem onClick={() => openEdit(bt)}>
                          <Edit2 className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggle(bt.id, bt.isActive)}>
                          <ToggleLeft className="mr-2 h-4 w-4" /> {bt.isActive ? "Nonaktifkan" : "Aktifkan"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(bt.id)} className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" /> Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-end justify-between mt-4">
                    <div>
                      <p className="text-2xl font-black text-primary">Rp {bt.amount.toLocaleString("id-ID")}</p>
                      <p className="text-xs text-muted-foreground">{bt.isRecurring ? "/ bulan" : "sekali bayar"}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {bt.isRecurring && <Repeat className="h-4 w-4 text-muted-foreground" />}
                      <Badge className={bt.isActive ? "bg-emerald-500/10 text-emerald-600 border-emerald-200 border text-[10px]" : "bg-slate-500/10 text-slate-500 border text-[10px]"}>
                        {bt.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                      {bt._count && <p className="text-[10px] text-muted-foreground">{bt._count.invoices} invoice</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
