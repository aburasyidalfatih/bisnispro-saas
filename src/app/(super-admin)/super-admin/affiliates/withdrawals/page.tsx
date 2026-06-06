import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, CheckCircle2, XCircle, ArrowLeft, Building2, User, Landmark, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"

interface Withdrawal {
  id: string
  amount: number
  status: string
  bankName: string | null
  bankAccount: string | null
  accountName: string | null
  notes: string | null
  receiptUrl: string | null
  createdAt: string
  processedAt: string | null
  affiliate: {
    user: { name: string; email: string }
  }
}

export default function WithdrawalsPage() {
  const [data, setData] = useState<{ withdrawals: Withdrawal[], totalPages: number }>({ 
    withdrawals: [], 
    totalPages: 1
  })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("PENDING")

  const [approveTarget, setApproveTarget] = useState<Withdrawal | null>(null)
  const [rejectTarget, setRejectTarget] = useState<Withdrawal | null>(null)
  const [receiptUrl, setReceiptUrl] = useState("")
  const [rejectNotes, setRejectNotes] = useState("")
  const [processing, setProcessing] = useState(false)

  const fetchWithdrawals = useCallback(async () => {
    try {
      setLoading(true)
      const url = new URL("/api/super-admin/affiliates/withdrawals", window.location.origin)
      url.searchParams.set("page", page.toString())
      url.searchParams.set("limit", "15")
      if (statusFilter !== "all") url.searchParams.set("status", statusFilter)
      
      const res = await fetch(url.toString())
      const result = await res.json()
      setData(result)
      setLoading(false)
    } catch {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => {
    setPage(1)
  }, [statusFilter])

  useEffect(() => { 
    fetchWithdrawals()
  }, [fetchWithdrawals])

  const handleApprove = async () => {
    if (!approveTarget) return
    setProcessing(true)
    try {
      const res = await fetch(`/api/super-admin/affiliates/withdrawals/${approveTarget.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptUrl })
      })
      const result = await res.json()
      if (res.ok) {
        toast({ title: "Berhasil", description: result.message })
        setApproveTarget(null)
        setReceiptUrl("")
        fetchWithdrawals()
      } else {
        toast({ title: "Gagal", description: result.error, variant: "destructive" })
      }
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!rejectTarget) return
    if (!rejectNotes) {
      toast({ title: "Gagal", description: "Alasan penolakan wajib diisi", variant: "destructive" })
      return
    }
    setProcessing(true)
    try {
      const res = await fetch(`/api/super-admin/affiliates/withdrawals/${rejectTarget.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: rejectNotes })
      })
      const result = await res.json()
      if (res.ok) {
        toast({ title: "Berhasil", description: result.message })
        setRejectTarget(null)
        setRejectNotes("")
        fetchWithdrawals()
      } else {
        toast({ title: "Gagal", description: result.error, variant: "destructive" })
      }
    } finally {
      setProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "PAID":
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-0"><CheckCircle2 className="h-3 w-3 mr-1" /> Selesai</Badge>
      case "PENDING":
        return <Badge className="bg-amber-500/10 text-amber-600 border-0"><Clock className="h-3 w-3 mr-1" /> Menunggu</Badge>
      default:
        return <Badge className="bg-rose-500/10 text-rose-600 border-0"><XCircle className="h-3 w-3 mr-1" /> Ditolak</Badge>
    }
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-3">
        <Link href="/super-admin/affiliates">
          <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Antrian Penarikan Dana</h1>
          <p className="text-muted-foreground text-sm">Transfer komisi mitra ke rekening mereka.</p>
        </div>
      </div>

      <Card className="glass shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>Daftar Request Withdraw</CardTitle>
            <select
              className="h-9 rounded-xl border border-input bg-background px-3 text-xs outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Semua Status</option>
              <option value="PENDING">Menunggu Transfer</option>
              <option value="PAID">Selesai (Ditransfer)</option>
              <option value="FAILED">Ditolak</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted/50 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-4 py-3 font-medium">Mitra</TableHead>
                    <TableHead className="px-4 py-3 font-medium text-right">Nominal</TableHead>
                    <TableHead className="px-4 py-3 font-medium">Rekening Tujuan</TableHead>
                    <TableHead className="px-4 py-3 font-medium">Tanggal</TableHead>
                    <TableHead className="px-4 py-3 font-medium text-center">Status</TableHead>
                    <TableHead className="px-4 py-3 font-medium text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.withdrawals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="px-4 py-8 text-center text-muted-foreground italic">Tidak ada data penarikan.</TableCell>
                    </TableRow>
                  ) : (
                    data.withdrawals.map((w) => (
                      <TableRow key={w.id} className="bg-background/50 hover:bg-muted/50 transition-colors">
                        <TableCell className="px-4 py-4 whitespace-nowrap">
                          <div className="font-bold text-foreground">{w.affiliate.user.name}</div>
                          <div className="text-xs text-muted-foreground">{w.affiliate.user.email}</div>
                        </TableCell>
                        <TableCell className="px-4 py-4 text-right">
                          <div className="font-bold text-lg text-primary">Rp {w.amount.toLocaleString('id-ID')}</div>
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-sm flex items-center gap-1.5"><Landmark className="h-3 w-3 text-muted-foreground"/> {w.bankName}</span>
                            <span className="text-xs font-mono">{w.bankAccount}</span>
                            <span className="text-[10px] text-muted-foreground uppercase">{w.accountName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4 text-xs text-muted-foreground">
                          {new Date(w.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </TableCell>
                        <TableCell className="px-4 py-4 text-center">
                          {getStatusBadge(w.status)}
                        </TableCell>
                        <TableCell className="px-4 py-4 text-right">
                          {w.status === "PENDING" && (
                            <div className="flex items-center justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setRejectTarget(w)}
                                className="rounded-xl h-8 px-3 text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50"
                              >
                                Tolak
                              </Button>
                              <Button 
                                size="sm" 
                                onClick={() => setApproveTarget(w)}
                                className="rounded-xl gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white border-0 h-8 px-3 text-xs font-bold shadow-md shadow-emerald-600/20"
                              >
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Proses
                              </Button>
                            </div>
                          )}
                          {w.status === "PAID" && w.receiptUrl && (
                            <a href={w.receiptUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">Lihat Bukti</a>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {data.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-6">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-xl">Sebelumnya</Button>
              <span className="text-sm font-medium text-muted-foreground">Halaman {page} dari {data.totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages} className="rounded-xl">Selanjutnya</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={!!approveTarget} onOpenChange={(o) => !o && setApproveTarget(null)}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
              </div>
              Proses Pencairan Dana
            </DialogTitle>
            <DialogDescription>
              Silakan lakukan transfer ke rekening berikut, lalu masukkan link bukti transfer (opsional) untuk menyelesaikan pencairan.
            </DialogDescription>
          </DialogHeader>
          
          {approveTarget && (
            <div className="py-2 space-y-4">
              <div className="rounded-2xl bg-muted/50 border p-4 space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Nominal Transfer</span>
                  <span className="font-bold text-xl text-primary">Rp {approveTarget.amount.toLocaleString("id-ID")}</span>
                </div>
                <hr className="border-border" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bank</span>
                  <span className="font-bold">{approveTarget.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">No. Rekening</span>
                  <span className="font-mono font-bold tracking-wider">{approveTarget.bankAccount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Atas Nama</span>
                  <span className="font-bold uppercase">{approveTarget.accountName}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Link Bukti Transfer (Opsional)</label>
                <Input 
                  placeholder="https://... (Link GDrive/Screenshot)"
                  className="rounded-xl"
                  value={receiptUrl}
                  onChange={(e) => setReceiptUrl(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setApproveTarget(null)} disabled={processing} className="rounded-xl">Batal</Button>
            <Button onClick={handleApprove} disabled={processing} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white border-0 gap-2">
              {processing ? "Memproses..." : "Ya, Tandai Selesai"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10">
                <XCircle className="h-5 w-5" />
              </div>
              Tolak Pencairan
            </DialogTitle>
            <DialogDescription>
              Penolakan akan membatalkan request ini. Saldo mitra <strong>tidak</strong> akan terpotong.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-2 space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Alasan Penolakan <span className="text-rose-500">*</span></label>
            <Textarea 
              placeholder="Contoh: Nomor rekening tidak valid / Nama tidak sesuai..."
              className="rounded-xl resize-none h-24"
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectTarget(null)} disabled={processing} className="rounded-xl">Batal</Button>
            <Button onClick={handleReject} disabled={processing || !rejectNotes} className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white border-0 gap-2">
              {processing ? "Memproses..." : "Ya, Tolak"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
