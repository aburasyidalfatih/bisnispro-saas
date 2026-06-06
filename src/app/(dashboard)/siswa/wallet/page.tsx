"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Wallet, ArrowUpRight, ArrowDownLeft, Coffee, Utensils, ShoppingBag, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function WalletSiswaPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const res = await fetch("/api/siswa/wallet")
        if (res.ok) {
          setData(await res.json())
        }
      } catch (e) {
        console.error("Failed to load wallet data", e)
      } finally {
        setLoading(false)
      }
    }
    fetchWallet()
  }, [])

  if (loading) {
    return <div className="h-[100dvh] w-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
  }

  const transactions = data?.transactions?.length ? data.transactions : []

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()
    
    if (isToday) return "Hari Ini"
    
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const isYesterday = date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear()
    
    if (isYesterday) return "Kemarin"
    
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header Wallet */}
      <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-lg shadow-indigo-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-indigo-200" />
              <span className="text-sm text-indigo-200 font-medium">Tabungan Siswa</span>
            </div>
            <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm border border-white/20">
              NISN: {data?.nisn || "00000000"}
            </div>
          </div>
          
          <p className="text-sm font-medium text-indigo-100 mb-1">Total Saldo Aktif</p>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold">Rp</span>
            <span className="text-4xl font-black tracking-tight">{(data?.balance || 0).toLocaleString('id-ID')}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <Button className="bg-white text-indigo-600 rounded-xl py-3 font-bold text-sm shadow-sm flex items-center justify-center gap-2">
              <ArrowDownLeft className="w-4 h-4" /> Minta Saldo
            </Button>
            <Button className="bg-indigo-500/50 text-white rounded-xl py-3 font-bold text-sm border border-indigo-400 backdrop-blur-sm flex items-center justify-center gap-2">
              Lihat QR Code
            </Button>
          </div>
        </div>
      </div>

      {/* Riwayat Transaksi */}
      <div>
        <div className="flex items-center justify-between mb-3 ml-1 mr-1">
          <h3 className="font-bold text-slate-800">Riwayat Transaksi</h3>
          <span className="text-xs font-bold text-indigo-600">Lihat Semua</span>
        </div>
        
        <Card className="glass border-0 shadow-sm overflow-hidden">
          <CardContent className="p-0 divide-y divide-slate-100">
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-medium text-sm">Belum ada transaksi bulan ini.</div>
            ) : (
              transactions.map((item: any, idx: number) => {
                const isOut = item.type === 'WITHDRAWAL' || item.type === 'PAYMENT'
                const typeIcon = isOut ? Utensils : ArrowDownLeft
                const colorStr = isOut ? "text-orange-500" : "text-emerald-500"

                return (
                  <div key={idx} className="p-4 bg-white hover:bg-slate-50 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border ${colorStr}`}>
                        <ArrowDownLeft className={`w-5 h-5 ${isOut ? 'rotate-180' : ''}`} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{item.description || "Transaksi Tabungan"}</h4>
                        <p className="text-xs font-medium text-muted-foreground mt-0.5">{formatDate(item.createdAt)} • {formatTime(item.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-black ${!isOut ? 'text-emerald-500' : 'text-slate-800'}`}>
                        {!isOut ? '+' : '-'} Rp {item.amount.toLocaleString('id-ID')}
                      </span>
                      <p className="text-[10px] font-bold text-muted-foreground mt-0.5 uppercase tracking-wider">{item.type}</p>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
