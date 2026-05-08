"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Wallet, CreditCard, ArrowRight, Loader2, Receipt, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { useRouter } from "next/navigation"

type Invoice = {
  id: string; code: string; title: string; amount: number
  amountPaid: number; amountDue: number; status: string; dueDate: string
}

export default function OrtuTagihanPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await fetch("/api/ortu/invoices")
        const data = await res.json()
        setInvoices(data || [])
      } catch {
        toast({ title: "Gagal memuat tagihan", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    if (session?.user) fetchInvoices()
  }, [session])

  const statusCfg: Record<string, { label: string; color: string }> = {
    UNPAID: { label: "Belum Bayar", color: "bg-red-500/10 text-red-600 border-red-200" },
    PARTIAL: { label: "Bayar Sebagian", color: "bg-amber-500/10 text-amber-600 border-amber-200" },
    PAID: { label: "Lunas", color: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
    OVERDUE: { label: "Jatuh Tempo!", color: "bg-red-600/20 text-red-700 border-red-300" },
  }

  const unpaid = invoices.filter(i => ["UNPAID", "PARTIAL", "OVERDUE"].includes(i.status))
  const totalDue = unpaid.reduce((acc, i) => acc + i.amountDue, 0)

  return (
    <div className="pb-10 space-y-5">
      <div className="bg-primary rounded-b-[2.5rem] pt-8 pb-16 px-6">
        <h1 className="text-white font-bold text-xl mb-1">Tagihan Saya</h1>
        <p className="text-white/70 text-sm">Pantau dan bayar tagihan sekolah dengan mudah.</p>
      </div>

      <div className="px-5 -mt-10 space-y-4">
        {/* Alert total tagihan */}
        {totalDue > 0 && (
          <div className="bg-red-500 rounded-2xl p-4 text-white shadow-lg shadow-red-500/30">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 shrink-0" />
              <div>
                <p className="text-sm font-medium opacity-80">Total Tagihan Aktif</p>
                <p className="text-2xl font-black">Rp {totalDue.toLocaleString("id-ID")}</p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : invoices.length === 0 ? (
          <Card className="glass border-0">
            <CardContent className="py-16 text-center">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Belum ada tagihan.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {invoices.map(inv => {
              const cfg = statusCfg[inv.status] || statusCfg.UNPAID
              const canPay = ["UNPAID", "PARTIAL", "OVERDUE"].includes(inv.status)
              return (
                <Card key={inv.id} className="glass border-0 shadow-sm overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <p className="font-bold text-sm">{inv.title}</p>
                        <p className="text-xs text-muted-foreground font-mono">{inv.code}</p>
                      </div>
                      <Badge className={`${cfg.color} border text-[10px] shrink-0 ml-2`}>{cfg.label}</Badge>
                    </div>
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Nominal</p>
                        <p className="font-black text-lg">Rp {inv.amount.toLocaleString("id-ID")}</p>
                      </div>
                      {inv.amountPaid > 0 && (
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Sisa</p>
                          <p className="font-bold text-red-500">Rp {inv.amountDue.toLocaleString("id-ID")}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Jatuh Tempo: {format(new Date(inv.dueDate), "d MMM yyyy", { locale: localeId })}
                      </p>
                      {canPay && (
                        <Link href={`/ortu/tagihan/${inv.id}`}>
                          <Button size="sm" className="rounded-xl h-8 text-xs">
                            Bayar <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
