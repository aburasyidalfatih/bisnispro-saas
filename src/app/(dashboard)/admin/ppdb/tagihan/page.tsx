"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Wallet, Eye, Search } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

export default function PpdbTagihanPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [billings, setBillings] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [selectedTagihan, setSelectedTagihan] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    const tid = session?.user?.tenants?.[0]?.id
    if (tid) setTenantId(tid)
  }, [session])

  const fetchBillings = async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/ppdb/tagihan?tenantId=${tenantId}`)
      const data = await res.json()
      const arr = Array.isArray(data) ? data : []
      setBillings(arr)
      setFiltered(arr)
    } catch { } finally { setLoading(false) }
  }

  useEffect(() => { fetchBillings() }, [tenantId])

  useEffect(() => {
    if (!search) { setFiltered(billings); return }
    const q = search.toLowerCase()
    setFiltered(billings.filter(b => b.pendaftar?.namaLengkap?.toLowerCase().includes(q) || b.pendaftar?.noPendaftaran?.toLowerCase().includes(q)))
  }, [search, billings])

  const handleVerify = async (tagihanId: string, pembayaranId: string, status: string) => {
    try {
      const res = await fetch(`/api/ppdb/tagihan/${tagihanId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: status === "SUCCESS" ? "LUNAS" : "BELUM_LUNAS", pembayaranId, pembayaranStatus: status })
      })
      if (res.ok) {
        toast({ title: "Berhasil", description: `Pembayaran telah diperbarui` })
        setIsDialogOpen(false)
        fetchBillings()
      }
    } catch { }
  }

  const hasPendingPayment = (b: any) => b.pembayaran?.some((p: any) => p.status === "PENDING")

  const counts = {
    all: billings.length,
    lunas: billings.filter(b => b.status === "LUNAS").length,
    pending: billings.filter(b => hasPendingPayment(b)).length,
    belum: billings.filter(b => b.status !== "LUNAS" && !hasPendingPayment(b)).length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tagihan & Pembayaran</h1>
          <p className="text-muted-foreground mt-1 text-sm">Verifikasi bukti transfer dan kelola status tagihan pendaftaran.</p>
        </div>
        <Button variant="outline" className="rounded-xl" onClick={fetchBillings}>Refresh</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Tagihan", value: counts.all, color: "text-foreground" },
          { label: "Menunggu Verifikasi", value: counts.pending, color: "text-amber-500" },
          { label: "Lunas", value: counts.lunas, color: "text-emerald-500" },
          { label: "Belum Bayar", value: counts.belum, color: "text-red-500" },
        ].map(s => (
          <Card key={s.label} className="glass border-0">
            <CardContent className="p-4 text-center">
              <div className={`text-2xl font-extrabold ${s.color}`}>{s.value}</div>
              <div className="text-[11px] text-muted-foreground font-medium mt-0.5">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table Card */}
      <Card className="glass border-0">
        <div className="p-4 border-b border-border/50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama pendaftar..." className="pl-9 rounded-xl border-0 bg-muted/40" />
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-12 rounded-xl skeleton" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Wallet className="h-12 w-12 text-muted-foreground/20 mb-3" />
            <p className="font-medium text-muted-foreground">Belum ada data tagihan</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Tagihan akan muncul otomatis saat ada pendaftar baru.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">Pendaftar</th>
                  <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Jenis</th>
                  <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Nominal</th>
                  <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Status Tagihan</th>
                  <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Pembayaran</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filtered.map(b => {
                  const latestPembayaran = b.pembayaran?.[0]
                  const isPending = latestPembayaran?.status === "PENDING"
                  return (
                    <tr key={b.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-semibold">{b.pendaftar?.namaLengkap}</div>
                        <code className="text-[10px] text-muted-foreground font-mono">{b.pendaftar?.noPendaftaran}</code>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-bold">{b.jenis}</Badge>
                      </td>
                      <td className="px-4 py-4 font-bold">Rp {b.nominal?.toLocaleString()}</td>
                      <td className="px-4 py-4">
                        <Badge className={b.status === "LUNAS" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-red-500/10 text-red-600 border-red-500/20"}>
                          {b.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        {latestPembayaran ? (
                          <div className="flex items-center gap-2">
                            <Badge className={
                              latestPembayaran.status === "SUCCESS" ? "bg-emerald-100 text-emerald-700" :
                              latestPembayaran.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                              "bg-red-100 text-red-700"
                            }>
                              {latestPembayaran.status}
                            </Badge>
                            {isPending && (
                              <span className="text-[10px] text-amber-600 font-medium animate-pulse">Perlu Verifikasi!</span>
                            )}
                          </div>
                        ) : <span className="text-muted-foreground text-xs">Belum ada</span>}
                      </td>
                      <td className="px-4 py-4">
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => { setSelectedTagihan(b); setIsDialogOpen(true) }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-border/50 text-xs text-muted-foreground">
            {filtered.length} tagihan ditemukan
          </div>
        )}
      </Card>

      {/* Verify Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Detail Pembayaran</DialogTitle>
          </DialogHeader>
          {selectedTagihan && (
            <div className="space-y-5">
              <div className="flex justify-between items-start p-4 rounded-xl bg-muted/40">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Pendaftar</p>
                  <p className="font-bold mt-0.5">{selectedTagihan.pendaftar?.namaLengkap}</p>
                  <p className="text-xs text-muted-foreground font-mono">{selectedTagihan.pendaftar?.noPendaftaran}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground font-medium">Total Tagihan</p>
                  <p className="font-extrabold text-xl text-primary mt-0.5">Rp {selectedTagihan.nominal?.toLocaleString()}</p>
                  <Badge variant="outline" className="text-[10px] mt-1">{selectedTagihan.jenis}</Badge>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Riwayat Pembayaran</p>
                {selectedTagihan.pembayaran?.length > 0 ? (
                  selectedTagihan.pembayaran.map((p: any) => (
                    <div key={p.id} className="p-4 rounded-2xl border space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-bold">Rp {p.nominal?.toLocaleString()}</p>
                          <p className="text-[11px] text-muted-foreground">{format(new Date(p.createdAt), "d MMM yyyy, HH:mm", { locale: localeId })}</p>
                        </div>
                        <Badge className={p.status === "SUCCESS" ? "bg-emerald-500 text-white" : p.status === "PENDING" ? "bg-amber-500 text-white" : "bg-red-500 text-white"}>
                          {p.status}
                        </Badge>
                      </div>
                      {p.buktiUrl && (
                        <div>
                          <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">Bukti Transfer</p>
                          <a href={p.buktiUrl} target="_blank" rel="noreferrer" className="block rounded-xl overflow-hidden border hover:opacity-80 transition-opacity">
                            <img src={p.buktiUrl} alt="Bukti" className="w-full aspect-video object-cover" />
                          </a>
                        </div>
                      )}
                      {p.status === "PENDING" && (
                        <div className="flex gap-2 pt-1">
                          <Button className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white border-0 gap-1" onClick={() => handleVerify(selectedTagihan.id, p.id, "SUCCESS")}>
                            <CheckCircle className="h-4 w-4" /> Terima
                          </Button>
                          <Button variant="outline" className="flex-1 rounded-xl text-red-600 border-red-200 hover:bg-red-50 gap-1" onClick={() => handleVerify(selectedTagihan.id, p.id, "FAILED")}>
                            <XCircle className="h-4 w-4" /> Tolak
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">Belum ada konfirmasi pembayaran.</div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
