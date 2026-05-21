"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  FileText, ArrowLeft, Clock, CheckCircle2,
  XCircle, AlertCircle, Copy, CheckCheck, MessageCircle, Download
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface Payment {
  id: string
  reference: string
  amount: number
  status: string
  plan: string
  createdAt: string
  expiredAt: string | null
  paidAt: string | null
  metadata: {
    studentCount?: number
    pricePerStudent?: number
    tenantName?: string
  } | null
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Menunggu Pembayaran", color: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400", icon: Clock },
  paid:    { label: "Lunas", color: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400", icon: CheckCircle2 },
  failed:  { label: "Gagal", color: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400", icon: XCircle },
  expired: { label: "Kadaluarsa", color: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400", icon: XCircle },
  cancelled: { label: "Dibatalkan", color: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400", icon: XCircle },
}

export default function BillingHistoryPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [manualPayment, setManualPayment] = useState<{ bank: string; number: string; name: string; waNumber: string } | null>(null)

  const fetchHistory = () => {
    fetch("/api/tenant/billing/history", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        setPayments(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchHistory()
    // Fetch rekening pembayaran dari platform settings
    fetch("/api/tenant/billing", { cache: "no-store" })
      .then(r => r.json())
      .then(data => {
        if (data.manualPayment) setManualPayment(data.manualPayment)
      })
      .catch(() => {})
  }, [])

  const bank = manualPayment?.bank || "Bank Pembayaran"
  const accNumber = manualPayment?.number || "-"
  const accName = manualPayment?.name || "Nama Pemilik"
  const waNumber = manualPayment?.waNumber || "6281234567890"

  const copyRef = (ref: string, id: string) => {
    navigator.clipboard.writeText(ref)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleCancel = async (paymentId: string) => {
    if (!confirm("Apakah Anda yakin ingin membatalkan invoice ini?")) return
    setCancellingId(paymentId)
    try {
      const res = await fetch("/api/tenant/billing/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId })
      })
      if (res.ok) fetchHistory()
    } catch (e) {
      console.error(e)
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="rounded-xl h-9 w-9 shrink-0" asChild>
          <Link href="/admin/billing"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Riwayat Invoice</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Daftar semua tagihan dan pembayaran Anda.</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <Card className="glass border-0 shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-lg">Belum ada invoice</p>
              <p className="text-muted-foreground text-sm mt-1">Invoice akan muncul di sini setelah Anda melakukan request upgrade.</p>
            </div>
            <Button className="rounded-xl btn-gradient text-white border-0 mt-2" asChild>
              <Link href="/admin/billing">Upgrade Paket</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => {
            const st = statusConfig[payment.status] || statusConfig.pending
            const StatusIcon = st.icon
            const meta = payment.metadata || {}

            return (
              <Card key={payment.id} className="glass border-0 shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className={cn(
                  "h-1 w-full",
                  payment.status === "paid" ? "bg-emerald-500" :
                  payment.status === "pending" ? "bg-amber-400" : "bg-gray-300"
                )} />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={cn("mt-0.5 h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border", st.color)}>
                        <StatusIcon className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-bold">{payment.reference}</span>
                          <button
                            onClick={() => copyRef(payment.reference, payment.id)}
                            className="text-muted-foreground hover:text-foreground transition"
                          >
                            {copiedId === payment.id ? <CheckCheck className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(payment.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric", month: "long", year: "numeric",
                            hour: "2-digit", minute: "2-digit"
                          })}
                        </p>
                        {meta.studentCount ? (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {meta.studentCount} siswa × Rp {Number(meta.pricePerStudent || 0).toLocaleString("id-ID")}
                          </p>
                        ) : meta.type === "AI_QUOTA" ? (
                          <p className="text-xs text-muted-foreground mt-0.5 font-medium text-blue-600">
                            + {Number(meta.aiTokens || 0).toLocaleString("id-ID")} Token AI
                          </p>
                        ) : null}
                      </div>
                    </div>

                    {/* Right */}
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-primary">
                        Rp {payment.amount.toLocaleString("id-ID")}
                      </p>
                      <Badge className={cn("text-[10px] border mt-1", st.color)} variant="outline">
                        {st.label}
                      </Badge>
                      {payment.status === "pending" && payment.expiredAt && (
                        <p className="text-[10px] text-amber-600 mt-1 flex items-center justify-end gap-1">
                          <Clock className="h-3 w-3" />
                          Exp: {new Date(payment.expiredAt).toLocaleString("id-ID", {
                            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                          })}
                        </p>
                      )}
                      {payment.status === "paid" && payment.paidAt && (
                        <p className="text-[10px] text-emerald-600 mt-1">
                          Dibayar: {new Date(payment.paidAt).toLocaleDateString("id-ID")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end mt-4 pt-4 border-t border-border/40 mb-1">
                    <Button size="sm" variant="outline" className="gap-1.5 h-8 rounded-lg text-primary hover:bg-primary/5 hover:text-primary border-primary/20" asChild>
                      <a href={`/invoice/${payment.id}`} target="_blank" rel="noopener noreferrer">
                        <Download className="h-3.5 w-3.5" /> Download Invoice
                      </a>
                    </Button>
                  </div>

                  {payment.status === "pending" && (
                    <>
                      <Separator className="my-4" />
                      
                      <div className="bg-slate-50 border rounded-xl p-3.5 space-y-3 mb-4 dark:bg-slate-800/50">
                        <p className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">Rekening Pembayaran</p>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-sm">{bank}</p>
                            <p className="text-muted-foreground text-[11px]">a.n {accName}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm">{accNumber}</span>
                            <button onClick={() => copyRef(accNumber.replace(/\s/g, ""), "acc-" + payment.id)} className="text-muted-foreground hover:text-primary transition">
                              {copiedId === "acc-" + payment.id ? <CheckCheck className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 dark:bg-amber-900/10 dark:border-amber-800/30 dark:text-amber-400">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                          <span>Hubungi admin via WhatsApp dengan menyertakan nomor invoice di atas untuk konfirmasi pembayaran.</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 rounded-lg text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900/50 dark:hover:bg-rose-950/30"
                            onClick={() => handleCancel(payment.id)}
                            disabled={cancellingId === payment.id}
                          >
                            {cancellingId === payment.id ? "Membatalkan..." : "Batalkan"}
                          </Button>
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 h-8 rounded-lg" asChild>
                            <a href={`https://wa.me/${waNumber}?text=Halo%20Admin%2C%20saya%20ingin%20konfirmasi%20pembayaran%20untuk%20invoice%20${payment.reference}`} target="_blank" rel="noopener noreferrer">
                              <MessageCircle className="h-3.5 w-3.5" /> Konfirmasi WA
                            </a>
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
