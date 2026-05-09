"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wallet, ArrowDownLeft, ArrowUpRight, Loader2, History, Plus } from "lucide-react"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function OrtuWalletHistoryPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetch(`/api/wallet/history?page=${page}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => toast({ title: "Gagal memuat riwayat", variant: "destructive" }))
      .finally(() => setLoading(false))
  }, [page])

  const typeCfg: Record<string, { label: string; color: string; icon: any; sign: string }> = {
    TOPUP: { label: "Top Up", color: "text-emerald-600 bg-emerald-500/10", icon: ArrowDownLeft, sign: "+" },
    PAYMENT: { label: "Pembayaran", color: "text-red-600 bg-red-500/10", icon: ArrowUpRight, sign: "-" },
    WITHDRAWAL: { label: "Penarikan", color: "text-amber-600 bg-amber-500/10", icon: ArrowUpRight, sign: "-" },
    REFUND: { label: "Refund", color: "text-blue-600 bg-blue-500/10", icon: ArrowDownLeft, sign: "+" },
  }

  return (
    <div className="pb-12 space-y-5">
      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-b-[2.5rem] pt-8 pb-20 px-6">
        <h1 className="text-white font-bold text-xl mb-6">Tabungan Siswa</h1>
        <div className="text-center">
          <p className="text-white/70 text-sm mb-1">Saldo Anda</p>
          <p className="text-white text-4xl font-black">
            {loading ? "—" : `Rp ${data?.wallet?.balance?.toLocaleString("id-ID") || 0}`}
          </p>
        </div>
      </div>

      <div className="px-5 -mt-10 space-y-4">
        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/ortu/wallet/topup">
            <div className="glass rounded-2xl p-4 text-center cursor-pointer hover:border-primary/30 hover:shadow-md transition-all border border-transparent">
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-2">
                <Plus className="h-6 w-6 text-indigo-600" />
              </div>
              <p className="font-bold text-sm">Top Up</p>
              <p className="text-xs text-muted-foreground">Isi saldo wallet</p>
            </div>
          </Link>
          <Link href="/ortu/tagihan">
            <div className="glass rounded-2xl p-4 text-center cursor-pointer hover:border-primary/30 hover:shadow-md transition-all border border-transparent">
              <div className="h-12 w-12 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-2">
                <ArrowUpRight className="h-6 w-6 text-red-600" />
              </div>
              <p className="font-bold text-sm">Tagihan</p>
              <p className="text-xs text-muted-foreground">Bayar tagihan</p>
            </div>
          </Link>
        </div>

        {/* Riwayat */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <History className="h-4 w-4 text-muted-foreground" />
            <p className="font-bold text-sm">Riwayat Transaksi</p>
            {data?.meta?.total && <span className="text-xs text-muted-foreground">({data.meta.total} transaksi)</span>}
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : !data?.data?.length ? (
            <div className="py-12 text-center text-muted-foreground text-sm">Belum ada transaksi.</div>
          ) : (
            <div className="space-y-2">
              {data.data.map((tx: any) => {
                const cfg = typeCfg[tx.type] || typeCfg.PAYMENT
                const Icon = cfg.icon
                const isIn = cfg.sign === "+"
                return (
                  <Card key={tx.id} className="glass border-0 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 ${cfg.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{tx.description || cfg.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(tx.createdAt), "d MMM yyyy, HH:mm", { locale: localeId })}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={cn("font-black text-base", isIn ? "text-emerald-600" : "text-red-500")}>
                          {cfg.sign}Rp {tx.amount.toLocaleString("id-ID")}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Saldo: Rp {tx.balanceAfter?.toLocaleString("id-ID")}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              {/* Pagination */}
              {data.meta.totalPages > 1 && (
                <div className="flex justify-center gap-3 pt-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="rounded-xl">
                    ← Sebelumnya
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= data.meta.totalPages} onClick={() => setPage(p => p + 1)} className="rounded-xl">
                    Selanjutnya →
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
