"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Receipt, Search, CheckCircle2, Clock, XCircle, AlertCircle,
  TrendingUp, Wallet, CreditCard, School, ShieldCheck
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog"

interface Payment {
  id: string
  reference: string
  amount: number
  method: string | null
  status: string
  plan: string
  createdAt: string
  paidAt: string | null
  metadata: any
  tenant: { name: string; slug: string }
}

interface Stats {
  totalRevenue: number
  pendingCount: number
}

export default function PaymentsPage() {
  const [data, setData] = useState<{ payments: Payment[], stats: Stats }>({ payments: [], stats: { totalRevenue: 0, pendingCount: 0 } })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")
  const [search, setSearch] = useState("")
  const [confirming, setConfirming] = useState<string | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<Payment | null>(null)

  const fetchPayments = useCallback(async () => {
    try {
      const url = filter === "all" ? "/api/super-admin/payments" : `/api/super-admin/payments?status=${filter}`
      const res = await fetch(url)
      const result = await res.json()
      setData(result)
      setLoading(false)
    } catch {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { fetchPayments() }, [fetchPayments])

  const filteredPayments = data.payments.filter(p =>
    p.reference.toLowerCase().includes(search.toLowerCase()) ||
    p.tenant.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleConfirm = async () => {
    if (!confirmTarget) return
    setConfirming(confirmTarget.id)
    try {
      const res = await fetch("/api/super-admin/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: confirmTarget.id }),
      })
      const result = await res.json()
      if (res.ok) {
        toast({ title: "✅ Berhasil!", description: result.message })
        setConfirmTarget(null)
        fetchPayments()
      } else {
        toast({ title: "Gagal", description: result.error, variant: "destructive" })
      }
    } finally {
      setConfirming(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1"><CheckCircle2 className="h-3 w-3" /> Berhasil</Badge>
      case "pending":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1"><Clock className="h-3 w-3" /> Menunggu</Badge>
      case "expired":
        return <Badge className="bg-slate-500/10 text-slate-600 border-slate-500/20 gap-1"><AlertCircle className="h-3 w-3" /> Kedaluwarsa</Badge>
      case "failed":
        return <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/20 gap-1"><XCircle className="h-3 w-3" /> Gagal</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (loading) return <div className="space-y-6">{[1, 2, 3].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}</div>

  const pendingPayments = data.payments.filter(p => p.status === "pending")

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transaksi Platform</h1>
          <p className="text-muted-foreground mt-1 text-sm">Monitor dan konfirmasi pembayaran langganan tenant.</p>
        </div>
        <div className="flex items-center gap-2">
          {pendingPayments.length > 0 && (
            <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/25 gap-1.5 px-3 py-1.5 text-xs font-bold">
              <Clock className="h-3 w-3" />
              {pendingPayments.length} menunggu konfirmasi
            </Badge>
          )}
          <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={fetchPayments}>
            <TrendingUp className="h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass border-0 shadow-lg shadow-emerald-500/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                <Wallet className="h-6 w-6" />
              </div>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100">Paid</Badge>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-muted-foreground">Total Pendapatan</p>
              <h3 className="text-2xl font-bold mt-1">Rp {data.stats.totalRevenue.toLocaleString("id-ID")}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-0 shadow-lg shadow-amber-500/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
                <Clock className="h-6 w-6" />
              </div>
              <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-100">Pending</Badge>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-muted-foreground">Menunggu Konfirmasi</p>
              <h3 className="text-2xl font-bold mt-1">{data.stats.pendingCount} Transaksi</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-0 shadow-lg shadow-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <CreditCard className="h-6 w-6" />
              </div>
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10">All Time</Badge>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-muted-foreground">Total Transaksi</p>
              <h3 className="text-2xl font-bold mt-1">{data.payments.length} Transaksi</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending alert banner */}
      {pendingPayments.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 px-5 py-4 flex items-center gap-3">
          <Clock className="h-5 w-5 text-amber-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-700">Ada {pendingPayments.length} permintaan upgrade yang belum dikonfirmasi.</p>
            <p className="text-xs text-amber-600 mt-0.5">Klik tombol <strong>Konfirmasi Bayar</strong> pada baris transaksi untuk mengaktifkan paket berlangganan tenant.</p>
          </div>
        </div>
      )}

      {/* Filter & Table */}
      <Card className="glass border-0 shadow-xl shadow-primary/5">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-lg">Daftar Transaksi</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari Ref / Tenant..."
                  className="rounded-xl pl-9 w-[200px] md:w-[250px] h-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                className="h-9 rounded-xl border border-input bg-background px-3 text-xs focus:ring-2 focus:ring-primary outline-none"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">Semua Status</option>
                <option value="paid">Berhasil</option>
                <option value="pending">Menunggu</option>
                <option value="expired">Kedaluwarsa</option>
                <option value="failed">Gagal</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-muted-foreground font-medium">
                  <th className="text-left py-3 px-2">ID Referensi</th>
                  <th className="text-left py-3 px-2">Tenant</th>
                  <th className="text-left py-3 px-2">Paket</th>
                  <th className="text-left py-3 px-2">Nominal</th>
                  <th className="text-left py-3 px-2">Siswa</th>
                  <th className="text-left py-3 px-2">Status</th>
                  <th className="text-left py-3 px-2">Tanggal</th>
                  <th className="text-right py-3 px-2">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-20 text-center text-muted-foreground italic">
                      Tidak ada transaksi ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => (
                    <tr key={p.id} className={cn("transition-colors", p.status === "pending" ? "bg-amber-500/3 hover:bg-amber-500/8" : "hover:bg-muted/30")}>
                      <td className="py-4 px-2 font-mono text-xs font-semibold">{p.reference}</td>
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center">
                            <School className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                          <span className="font-medium">{p.tenant.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-2 uppercase text-[10px] font-bold tracking-wider">{p.plan}</td>
                      <td className="py-4 px-2 font-bold text-primary">Rp {p.amount.toLocaleString("id-ID")}</td>
                      <td className="py-4 px-2 text-xs text-muted-foreground">
                        {(p.metadata as any)?.studentCount ? `${(p.metadata as any).studentCount} siswa` : "—"}
                      </td>
                      <td className="py-4 px-2">{getStatusBadge(p.status)}</td>
                      <td className="py-4 px-2 text-xs text-muted-foreground">
                        {new Date(p.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="py-4 px-2 text-right">
                        {p.status === "pending" || p.status === "expired" ? (
                          <Button
                            size="sm"
                            onClick={() => setConfirmTarget(p)}
                            className="rounded-xl gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white border-0 h-8 px-3 text-xs font-bold shadow-md shadow-emerald-600/20"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Konfirmasi Bayar
                          </Button>
                        ) : p.status === "paid" ? (
                          <span className="text-[10px] text-emerald-600 font-medium flex items-center justify-end gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Terkonfirmasi
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <Dialog open={!!confirmTarget} onOpenChange={(o) => !o && setConfirmTarget(null)}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
              </div>
              Konfirmasi Pembayaran
            </DialogTitle>
            <DialogDescription>
              Tindakan ini akan mengaktifkan paket berlangganan untuk tenant berikut secara permanen.
            </DialogDescription>
          </DialogHeader>
          {confirmTarget && (
            <div className="py-2 space-y-3">
              <div className="rounded-2xl bg-muted/50 border p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tenant</span>
                  <span className="font-bold">{confirmTarget.tenant.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nominal</span>
                  <span className="font-bold text-primary">Rp {confirmTarget.amount.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Jumlah Siswa</span>
                  <span className="font-bold">{(confirmTarget.metadata as any)?.studentCount || "—"} siswa</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Masa Aktif</span>
                  <span className="font-bold">1 Tahun</span>
                </div>
              </div>
              <p className="text-xs text-amber-600 bg-amber-50 rounded-xl p-3 border border-amber-200">
                ⚠️ Pastikan Anda sudah menerima pembayaran dari tenant sebelum mengkonfirmasi.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmTarget(null)} disabled={!!confirming} className="rounded-xl">
              Batal
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!!confirming}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white border-0 gap-2"
            >
              {confirming ? (
                <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Memproses...</>
              ) : (
                <><ShieldCheck className="h-4 w-4" /> Ya, Konfirmasi & Aktifkan Paket</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
