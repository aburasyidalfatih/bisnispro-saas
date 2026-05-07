"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, FileText, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"

export default function PpdbPersyaratanPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [periods, setPeriods] = useState<any[]>([])
  const [selectedPeriode, setSelectedPeriode] = useState<string>("")
  const [requirements, setRequirements] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [newReq, setNewReq] = useState({ nama: "", isWajib: true, tipeFile: "image/*,application/pdf" })

  useEffect(() => {
    const tid = session?.user?.tenants?.[0]?.id
    if (tid) setTenantId(tid)
  }, [session])

  useEffect(() => {
    if (!tenantId) return
    fetch(`/api/ppdb/periode?tenantId=${tenantId}`)
      .then(r => r.json()).then(data => {
        const arr = Array.isArray(data) ? data : []
        setPeriods(arr)
        if (arr.length > 0) setSelectedPeriode(arr[0].id)
      }).catch(() => {})
  }, [tenantId])

  const fetchReqs = async () => {
    if (!selectedPeriode) return
    setLoading(true)
    try {
      const res = await fetch(`/api/ppdb/persyaratan?periodeId=${selectedPeriode}`)
      const data = await res.json()
      setRequirements(Array.isArray(data) ? data : [])
    } catch { } finally { setLoading(false) }
  }

  useEffect(() => { fetchReqs() }, [selectedPeriode])

  const handleAdd = async () => {
    if (!selectedPeriode || !newReq.nama) return
    try {
      const res = await fetch("/api/ppdb/persyaratan", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periodeId: selectedPeriode, ...newReq }),
      })
      if (res.ok) {
        toast({ title: "Berhasil", description: "Persyaratan ditambahkan" })
        setNewReq({ nama: "", isWajib: true, tipeFile: "image/*,application/pdf" })
        fetchReqs()
      }
    } catch { }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/ppdb/persyaratan?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        toast({ title: "Dihapus" })
        fetchReqs()
      }
    } catch { }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Persyaratan Berkas</h1>
        <p className="text-muted-foreground mt-1 text-sm">Tentukan dokumen yang wajib diunggah calon siswa.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: Add Form */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="glass border-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Gelombang</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedPeriode} onValueChange={setSelectedPeriode}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Pilih gelombang..." />
                </SelectTrigger>
                <SelectContent>
                  {periods.map(p => <SelectItem key={p.id} value={p.id}>{p.nama}</SelectItem>)}
                </SelectContent>
              </Select>
              {periods.length === 0 && (
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
                  <Info className="h-3 w-3" /> Belum ada gelombang. Buat dulu di menu Gelombang.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="glass border-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Tambah Persyaratan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nama Dokumen</Label>
                <Input
                  placeholder="Contoh: Ijazah Terakhir"
                  value={newReq.nama} onChange={(e) => setNewReq({ ...newReq, nama: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Format File</Label>
                <Input
                  placeholder="image/*, application/pdf"
                  value={newReq.tipeFile} onChange={(e) => setNewReq({ ...newReq, tipeFile: e.target.value })}
                  className="rounded-xl text-xs"
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/30">
                <Label className="cursor-pointer">Wajib Diunggah?</Label>
                <Switch checked={newReq.isWajib} onCheckedChange={(v) => setNewReq({ ...newReq, isWajib: v })} />
              </div>
              <Button onClick={handleAdd} className="w-full rounded-xl btn-gradient text-white border-0 gap-2" disabled={!selectedPeriode}>
                <Plus className="h-4 w-4" /> Tambah
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right: List */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">Daftar Persyaratan</h2>
            <Badge variant="outline">{requirements.length} item</Badge>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl skeleton" />)}
            </div>
          ) : requirements.length === 0 ? (
            <Card className="glass border-dashed border-2 bg-transparent">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="h-10 w-10 text-muted-foreground/20 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">Belum ada persyaratan berkas</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Tambahkan dokumen persyaratan di sebelah kiri.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {requirements.map((req, i) => (
                <div key={req.id} className="flex items-center gap-4 p-4 glass rounded-2xl border-0 group">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm truncate">{req.nama}</span>
                      {req.isWajib && <Badge variant="secondary" className="text-[10px] shrink-0 bg-red-500/10 text-red-600 border-red-500/20">Wajib</Badge>}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{req.tipeFile}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0" onClick={() => handleDelete(req.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
