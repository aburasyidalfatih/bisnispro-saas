"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { ChevronLeft, Receipt, Wallet, CreditCard, Building, Info, ShieldCheck, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { cn } from "@/lib/utils"

export function CheckoutForm({ invoice, wallet, paymentChannels, manualBanks, user }: any) {
  const router = useRouter()
  const { toast } = useToast()

  const [paying, setPaying] = useState(false)
  const [selectedChannel, setSelectedChannel] = useState<string>("WALLET")
  const [autoDebit, setAutoDebit] = useState(false)

  const handlePayment = async () => {
    if (!selectedChannel) {
      toast({ title: "Pilih Metode Pembayaran", variant: "destructive" })
      return
    }

    setPaying(true)
    
    try {
      const res = await fetch(`/api/ortu/invoices/${invoice.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: selectedChannel,
          walletId: wallet?.id,
          customerName: user.name,
          customerEmail: user.email,
          customerPhone: user.phone || ""
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal memproses pembayaran")

      if (data.checkoutUrl) {
         toast({ title: "Berhasil", description: "Mengarahkan ke halaman pembayaran..." })
         router.push(data.checkoutUrl)
      } else {
         toast({ title: "Pembayaran Berhasil!", description: "Tagihan telah lunas." })
         if (autoDebit) {
            toast({ title: "Auto-Debit Aktif", description: "Tagihan bulan depan akan otomatis dipotong." })
         }
         router.push("/ortu/tagihan")
      }
    } catch (e: any) {
       toast({ title: "Gagal", description: e.message, variant: "destructive" })
    } finally {
       setPaying(false)
    }
  }

  const isWalletDisabled = !wallet || wallet.balance < invoice.amountDue

  return (
    <div className="px-5 mt-6 space-y-6">
      {/* Ringkasan Tagihan */}
      <div className="text-center">
         <p className="text-sm text-muted-foreground mb-1">Total Pembayaran</p>
         <h2 className="text-4xl font-black text-foreground mb-2">Rp {invoice.amountDue.toLocaleString('id-ID')}</h2>
         <Badge className="bg-rose-500/10 text-rose-600 border-rose-200">Belum Dibayar</Badge>
      </div>

      <Card className="glass border-0 shadow-sm rounded-2xl overflow-hidden">
         <CardContent className="p-0">
            <div className="p-4 border-b flex justify-between items-center">
               <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                     <Receipt className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                     <p className="font-bold text-sm">{invoice.title}</p>
                     <p className="text-xs text-muted-foreground">Atas Nama: {invoice.student?.name}</p>
                  </div>
               </div>
            </div>
            <div className="p-4 bg-muted/20 text-xs flex justify-between">
               <span className="text-muted-foreground">Jatuh Tempo</span>
               <span className="font-semibold">{format(new Date(invoice.dueDate), "d MMMM yyyy", { locale: localeId })}</span>
            </div>
         </CardContent>
      </Card>

      {/* Pilih Metode Pembayaran */}
      <Card className="glass border-0 shadow-sm rounded-2xl overflow-hidden">
         <CardContent className="p-4 sm:p-5">
           <h3 className="font-bold text-sm mb-3">Pilih Metode Pembayaran</h3>
           
           <div className="grid gap-3 sm:grid-cols-2 max-h-[300px] overflow-y-auto pr-2 pb-2 scrollbar-hide">
              {/* Wallet Option */}
              <div 
                onClick={() => !isWalletDisabled && setSelectedChannel("WALLET")}
                className={cn(
                  "p-3 rounded-xl border flex items-center gap-4 cursor-pointer transition-all",
                  selectedChannel === "WALLET" ? "bg-primary/5 border-primary ring-1 ring-primary" : "bg-card hover:bg-muted/50 border-border",
                  isWalletDisabled && "opacity-50 cursor-not-allowed"
                )}
              >
                 <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0", selectedChannel === "WALLET" ? "bg-primary text-primary-foreground" : "bg-indigo-100 text-indigo-600")}>
                    <Wallet className="h-5 w-5" />
                 </div>
                 <div className="flex-1">
                    <p className="font-bold text-xs">Tabungan Anak</p>
                    <p className="text-[10px] text-muted-foreground">Saldo: Rp {wallet?.balance.toLocaleString('id-ID') || '0'}</p>
                 </div>
                 {isWalletDisabled && <span title="Saldo tidak mencukupi"><Info className="h-4 w-4 text-rose-500" /></span>}
              </div>

              {/* Tripay Channels */}
              {paymentChannels.filter((c: any) => c.active).map((channel: any) => (
                <div 
                   key={channel.code}
                   onClick={() => setSelectedChannel(channel.code)}
                   className={cn(
                     "p-3 rounded-xl border flex items-center gap-4 cursor-pointer transition-all",
                     selectedChannel === channel.code ? "bg-primary/5 border-primary ring-1 ring-primary" : "bg-card hover:bg-muted/50 border-border"
                   )}
                >
                   {channel.icon_url ? (
                      <img src={channel.icon_url} alt={channel.name} className="h-8 w-12 object-contain bg-white rounded p-1" / loading="lazy" decoding="async">
                   ) : (
                      <CreditCard className="h-8 w-8 text-muted-foreground" />
                   )}
                   <div>
                      <p className="font-bold text-xs">{channel.name}</p>
                      <p className="text-[10px] text-muted-foreground">Biaya: Rp {channel.fee_customer?.flat?.toLocaleString("id-ID") || "0"}</p>
                   </div>
                </div>
              ))}

              {/* Manual Bank Transfers */}
              {manualBanks?.map((bank: any, idx: number) => (
                <div 
                   key={`manual-${idx}`}
                   onClick={() => setSelectedChannel(`MANUAL_${idx}`)}
                   className={cn(
                     "p-3 rounded-xl border flex items-center gap-4 cursor-pointer transition-all",
                     selectedChannel === `MANUAL_${idx}` ? "bg-primary/5 border-primary ring-1 ring-primary" : "bg-card hover:bg-muted/50 border-border"
                   )}
                >
                   <div className="h-8 w-12 bg-indigo-100 text-indigo-600 rounded flex items-center justify-center">
                      <Building className="h-5 w-5" />
                   </div>
                   <div>
                      <p className="font-bold text-xs">Transfer {bank.bank}</p>
                      <p className="text-[10px] text-muted-foreground">Admin Manual</p>
                   </div>
                </div>
              ))}

              {paymentChannels.length === 0 && (!manualBanks || manualBanks.length === 0) && (
                 <p className="text-sm text-red-500 col-span-full">Metode pembayaran belum dikonfigurasi oleh pihak sekolah.</p>
              )}
           </div>
         </CardContent>
      </Card>

      {/* Fitur Auto-Debit */}
      <Card className="border border-indigo-500/20 bg-indigo-500/5 shadow-none rounded-2xl">
         <CardContent className="p-4 flex items-center justify-between gap-4">
            <div>
               <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="h-4 w-4 text-indigo-600" />
                  <h4 className="font-bold text-sm text-indigo-900">Auto-Debit Tabungan</h4>
               </div>
               <p className="text-[10px] text-indigo-700/80 leading-relaxed">
                  Aktifkan agar tagihan otomatis dibayar menggunakan saldo tabungan.
               </p>
            </div>
            <Switch checked={autoDebit} onCheckedChange={setAutoDebit} className="data-[state=checked]:bg-indigo-600" />
         </CardContent>
      </Card>

      {/* Floating Checkout Button */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-background/80 backdrop-blur-md border-t z-30 sm:static sm:bg-transparent sm:border-0 sm:mt-10 sm:p-0">
         <div className="max-w-lg mx-auto">
            <Button 
               onClick={handlePayment} 
               disabled={paying || !selectedChannel}
               className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20"
            >
               {paying ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : "Bayar Sekarang"}
            </Button>
            <p className="text-center text-[10px] text-muted-foreground mt-3 flex items-center justify-center gap-1">
               <ShieldCheck className="h-3 w-3" /> Pembayaran aman dengan enkripsi standar bank.
            </p>
         </div>
      </div>
    </div>
  )
}
