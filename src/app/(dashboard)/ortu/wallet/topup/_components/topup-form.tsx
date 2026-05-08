"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wallet, CreditCard, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export function TopUpForm({ childrenWithWallets, paymentChannels, user, tenant }: any) {
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

      toast({ title: "Berhasil", description: "Mengarahkan ke halaman pembayaran..." })
      router.push(data.checkoutUrl)
    } catch (error: any) {
       toast({ title: "Gagal", description: error.message, variant: "destructive" })
    } finally {
       setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Pilih Rekening */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-foreground">1. Pilih Rekening Siswa</h3>
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
      </div>

      {/* 2. Pilih Nominal */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-foreground">2. Nominal Top Up</h3>
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
           <input 
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
      </div>

      {/* 3. Metode Pembayaran */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-foreground">3. Metode Pembayaran</h3>
        <div className="grid gap-3 sm:grid-cols-2 max-h-[300px] overflow-y-auto pr-2 pb-2">
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
                   <img src={channel.icon_url} alt={channel.name} className="h-8 w-12 object-contain bg-white rounded p-1" />
                ) : (
                   <CreditCard className="h-8 w-8 text-muted-foreground" />
                )}
                <div>
                   <p className="font-bold text-xs">{channel.name}</p>
                   <p className="text-[10px] text-muted-foreground">Biaya: Rp {channel.fee_customer.flat.toLocaleString("id-ID")}</p>
                </div>
             </div>
           ))}
           {paymentChannels.length === 0 && (
              <p className="text-sm text-red-500 col-span-full">Gateway pembayaran belum dikonfigurasi oleh sekolah.</p>
           )}
        </div>
      </div>

      <div className="pt-6 border-t border-border">
         <Button 
            className="w-full rounded-xl h-14 text-lg font-bold" 
            disabled={loading || paymentChannels.length === 0} 
            onClick={handleTopUp}
         >
            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Lanjutkan Pembayaran"}
         </Button>
      </div>
    </div>
  )
}
