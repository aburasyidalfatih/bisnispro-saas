"use client"

import { use, useEffect, useState } from"react"
import { useSession } from"next-auth/react"
import { Badge } from"@/components/ui/badge"
import { Button } from"@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from"@/components/ui/tabs"
import { useToast } from"@/hooks/use-toast"
import { ArrowLeft, CheckCircle, Loader2, Wallet, CreditCard, AlertCircle, Clock, Upload, FileCheck } from"lucide-react"
import Link from"next/link"
import { format } from"date-fns"
import { id as localeId } from"date-fns/locale"

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session } = useSession()
  const { toast } = useToast()
  const tenant = session?.user?.tenants?.[0]
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [payMethod, setPayMethod] = useState<string>("WALLET")

  const fetchInvoice = async () => {
    if (!tenant) return
    setLoading(true)
    try {
      const res = await fetch(`/api/finance/invoices/${id}?tenantId=${tenant.id}`)
      setInvoice(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchInvoice() }, [id, tenant])

  const handleVerify = async (paymentId: string, action:"VERIFIED" |"REJECTED") => {
    if (!tenant) return
    setPaying(true)
    try {
      const res = await fetch(`/api/finance/invoices/${id}/pay`, {
        method:"PATCH",
        headers: {"Content-Type":"application/json" },
        body: JSON.stringify({ tenantId: tenant.id, paymentId, action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: data.message })
      fetchInvoice()
    } catch (err: any) {
      toast({ title:"Gagal", description: err.message, variant:"destructive" })
    } finally {
      setPaying(false)
    }
  }

  const statusCfg: Record<string, { label: string; color: string }> = {
    UNPAID: { label:"Belum Bayar", color:"bg-red-500/10 text-red-600 border-red-200" },
    PARTIAL: { label:"Bayar Sebagian", color:"bg-amber-500/10 text-amber-600 border-amber-200" },
    PAID: { label:"Lunas ✓", color:"bg-emerald-500/10 text-emerald-600 border-emerald-200" },
    OVERDUE: { label:"Jatuh Tempo!", color:"bg-red-600/20 text-red-700 border-red-300" },
    CANCELLED: { label:"Dibatalkan", color:"bg-slate-500/10 text-slate-500 border-slate-200" },
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  if (!invoice) return <div className="py-20 text-center text-muted-foreground">Tagihan tidak ditemukan.</div>

  const cfg = statusCfg[invoice.status] || statusCfg.UNPAID
  const walletBalance = invoice.student?.walletAccount?.balance || 0
  const progressPct = Math.min((invoice.amountPaid / invoice.amount) * 100, 100)

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/admin/finance/invoice">
          <Button variant="ghost" size="icon" className="rounded-xl"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-3">
             <div className="flex items-center gap-3">
               <h1 className="text-xl font-bold">{invoice.title}</h1>
               <Badge className={`${cfg.color} border text-xs`}>{cfg.label}</Badge>
             </div>
             {invoice.amountPaid > 0 && (
               <Link href={`/admin/finance/invoice/${id}/print`} target="_blank">
                 <Button variant="outline" size="sm" className="rounded-xl shadow-sm hidden sm:flex">
                   <FileCheck className="mr-2 h-4 w-4" /> Cetak Kwitansi (PDF)
                 </Button>
               </Link>
             )}
          </div>
          <p className="text-sm text-muted-foreground font-mono">{invoice.code}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label:"Total Tagihan", value: `Rp ${invoice.amount.toLocaleString("id-ID")}`, color:"text-foreground" },
          { label:"Sudah Dibayar", value: `Rp ${invoice.amountPaid.toLocaleString("id-ID")}`, color:"text-emerald-600" },
          { label:"Sisa Tagihan", value: `Rp ${invoice.amountDue.toLocaleString("id-ID")}`, color:"text-red-600" },
        ].map((s, i) => (
          <Card key={i} className="glass border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
              <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress bar */}
      <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
      </div>

      <Tabs defaultValue="info">
        <TabsList className="glass border-0">
          <TabsTrigger value="info">Info Tagihan</TabsTrigger>
          <TabsTrigger value="payments">Riwayat Bayar ({invoice.payments?.length || 0})</TabsTrigger>
          {invoice.installments?.length > 0 && <TabsTrigger value="installments">Cicilan</TabsTrigger>}
        </TabsList>

        {/* Info */}
        <TabsContent value="info">
          <Card className="glass border-0">
            <CardContent className="p-6 grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Row label="Nama Siswa" value={invoice.student?.name} />
                <Row label="NIS" value={invoice.student?.nis ||"—"} />
                <Row label="Kelas" value={invoice.student?.classroom?.name ||"—"} />
                <Row label="Jenis Tagihan" value={invoice.billingType?.name ||"Manual"} />
              </div>
              <div className="space-y-4">
                <Row label="Jatuh Tempo" value={format(new Date(invoice.dueDate),"d MMMM yyyy", { locale: localeId })} />
                <Row label="Auto-Debet" value={invoice.isAutoDebet ?"Aktif ✓" :"Nonaktif"} />
                <Row label="Saldo Wallet Siswa" value={`Rp ${walletBalance.toLocaleString("id-ID")}`} />
                {invoice.notes && <Row label="Catatan" value={invoice.notes} />}
              </div>
            </CardContent>
          </Card>

          {/* Admin action: bayar manual */}
          {invoice.status !=="PAID" && invoice.status !=="CANCELLED" && (
            <Card className="glass border-0 mt-4">
              <CardHeader><CardTitle className="text-sm font-bold">Catat Pembayaran (Admin)</CardTitle></CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-4">Gunakan ini untuk mencatat pembayaran tunai/transfer yang diterima langsung.</p>
                <Link href={`/admin/finance/invoice/${id}/pay`}>
                  <Button className="rounded-xl"><CreditCard className="mr-2 h-4 w-4" /> Catat Pembayaran</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Riwayat Bayar */}
        <TabsContent value="payments">
          <div className="space-y-3">
            {invoice.payments?.length === 0 ? (
              <Card className="glass border-0">
                <CardContent className="py-12 text-center text-muted-foreground text-sm">Belum ada riwayat pembayaran.</CardContent>
              </Card>
            ) : invoice.payments?.map((p: any) => (
              <Card key={p.id} className="glass border-0">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      {p.method ==="WALLET" ? <Wallet className="h-5 w-5 text-primary" /> : <CreditCard className="h-5 w-5 text-primary" />}
                    </div>
                    <div>
                      <p className="font-bold text-sm">Rp {p.amount.toLocaleString("id-ID")}</p>
                      <p className="text-xs text-muted-foreground">{p.method} · {format(new Date(p.createdAt),"d MMM yyyy HH:mm")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={
                      p.status ==="VERIFIED" ?"bg-emerald-500/10 text-emerald-600 border-emerald-200" :
                      p.status ==="REJECTED" ?"bg-red-500/10 text-red-600 border-red-200" :"bg-amber-500/10 text-amber-600 border-amber-200"
                    }>
                      {p.status ==="VERIFIED" ?"Terverifikasi" : p.status ==="REJECTED" ?"Ditolak" :"Menunggu"}
                    </Badge>
                    {(p.status ==="PENDING" || p.status ==="PENDING_VERIFICATION") && (
                      <div className="flex gap-1">
                        {p.proofUrl && (
                          <a href={p.proofUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground rounded-md h-8 px-2 text-xs text-blue-600 border-blue-200 mr-1">
                             Bukti
                          </a>
                        )}
                        <Button size="sm" variant="outline" className="h-8 px-2 text-xs text-emerald-600 border-emerald-200" disabled={paying} onClick={() => handleVerify(p.id,"VERIFIED")}>
                          <CheckCircle className="h-3.5 w-3.5 mr-1" /> Verifikasi
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 px-2 text-xs text-red-600 border-red-200" disabled={paying} onClick={() => handleVerify(p.id,"REJECTED")}>
                          Tolak
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Cicilan */}
        {invoice.installments?.length > 0 && (
          <TabsContent value="installments">
            <div className="space-y-3">
              {invoice.installments.map((ins: any, i: number) => (
                <Card key={ins.id} className="glass border-0">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm">Cicilan {i + 1} — Rp {ins.amount.toLocaleString("id-ID")}</p>
                      <p className="text-xs text-muted-foreground">Jatuh tempo: {format(new Date(ins.dueDate),"d MMM yyyy", { locale: localeId })}</p>
                    </div>
                    <Badge className={ins.status ==="PAID" ?"bg-emerald-500/10 text-emerald-600 border-emerald-200" :"bg-red-500/10 text-red-600 border-red-200"}>
                      {ins.status ==="PAID" ?"Lunas ✓" :"Belum Bayar"}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  )
}
