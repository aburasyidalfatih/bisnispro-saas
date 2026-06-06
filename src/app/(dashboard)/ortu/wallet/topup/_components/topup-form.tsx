"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wallet, CreditCard, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

export function TopUpForm({ childrenWithWallets, paymentChannels, manualBanks = [], user, tenant }: any) {
  const [selectedWallet, setSelectedWallet] = useState<string>(childrenWithWallets[0]?.walletAccount?.id)
  const [amount, setAmount] = useState<number>(50000)
  const [customAmount, setCustomAmount] = useState<string>("")
  const [selectedChannel, setSelectedChannel] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const presetAmounts = [20000, 50000, 100000, 200000, 500000, 1000000]

  const handleTopUp = async () => {
    if (!selectedWallet) return toast({ title: "Pilih rekening siswa", variant: "destructive" })
    if (!selectedChannel) return toast({ title: "Pilih metode pembayaran", variant: "destructive" })
    
    const finalAmount = customAmount ? parseInt(customAmount.replace(/\D/g, "")) : amount
    if (finalAmount < 10000) return toast({ title: "Minimal top up Rp 10.000", variant: "destructive" })

    setLoading(true)
    try {
      const res = await fetch("/api/wallet/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletId: selectedWallet,
          amount: finalAmount,
          method: selectedChannel,
          customerName: user.name,
          customerEmail: user.email,
          customerPhone: user.phone || ""
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal membuat transaksi")

      if (data.checkoutUrl) {
         toast({ title: "Berhasil", description: "Mengarahkan ke halaman pembayaran..." })
         router.push(data.checkoutUrl)
      } else if (data.redirectUrl) {
         toast({ title: "Berhasil", description: "Mengarahkan ke instruksi pembayaran manual..." })
         router.push(data.redirectUrl)
      } else {
         toast({ title: "Berhasil", description: "Instruksi pembayaran disiapkan..." })
         router.push("/ortu/wallet")
      }
    } catch (error: any) {
       toast({ title: "Gagal", description: error.message, variant: "destructive" })
    } finally {
       setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* 1. Pilih Rekening */}
      <Card className="glass border-0 shadow-xl overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
             <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">1</div>
             <h3 className="text-sm font-bold text-foreground">Pilih Rekening Siswa</h3>
          </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {childrenWithWallets.map((child: any) => (
             <div 
                key={child.walletAccount.id}
                onClick={() => setSelectedWallet(child.walletAccount.id)}
                className={cn(
                  "p-4 rounded-2xl border cursor-pointer transition-all",
                  selectedWallet === child.walletAccount.id ? "bg-primary/5 border-primary ring-1 ring-primary" : "bg-card hover:bg-muted/50 border-border"
                )}
             >
                <div className="flex justify-between items-start mb-2">
                   <div className="font-bold text-sm">{child.name}</div>
                   <Wallet className={cn("h-4 w-4", selectedWallet === child.walletAccount.id ? "text-primary" : "text-muted-foreground")} />
                </div>
                <div className="text-xs text-muted-foreground mb-1">Saldo saat ini:</div>
                <div className="font-mono font-bold text-lg text-primary">Rp {child.walletAccount.balance.toLocaleString("id-ID")}</div>
             </div>
          ))}
        </div>
        </CardContent>
      </Card>

      {/* 2. Pilih Nominal */}
      <Card className="glass border-0 shadow-xl overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
             <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">2</div>
             <h3 className="text-sm font-bold text-foreground">Nominal Top Up</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
           {presetAmounts.map(val => (
             <div 
               key={val}
               onClick={() => { setAmount(val); setCustomAmount("") }}
               className={cn(
                 "p-3 rounded-xl border text-center font-bold text-sm cursor-pointer transition-all",
                 amount === val && !customAmount ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-muted/50 border-border text-foreground"
               )}
             >
               Rp {val.toLocaleString("id-ID")}
             </div>
           ))}
        </div>
        <div className="mt-4">
           <p className="text-xs font-semibold text-muted-foreground mb-2">Atau masukkan nominal lain:</p>
           <Input 
             type="text" 
             placeholder="Contoh: 150000"
             className="w-full p-3 rounded-xl border border-border bg-card font-mono focus:outline-none focus:ring-2 ring-primary"
             value={customAmount}
             onChange={(e) => {
               const val = e.target.value.replace(/\D/g, "")
               setCustomAmount(val)
               if(val) setAmount(0)
             }}
           />
        </div>
        </CardContent>
      </Card>

      {/* 3. Metode Pembayaran */}
      <Card className="glass border-0 shadow-xl overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
             <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">3</div>
             <h3 className="text-sm font-bold text-foreground">Metode Pembayaran</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 max-h-[300px] overflow-y-auto pr-2 pb-2 scrollbar-hide">
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
                   <p className="text-[10px] text-muted-foreground">Biaya: Rp {channel.fee_customer.flat.toLocaleString("id-ID")}</p>
                </div>
             </div>
           ))}
           {manualBanks.map((bank: any, idx: number) => (
              <div 
                 key={`manual-${idx}`}
                 onClick={() => setSelectedChannel(`MANUAL_${idx}`)}
                 className={cn(
                   "p-3 rounded-xl border flex items-center gap-4 cursor-pointer transition-all",
                   selectedChannel === `MANUAL_${idx}` ? "bg-primary/5 border-primary ring-1 ring-primary" : "bg-card hover:bg-muted/50 border-border"
                 )}
              >
                 <div className="h-8 w-12 bg-indigo-100 text-indigo-600 rounded flex items-center justify-center">
                    <Wallet className="h-5 w-5" />
                 </div>
                 <div>
                    <p className="font-bold text-xs">Transfer Manual ({bank.bank})</p>
                    <p className="text-[10px] text-muted-foreground">Biaya: Rp 0</p>
                 </div>
              </div>
            ))}
            {paymentChannels.length === 0 && manualBanks.length === 0 && (
               <p className="text-sm text-red-500 col-span-full">Gateway pembayaran atau rekening manual belum dikonfigurasi oleh sekolah.</p>
            )}
         </div>
        </CardContent>
      </Card>

      <div className="pt-2 pb-24">
         <Button 
            className="w-full rounded-2xl h-14 text-lg font-bold shadow-lg shadow-primary/30" 
            disabled={loading || !selectedChannel} 
            onClick={handleTopUp}
         >
            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Lanjutkan Pembayaran"}
         </Button>
         <p className="text-center text-[10px] text-muted-foreground mt-3 flex items-center justify-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
            Transaksi aman dan terenkripsi.
         </p>
      </div>
    </div>
  )
}
