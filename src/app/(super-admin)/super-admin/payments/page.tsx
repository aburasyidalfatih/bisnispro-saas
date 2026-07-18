"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Receipt, Search, CheckCircle2, Clock, XCircle, AlertCircle,
  TrendingUp, Wallet, CreditCard, School, ShieldCheck
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import { ConfirmPaymentModal } from "./_components/confirm-payment-modal"
import { CancelPaymentModal } from "./_components/cancel-payment-modal"
import { RefundPaymentModal } from "./_components/refund-payment-modal"

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
  discountCode?: { code: string; type: string } | null
}

interface Stats {
  totalRevenue: number
  pendingCount: number
}

export default function PaymentsPage() {
  const [data, setData] = useState<{ payments: Payment[], stats: Stats, totalPages: number }>({ payments: [], stats: { totalRevenue: 0, pendingCount: 0 }, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [confirmTarget, setConfirmTarget] = useState<Payment | null>(null)
  const [cancelTarget, setCancelTarget] = useState<Payment | null>(null)
  const [refundTarget, setRefundTarget] = useState<Payment | null>(null)

  const fetchPayments = useCallback(async () => {
    try {
      const url = new URL("/api/super-admin/payments", window.location.origin)
      url.searchParams.set("status", filter)
      url.searchParams.set("page", page.toString())
      url.searchParams.set("limit", "10")
      if (search) url.searchParams.set("search", search)
      
      const res = await fetch(url.toString())
      const result = await res.json()
      setData(result)
      setLoading(false)
    } catch {
      setLoading(false)
    }
  }, [filter, page, search])

  // Reset page when search or filter changes
  useEffect(() => {
    setPage(1)
  }, [search, filter])

  // Debounced fetch
  useEffect(() => { 
    const timer = setTimeout(() => fetchPayments(), 500)
    return () => clearTimeout(timer)
  }, [fetchPayments])

  const filteredPayments = data.payments || []



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
      case "refunded":
        return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20 gap-1"><AlertCircle className="h-3 w-3" /> Refunded</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (loading) return <div className="space-y-6">{[1, 2, 3].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}</div>

  const pendingPayments = data.payments.filter(p => p.status === "pending")

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Transaksi Platform</h1>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">Monitor dan konfirmasi pembayaran langganan tenant.</p>
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
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <CardTitle className="text-base sm:text-lg">Daftar Transaksi</CardTitle>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari Ref / Tenant..."
                  className="rounded-xl pl-9 w-full sm:w-[200px] md:w-[250px] h-9 max-w-full"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={filter} onValueChange={(value) => setFilter(value)}>
                <SelectTrigger className="h-9 rounded-xl text-xs w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="paid">Berhasil</SelectItem>
                  <SelectItem value="pending">Menunggu</SelectItem>
                  <SelectItem value="expired">Kedaluwarsa</SelectItem>
                  <SelectItem value="failed">Gagal</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/50 text-muted-foreground font-medium">
                  <TableHead className="text-left py-3 px-2">ID Referensi</TableHead>
                  <TableHead className="text-left py-3 px-2">Lembaga</TableHead>
                  <TableHead className="text-left py-3 px-2">Paket</TableHead>
                  <TableHead className="text-left py-3 px-2">Nominal</TableHead>
                  <TableHead className="text-left py-3 px-2">Siswa</TableHead>
                  <TableHead className="text-left py-3 px-2">Kupon</TableHead>
                  <TableHead className="text-left py-3 px-2">Status</TableHead>
                  <TableHead className="text-left py-3 px-2">Tanggal</TableHead>
                  <TableHead className="text-right py-3 px-2">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-20 text-center text-muted-foreground italic">
                      Tidak ada transaksi ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((p) => (
                    <TableRow key={p.id} className={cn("transition-colors", p.status === "pending" ? "bg-amber-500/3 hover:bg-amber-500/8" : "hover:bg-muted/30")}>
                      <TableCell className="py-4 px-2 font-mono text-xs font-semibold">{p.reference}</TableCell>
                      <TableCell className="py-4 px-2">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center">
                            <School className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                          <span className="font-medium">{p.tenant.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-2 uppercase text-[10px] font-bold tracking-wider">{p.plan}</TableCell>
                      <TableCell className="py-4 px-2 font-bold text-primary">Rp {p.amount.toLocaleString("id-ID")}</TableCell>
                      <TableCell className="py-4 px-2 text-xs text-muted-foreground">
                        <div className="flex flex-col gap-1">
                          <span>{(p.metadata as any)?.studentCount ? `${(p.metadata as any).studentCount} siswa` : "—"}</span>
                          {p.method && <Badge variant="outline" className="text-[9px] uppercase px-1.5 py-0.5 rounded-sm w-fit bg-muted/50">{p.method}</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-2">
                        {p.discountCode ? (
                          <div className="flex flex-col gap-1 items-start">
                            <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 rounded-md">
                              {p.discountCode.code}
                            </Badge>
                            <span className="text-[9px] text-muted-foreground uppercase">{p.discountCode.type}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-4 px-2">{getStatusBadge(p.status)}</TableCell>
                      <TableCell className="py-4 px-2 text-xs text-muted-foreground">
                        {new Date(p.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                      </TableCell>
                      <TableCell className="py-4 px-2 text-right">
                        {p.status === "pending" || p.status === "expired" ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => setCancelTarget(p)}
                              variant="outline"
                              className="rounded-xl h-8 px-3 text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50"
                            >
                              Tolak
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => setConfirmTarget(p)}
                              className="rounded-xl gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white border-0 h-8 px-3 text-xs font-bold shadow-md shadow-emerald-600/20"
                            >
                              <ShieldCheck className="h-3.5 w-3.5" />
                              Konfirmasi
                            </Button>
                          </div>
                        ) : p.status === "paid" ? (
                          <div className="flex items-center justify-end gap-3">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setRefundTarget(p)}
                              className="h-7 px-2 text-[10px] text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            >
                              Refund/Batal
                            </Button>
                            <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Terkonfirmasi
                            </span>
                          </div>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card Layout */}
          <div className="md:hidden">
            {filteredPayments.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground italic text-sm">
                Tidak ada transaksi ditemukan.
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {filteredPayments.map((p) => (
                  <div key={p.id} className={cn("p-4 space-y-3", p.status === "pending" && "bg-amber-500/3")}>
                    {/* Row 1: Lembaga + Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <School className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate">{p.tenant.name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{p.reference}</p>
                        </div>
                      </div>
                      {getStatusBadge(p.status)}
                    </div>

                    {/* Row 2: Amount + Details */}
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="font-bold text-primary">Rp {p.amount.toLocaleString("id-ID")}</span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="uppercase font-bold text-[10px] tracking-wider">{p.plan}</span>
                        <span>·</span>
                        {p.discountCode && (
                          <>
                            <Badge variant="outline" className="font-mono text-[9px] px-1 py-0 rounded-sm">
                              {p.discountCode.code}
                            </Badge>
                            <span>·</span>
                          </>
                        )}
                        <span>{(p.metadata as any)?.studentCount ? `${(p.metadata as any).studentCount} siswa` : "—"}</span>
                        <span>·</span>
                        <span>{new Date(p.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}</span>
                      </div>
                    </div>

                    {/* Row 3: Action */}
                    {(p.status === "pending" || p.status === "expired") && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => setCancelTarget(p)}
                          variant="outline"
                          className="flex-1 rounded-xl text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50 h-9"
                        >
                          Tolak
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setConfirmTarget(p)}
                          className="flex-[2] rounded-xl gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white border-0 h-9 text-xs font-bold shadow-md shadow-emerald-600/20"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Konfirmasi
                        </Button>
                      </div>
                    )}
                    {p.status === "paid" && (
                      <div className="flex justify-end pt-2 border-t border-border/40">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setRefundTarget(p)}
                          className="h-8 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                        >
                          Refund / Batalkan
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      {data.totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-xl"
          >
            Sebelumnya
          </Button>
          <span className="text-sm font-medium text-muted-foreground">
            Halaman {page} dari {data.totalPages}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
            disabled={page === data.totalPages}
            className="rounded-xl"
          >
            Selanjutnya
          </Button>
        </div>
      )}

      {/* Modals */}
      <ConfirmPaymentModal 
        open={!!confirmTarget} 
        onOpenChange={(o) => !o && setConfirmTarget(null)} 
        payment={confirmTarget} 
        onSuccess={fetchPayments} 
      />
      
      <CancelPaymentModal 
        open={!!cancelTarget} 
        onOpenChange={(o) => !o && setCancelTarget(null)} 
        payment={cancelTarget} 
        onSuccess={fetchPayments} 
      />
      
      <RefundPaymentModal 
        open={!!refundTarget} 
        onOpenChange={(o) => !o && setRefundTarget(null)} 
        payment={refundTarget} 
        onSuccess={fetchPayments} 
      />
    </div>
  )
}
