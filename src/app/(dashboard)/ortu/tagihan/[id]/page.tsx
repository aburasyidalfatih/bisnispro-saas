"use client"

import { use, useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Wallet, Loader2, CreditCard, CheckCircle } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

export default function OrtuTagihanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session } = useSession()
  const { toast } = useToast()
  const router = useRouter()
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    fetch(`/api/ortu/invoices/${id}`)
      .then(r => r.json())
      .then(setInvoice)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const handlePayWithWallet = async () => {
    if (!invoice) return
    const wallet = invoice.student?.walletAccount
    if (!wallet) return toast({ title: "Siswa tidak memiliki wallet", variant: "destructive" })
    if (wallet.balance < invoice.amountDue) return toast({ title: "Saldo tidak mencukupi", variant: "destructive" })

    setPaying(true)
    try {
      const res = await fetch(`/api/finance/invoices/${id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: invoice.student.tenantId,
          amount: invoice.amountDue,
          method: "WALLET",
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: "Pembayaran berhasil!", description: "Tagihan telah dibayar dari saldo Tabungan." })
      router.push("/ortu/tagihan")
    } catch (err: any) {
      toast({ title: "Gagal", description: err.message, variant: "destructive" })
    } finally {
      setPaying(false)
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  if (!invoice) return <div className="py-20 text-center text-muted-foreground">Tagihan tidak ditemukan.</div>

  const walletBalance = invoice.student?.walletAccount?.balance || 0
  const canPayWithWallet = walletBalance >= invoice.amountDue && invoice.status !== "PAID"
  const progressPct = Math.min((invoice.amountPaid / invoice.amount) * 100, 100)

  return (
    <div className="pb-12 space-y-5">
      <div className="bg-primary rounded-b-[2.5rem] pt-8 pb-16 px-6">
        <Link href="/ortu/tagihan">
          <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl mb-3 -ml-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-white font-bold text-xl">{invoice.title}</h1>
        <p className="text-white/70 text-sm font-mono">{invoice.code}</p>
      </div>

      <div className="px-5 -mt-10 space-y-4">
        {/* Kartu Nominal */}
        <Card className="glass border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Tagihan</p>
                <p className="text-3xl font-black">Rp {invoice.amount.toLocaleString("id-ID")}</p>
              </div>
              <Badge className={
                invoice.status === "PAID" ? "bg-emerald-500/10 text-emerald-600 border-emerald-200" :
                invoice.status === "PARTIAL" ? "bg-amber-500/10 text-amber-600 border-amber-200" :
                "bg-red-500/10 text-red-600 border-red-200"
              }>
                {invoice.status === "PAID" ? "Lunas ✓" : invoice.status === "PARTIAL" ? "Sebagian" : "Belum Bayar"}
              </Badge>
            </div>

            {/* Progress */}
            <div className="w-full bg-muted rounded-full h-2 mb-3 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700" style={{ width: `${progressPct}%` }} />
            </div>

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Dibayar: <strong className="text-emerald-600">Rp {invoice.amountPaid.toLocaleString("id-ID")}</strong></span>
              <span>Sisa: <strong className="text-red-500">Rp {invoice.amountDue.toLocaleString("id-ID")}</strong></span>
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="glass border-0">
          <CardContent className="p-5 space-y-3">
            <InfoRow label="Siswa" value={invoice.student?.name} />
            <InfoRow label="Kelas" value={invoice.student?.classroom?.name || "—"} />
            <InfoRow label="Jatuh Tempo" value={format(new Date(invoice.dueDate), "d MMMM yyyy", { locale: localeId })} />
            {invoice.notes && <InfoRow label="Catatan" value={invoice.notes} />}
          </CardContent>
        </Card>

        {/* Saldo Wallet */}
        <Card className="glass border-0 bg-indigo-500/5 border-indigo-500/10">
          <CardContent className="p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saldo Tabungan</p>
                <p className="font-bold text-indigo-600">Rp {walletBalance.toLocaleString("id-ID")}</p>
              </div>
            </div>
            {!canPayWithWallet && invoice.status !== "PAID" && (
              <p className="text-xs text-red-500 font-medium">Saldo kurang</p>
            )}
          </CardContent>
        </Card>

        {/* Bayar */}
        {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && (
          <div className="space-y-3">
            <Button
              className="w-full rounded-xl h-14 text-base font-bold bg-indigo-600 hover:bg-indigo-700"
              disabled={!canPayWithWallet || paying}
              onClick={handlePayWithWallet}
            >
              {paying
                ? <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                : <><Wallet className="mr-2 h-5 w-5" /> Bayar dengan Wallet (Rp {invoice.amountDue.toLocaleString("id-ID")})</>
              }
            </Button>
            <Button variant="outline" className="w-full rounded-xl h-12">
              <CreditCard className="mr-2 h-4 w-4" /> Bayar via Transfer / VA
            </Button>
          </div>
        )}

        {invoice.status === "PAID" && (
          <div className="flex items-center justify-center gap-3 py-6 text-emerald-600">
            <CheckCircle className="h-8 w-8" />
            <p className="font-bold text-xl">Tagihan Lunas!</p>
          </div>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  )
}
