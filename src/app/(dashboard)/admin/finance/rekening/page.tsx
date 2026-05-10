"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Landmark, Plus, Trash2, Edit, Loader2, Building } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function RekeningPage() {
  const { data: session } = useSession()
  const tenantId = session?.user?.tenants?.[0]?.id
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [banks, setBanks] = useState<any[]>([])
  const [settings, setSettings] = useState<any>({})
  
  const [open, setOpen] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [formData, setFormData] = useState({ bank: "", account: "", name: "" })

  const fetchData = async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/tenant/settings?tenantId=${tenantId}`)
      const json = await res.json()
      setSettings(json)
      setBanks(json.manualBanks || [])
    } catch (e) {
      toast({ title: "Gagal memuat pengaturan", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [tenantId])

  const handleSave = async (updatedBanks: any[]) => {
    setSaving(true)
    try {
      const res = await fetch("/api/tenant/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          settings: { ...settings, manualBanks: updatedBanks }
        })
      })
      if (!res.ok) throw new Error("Gagal menyimpan rekening")
      
      setBanks(updatedBanks)
      toast({ title: "Berhasil", description: "Rekening bank berhasil diperbarui" })
      setOpen(false)
      setFormData({ bank: "", account: "", name: "" })
      setEditIndex(null)
    } catch (e: any) {
      toast({ title: "Gagal", description: e.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    let updated = [...banks]
    if (editIndex !== null) {
      updated[editIndex] = formData
    } else {
      updated.push(formData)
    }
    handleSave(updated)
  }

  const handleDelete = (idx: number) => {
    if (confirm("Hapus rekening ini?")) {
      const updated = banks.filter((_, i) => i !== idx)
      handleSave(updated)
    }
  }

  const handleEdit = (idx: number) => {
    setFormData(banks[idx])
    setEditIndex(idx)
    setOpen(true)
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rekening Bank Tujuan</h1>
          <p className="text-sm text-muted-foreground">Kelola rekening tujuan untuk opsi pembayaran transfer manual (Non-Tripay).</p>
        </div>
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if(!val) { setFormData({ bank: "", account: "", name: "" }); setEditIndex(null) } }}>
          <DialogTrigger asChild>
            <Button className="rounded-xl shadow-md shadow-primary/20"><Plus className="h-4 w-4 mr-2" /> Tambah Rekening</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editIndex !== null ? "Edit Rekening" : "Tambah Rekening Baru"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Nama Bank</label>
                <Input required value={formData.bank} onChange={e => setFormData({...formData, bank: e.target.value})} placeholder="Contoh: BCA / Mandiri / BRI" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Nomor Rekening</label>
                <Input required value={formData.account} onChange={e => setFormData({...formData, account: e.target.value})} placeholder="Contoh: 1234567890" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Atas Nama</label>
                <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Contoh: Yayasan Pendidikan Maju" />
              </div>
              <Button type="submit" disabled={saving} className="w-full h-12 rounded-xl text-md font-bold mt-2">
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Simpan Rekening"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glass border-0 shadow-sm">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="text-lg flex items-center gap-2"><Landmark className="h-5 w-5" /> Daftar Rekening Aktif</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
             <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
          ) : banks.length === 0 ? (
             <div className="text-center py-20 bg-muted/10 border-b border-dashed">
                <Building className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <h3 className="font-semibold text-muted-foreground">Belum ada rekening tujuan</h3>
                <p className="text-sm text-muted-foreground mt-1">Tambahkan setidaknya satu rekening agar orang tua dapat melakukan transfer manual.</p>
             </div>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 p-5">
               {banks.map((b, i) => (
                  <div key={i} className="p-4 rounded-2xl border-2 border-primary/20 bg-primary/5 hover:border-primary/40 transition-colors relative group">
                     <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                           <Landmark className="h-5 w-5" />
                        </div>
                        <div>
                           <h3 className="font-bold">{b.bank}</h3>
                           <p className="text-xs text-muted-foreground">Transfer Manual</p>
                        </div>
                     </div>
                     <div className="space-y-1">
                        <p className="font-mono text-lg font-black tracking-widest text-foreground">{b.account}</p>
                        <p className="text-sm font-medium text-muted-foreground uppercase">A/N. {b.name}</p>
                     </div>
                     <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full" onClick={() => handleEdit(i)}><Edit className="h-4 w-4" /></Button>
                        <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full" onClick={() => handleDelete(i)}><Trash2 className="h-4 w-4" /></Button>
                     </div>
                  </div>
               ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
