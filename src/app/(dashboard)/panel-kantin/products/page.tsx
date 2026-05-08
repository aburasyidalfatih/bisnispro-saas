"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Package, Plus, Edit2, Loader2, ImagePlus, ToggleLeft } from "lucide-react"
import { useToast as useToastHook } from "@/hooks/use-toast"

type Product = { id: string; name: string; price: number; stock: number; isActive: boolean; imageUrl?: string }

export default function ProductsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const tenant = session?.user?.tenants?.[0]
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: "", price: 0, stock: -1, imageUrl: "" })
  const [saving, setSaving] = useState(false)

  const fetchProducts = async () => {
    if (!tenant) return
    const res = await fetch(`/api/canteen/products?tenantId=${tenant.id}`)
    const data = await res.json()
    setProducts(data.products || [])
    setLoading(false)
  }

  useEffect(() => { fetchProducts() }, [tenant])

  const handleSave = async () => {
    if (!tenant) return
    if (!form.name || !form.price) return toast({ title: "Lengkapi nama & harga produk", variant: "destructive" })
    setSaving(true)
    try {
      const res = await fetch("/api/canteen/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: tenant.id, ...form, price: Number(form.price), stock: Number(form.stock) }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast({ title: "Produk berhasil ditambahkan!" })
      setShowForm(false)
      setForm({ name: "", price: 0, stock: -1, imageUrl: "" })
      fetchProducts()
    } catch (err: any) {
      toast({ title: "Gagal", description: err.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Produk Kantin</h1>
          <p className="text-sm text-muted-foreground">Kelola daftar menu yang dijual.</p>
        </div>
        <Button className="rounded-xl gap-2" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" /> Tambah Produk
        </Button>
      </div>

      {showForm && (
        <Card className="glass border-0 border-primary/20">
          <CardHeader><CardTitle className="text-sm">Produk Baru</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nama Produk *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nasi Goreng" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Harga (Rp) *</Label>
                <Input type="number" value={form.price || ""} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} placeholder="15000" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Stok (-1 = tidak terbatas)</Label>
                <Input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: Number(e.target.value) }))} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>URL Gambar (Opsional)</Label>
                <Input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." className="rounded-xl" />
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

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : products.length === 0 ? (
        <Card className="glass border-0">
          <CardContent className="py-16 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Belum ada produk. Tambahkan menu pertama Anda!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(p => (
            <Card key={p.id} className="glass border-0 shadow-sm overflow-hidden">
              {p.imageUrl && (
                <img src={p.imageUrl} alt={p.name} className="w-full h-36 object-cover" />
              )}
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold">{p.name}</h3>
                  <Badge className={p.isActive ? "bg-emerald-500/10 text-emerald-600 border-emerald-200 border" : "bg-slate-500/10 text-slate-500 border border-slate-200"}>
                    {p.isActive ? "Aktif" : "Nonaktif"}
                  </Badge>
                </div>
                <p className="text-lg font-black text-primary">Rp {p.price.toLocaleString("id-ID")}</p>
                <p className="text-xs text-muted-foreground">Stok: {p.stock === -1 ? "∞ Tidak Terbatas" : p.stock}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
