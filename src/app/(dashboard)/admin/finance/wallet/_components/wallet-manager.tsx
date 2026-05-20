"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wallet, Users, AlertCircle, ArrowUpRight, ArrowDownRight, Clock, CheckCircle, XCircle, Search, ExternalLink } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { verifyManualTopup, rejectManualTopup } from "@/features/finance/actions/wallet-admin.action"
import { toast } from "@/hooks/use-toast"

export function WalletManager({ tenantId, wallets, pendingTopups, transactions, stats }: any) {
  const [activeTab, setActiveTab] = useState<"overview" | "pending" | "history">("overview")
  const [search, setSearch] = useState("")
  const [verifyingId, setVerifyingId] = useState<string | null>(null)

  const filteredWallets = wallets.filter((w: any) => 
    w.student.name.toLowerCase().includes(search.toLowerCase()) || 
    (w.student.nisn && w.student.nisn.includes(search))
  )

  const handleVerify = async (paymentId: string) => {
    setVerifyingId(paymentId)
    const res = await verifyManualTopup(paymentId, tenantId)
    setVerifyingId(null)
    if (res.success) {
       toast({ title: "Berhasil", description: "Top up manual telah disetujui. Saldo siswa bertambah." })
    } else {
       toast({ title: "Gagal", description: (res as any).error, variant: "destructive" })
    }
  }

  const handleReject = async (paymentId: string) => {
    setVerifyingId(paymentId)
    const res = await rejectManualTopup(paymentId, "Bukti transfer tidak valid atau dana belum masuk.", tenantId)
    setVerifyingId(null)
    if (res.success) {
       toast({ title: "Ditolak", description: "Top up manual telah ditolak." })
    } else {
       toast({ title: "Gagal", description: (res as any).error, variant: "destructive" })
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                <Wallet className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Saldo Siswa</p>
                <h3 className="text-2xl font-bold">Rp {stats.totalBalance.toLocaleString("id-ID")}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Akun Dompet Aktif</p>
                <h3 className="text-2xl font-bold">{stats.activeWallets} <span className="text-sm font-normal text-muted-foreground">siswa</span></h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={cn("border-0 shadow-md transition-colors cursor-pointer", stats.pendingCount > 0 ? "bg-amber-50 border-amber-200" : "")} onClick={() => setActiveTab("pending")}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", stats.pendingCount > 0 ? "bg-amber-500/20 text-amber-600" : "bg-muted text-muted-foreground")}>
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Verifikasi Menunggu</p>
                <h3 className="text-2xl font-bold">{stats.pendingCount} <span className="text-sm font-normal text-muted-foreground">top up</span></h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 border-b">
         <button 
           onClick={() => setActiveTab("overview")}
           className={cn("px-4 py-3 text-sm font-medium border-b-2 transition-colors", activeTab === "overview" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}
         >
            Daftar Tabungan
         </button>
         <button 
           onClick={() => setActiveTab("pending")}
           className={cn("px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2", activeTab === "pending" ? "border-amber-500 text-amber-600" : "border-transparent text-muted-foreground hover:text-foreground")}
         >
            Menunggu Verifikasi
            {stats.pendingCount > 0 && (
               <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{stats.pendingCount}</span>
            )}
         </button>
         <button 
           onClick={() => setActiveTab("history")}
           className={cn("px-4 py-3 text-sm font-medium border-b-2 transition-colors", activeTab === "history" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}
         >
            Riwayat Transaksi Global
         </button>
      </div>

      {/* Tab Content: Overview */}
      {activeTab === "overview" && (
         <Card className="border-0 shadow-md">
            <div className="p-4 border-b flex items-center justify-between">
               <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                     placeholder="Cari nama atau NISN..." 
                     className="pl-9 bg-muted/50 border-transparent focus:border-primary focus:bg-background transition-colors"
                     value={search}
                     onChange={(e) => setSearch(e.target.value)}
                  />
               </div>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                     <tr>
                        <th className="px-6 py-4 font-medium">Siswa</th>
                        <th className="px-6 py-4 font-medium">Orang Tua</th>
                        <th className="px-6 py-4 font-medium text-right">Saldo Dompet</th>
                        <th className="px-6 py-4 font-medium text-center">Aksi</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y">
                     {filteredWallets.length === 0 ? (
                        <tr>
                           <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                              Tidak ada data tabungan yang ditemukan.
                           </td>
                        </tr>
                     ) : (
                        filteredWallets.map((w: any) => (
                           <tr key={w.id} className="hover:bg-muted/30 transition-colors">
                              <td className="px-6 py-4">
                                 <p className="font-semibold text-foreground">{w.student.name}</p>
                                 <p className="text-xs text-muted-foreground">NISN: {w.student.nisn || "-"}</p>
                              </td>
                              <td className="px-6 py-4">
                                 {w.student.parents?.[0]?.user ? (
                                    <>
                                       <p className="font-medium">{w.student.parents[0].user.name}</p>
                                       <p className="text-xs text-muted-foreground">{w.student.parents[0].user.phone || "-"}</p>
                                    </>
                                 ) : (
                                    <span className="text-xs text-muted-foreground italic">Belum terhubung ortu</span>
                                 )}
                              </td>
                              <td className="px-6 py-4 text-right">
                                 <p className="font-mono font-bold text-base text-primary">Rp {w.balance.toLocaleString("id-ID")}</p>
                              </td>
                              <td className="px-6 py-4 text-center">
                                 <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs">
                                    Lihat Detail
                                 </Button>
                              </td>
                           </tr>
                        ))
                     )}
                  </tbody>
               </table>
            </div>
         </Card>
      )}

      {/* Tab Content: Pending */}
      {activeTab === "pending" && (
         <Card className="border-0 shadow-md">
            <CardHeader className="border-b bg-amber-50/50 pb-4">
               <CardTitle className="text-amber-800 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" /> Verifikasi Pembayaran Manual
               </CardTitle>
               <CardDescription className="text-amber-700/70">
                  Cek mutasi rekening sekolah Anda sebelum menyetujui transaksi ini. Jika disetujui, saldo siswa akan otomatis bertambah.
               </CardDescription>
            </CardHeader>
            <div className="divide-y">
               {pendingTopups.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                     <CheckCircle className="h-12 w-12 text-emerald-500 mb-3 opacity-50" />
                     <p>Tidak ada pembayaran yang menunggu verifikasi.</p>
                  </div>
               ) : (
                  pendingTopups.map((p: any) => {
                     const meta = p.metadata as any
                     return (
                        <div key={p.id} className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between hover:bg-muted/20 transition-colors">
                           <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                 <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Menunggu</span>
                                 <span className="text-xs text-muted-foreground font-mono">{p.reference}</span>
                              </div>
                              <p className="font-bold text-lg">Rp {p.amount.toLocaleString("id-ID")}</p>
                              <p className="text-sm">Oleh: <span className="font-semibold">{meta.customerName}</span></p>
                              <p className="text-xs text-muted-foreground">Ke rekening: <strong>{meta.bankName}</strong> ({meta.accountNumber})</p>
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                 <Clock className="h-3 w-3" />
                                 Diunggah pada {format(new Date(p.updatedAt), "dd MMM yyyy HH:mm", { locale: id })}
                              </p>
                           </div>
                           
                           <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                              {meta.proofUrl ? (
                                 <a 
                                    href={meta.proofUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-sm font-semibold transition-colors border border-blue-200 w-full md:w-auto"
                                 >
                                    <ExternalLink className="h-4 w-4" /> Lihat Bukti Transfer
                                 </a>
                              ) : (
                                 <span className="text-xs text-red-500 italic">Bukti transfer belum diupload</span>
                              )}

                              <div className="flex items-center gap-2 w-full md:w-auto">
                                 <ConfirmDialog 
                                    trigger={
                                       <Button variant="outline" className="w-full md:w-auto border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-xl" disabled={verifyingId === p.id}>
                                          Tolak
                                       </Button>
                                    }
                                    title="Tolak Pembayaran?"
                                    description="Pembayaran ini akan ditandai gagal. Saldo siswa tidak akan bertambah."
                                    confirmText="Ya, Tolak"
                                    onConfirm={() => handleReject(p.id)}
                                 />
                                 <ConfirmDialog 
                                    trigger={
                                       <Button className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl" disabled={verifyingId === p.id}>
                                          {verifyingId === p.id ? "Memproses..." : "Setujui & Tambah Saldo"}
                                       </Button>
                                    }
                                    title="Setujui Pembayaran?"
                                    description={`Anda yakin dana sebesar Rp ${p.amount.toLocaleString("id-ID")} sudah masuk ke rekening sekolah? Saldo dompet siswa akan otomatis bertambah setelah disetujui.`}
                                    confirmText="Ya, Setujui"
                                    onConfirm={() => handleVerify(p.id)}
                                 />
                              </div>
                           </div>
                        </div>
                     )
                  })
               )}
            </div>
         </Card>
      )}

      {/* Tab Content: History */}
      {activeTab === "history" && (
         <Card className="border-0 shadow-md">
            <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                     <tr>
                        <th className="px-6 py-4 font-medium">Tanggal</th>
                        <th className="px-6 py-4 font-medium">Siswa</th>
                        <th className="px-6 py-4 font-medium">Jenis Mutasi</th>
                        <th className="px-6 py-4 font-medium">Deskripsi</th>
                        <th className="px-6 py-4 font-medium text-right">Nominal</th>
                        <th className="px-6 py-4 font-medium text-right">Saldo Akhir</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y">
                     {transactions.length === 0 ? (
                        <tr>
                           <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                              Belum ada riwayat transaksi.
                           </td>
                        </tr>
                     ) : (
                        transactions.map((t: any) => (
                           <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-xs text-muted-foreground">
                                 {format(new Date(t.createdAt), "dd MMM yyyy HH:mm", { locale: id })}
                              </td>
                              <td className="px-6 py-4 font-medium">
                                 {t.wallet.student.name}
                              </td>
                              <td className="px-6 py-4">
                                 {t.type === "DEPOSIT" ? (
                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                                       <ArrowDownRight className="h-3 w-3" /> Masuk (Top Up)
                                    </span>
                                 ) : t.type === "WITHDRAWAL" ? (
                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                                       <ArrowUpRight className="h-3 w-3" /> Tarik Tunai
                                    </span>
                                 ) : (
                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                       <ArrowUpRight className="h-3 w-3" /> Bayar Tagihan
                                    </span>
                                 )}
                              </td>
                              <td className="px-6 py-4 text-xs">
                                 {t.description}
                                 {t.referenceId && <span className="block text-[10px] text-muted-foreground mt-0.5">{t.referenceId}</span>}
                              </td>
                              <td className="px-6 py-4 text-right font-mono font-bold">
                                 <span className={t.type === "DEPOSIT" ? "text-emerald-600" : "text-destructive"}>
                                    {t.type === "DEPOSIT" ? "+" : "-"}Rp {t.amount.toLocaleString("id-ID")}
                                 </span>
                              </td>
                              <td className="px-6 py-4 text-right font-mono">
                                 Rp {t.balanceAfter.toLocaleString("id-ID")}
                              </td>
                           </tr>
                        ))
                     )}
                  </tbody>
               </table>
            </div>
         </Card>
      )}
    </div>
  )
}
