"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Coins, CreditCard, Sparkles, CheckCircle2, History } from "lucide-react"
import { GtkAiUsageHistory } from "../../ai/_components/gtk-ai-usage-history"

export function GtkTokenManager({
  userTokens,
  tenantTokens,
  paymentChannels,
  aiPackages,
  manualPayment
}: {
  userTokens: number,
  tenantTokens: number,
  paymentChannels: any[],
  aiPackages: any[],
  manualPayment: any
}) {
  const [selectedPackageId, setSelectedPackageId] = useState<string>("")
  const [selectedMethod, setSelectedMethod] = useState<string>("")
  const [isLoadingTopup, setIsLoadingTopup] = useState(false)
  
  const totalTokens = userTokens + tenantTokens

  const handleTopup = async () => {
    if (!selectedPackageId) {
      alert("Pilih paket token terlebih dahulu")
      return
    }
    if (!selectedMethod) {
      alert("Pilih metode pembayaran terlebih dahulu")
      return
    }
    
    setIsLoadingTopup(true)
    try {
      const res = await fetch("/api/gtk/ai/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: selectedPackageId,
          method: selectedMethod
        })
      })
      const data = await res.json()
      
      if (res.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        alert("Gagal membuat transaksi: " + data.error)
      }
    } catch (err) {
      alert("Terjadi kesalahan sistem")
    } finally {
      setIsLoadingTopup(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Saldo Token Card */}
      <Card className="shadow-lg border-0 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-amber-600/5 z-0"></div>
        <CardHeader className="pb-3 border-b border-amber-500/20 relative z-10">
          <CardTitle className="text-lg flex items-center gap-2 text-amber-900 dark:text-amber-100">
            <div className="bg-amber-500/20 p-1.5 rounded-lg">
              <Coins className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            Informasi Token Anda
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5 relative z-10">
          <div className="text-4xl font-black tracking-tight mb-1 flex items-center gap-2 text-amber-600 dark:text-amber-400">
            {totalTokens.toLocaleString("id-ID")}
          </div>
          <div className="space-y-2 mt-5 max-w-sm">
            <div className="flex justify-between items-center text-sm p-2 bg-white/50 dark:bg-black/20 rounded-xl">
              <span className="text-muted-foreground font-medium">Token Pribadi</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">{userTokens.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between items-center text-sm p-2 bg-white/50 dark:bg-black/20 rounded-xl">
              <span className="text-muted-foreground font-medium">Token Sekolah</span>
              <span className="font-bold text-primary">{tenantTokens.toLocaleString("id-ID")}</span>
            </div>
          </div>
          {totalTokens < 1000 && (
            <div className="mt-4 p-3 max-w-sm bg-red-500/10 text-red-700 dark:text-red-400 rounded-xl text-xs font-semibold border border-red-500/20 flex gap-2 items-start">
              <Sparkles className="h-4 w-4 shrink-0 mt-0.5" />
              <span>Sisa token menipis. Top-up segera agar AI tetap bisa membantu tugas Anda.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Topup Section */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm glass">
           <CardHeader>
              <CardTitle>Beli Token AI Pribadi</CardTitle>
              <CardDescription>Pilih jumlah token yang ingin Anda beli. Token pribadi tidak akan hangus di akhir bulan.</CardDescription>
           </CardHeader>
           <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                 {aiPackages?.map(pkg => {
                   const isSelected = selectedPackageId === pkg.id;
                   return (
                     <div 
                       key={pkg.id}
                       onClick={() => setSelectedPackageId(pkg.id)}
                       className={`relative cursor-pointer rounded-2xl p-5 text-center transition-all duration-300 ${isSelected ? 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-xl shadow-amber-500/30 scale-[1.02] text-white ring-2 ring-amber-500 ring-offset-2 dark:ring-offset-background' : 'bg-white dark:bg-slate-800 border border-border/50 hover:border-amber-400/50 hover:shadow-md'}`}
                     >
                        {isSelected && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-100 text-amber-800 text-[10px] font-bold px-3 py-1 rounded-full border border-amber-200 shadow-sm flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Dipilih
                          </div>
                        )}
                        <div className={`font-semibold text-sm mb-1 ${isSelected ? 'text-amber-50' : 'text-slate-600 dark:text-slate-400'}`}>{pkg.name}</div>
                        <div className={`text-2xl font-black mb-1 ${isSelected ? 'text-white' : 'text-amber-600 dark:text-amber-400'}`}>
                          {pkg.tokens.toLocaleString("id-ID")}
                        </div>
                        <div className={`text-xs font-medium ${isSelected ? 'text-amber-100' : 'text-muted-foreground'}`}>Token AI</div>
                     </div>
                   )
                 })}
                 {aiPackages?.length === 0 && (
                    <div className="col-span-2 text-center p-8 text-sm text-muted-foreground border-2 border-dashed rounded-2xl bg-muted/20">
                       Belum ada paket token tersedia saat ini.
                    </div>
                 )}
              </div>
              
              {selectedPackageId && (
                <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                   <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Total Pembayaran:</span>
                      <span className="text-xl font-bold text-primary">
                        Rp {aiPackages.find(p => p.id === selectedPackageId)?.price?.toLocaleString("id-ID") || 0}
                      </span>
                   </div>
                   <p className="text-[11px] text-muted-foreground text-right">*Belum termasuk biaya layanan (jika ada)</p>
                </div>
              )}
           </CardContent>
        </Card>

        <Card className="border-0 shadow-sm glass">
           <CardHeader>
              <CardTitle>Metode Pembayaran</CardTitle>
              <CardDescription>Pilih metode pembayaran yang tersedia.</CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
              <ScrollArea className="h-[250px] pr-4">
                 <div className="space-y-3">
                    {paymentChannels?.map((ch: any) => (
                       <label 
                         key={ch.code}
                         className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-colors ${selectedMethod === ch.code ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'border-border hover:bg-muted/50'}`}
                       >
                          <div className="flex items-center gap-3">
                             <Input 
                               type="radio" 
                               name="payment_method" 
                               value={ch.code} 
                               checked={selectedMethod === ch.code}
                               onChange={(e) => setSelectedMethod(e.target.value)}
                               className="h-4 w-4 text-primary focus:ring-primary"
                             />
                             <div>
                                <div className="font-semibold text-sm">{ch.name}</div>
                             </div>
                          </div>
                          <div className="h-8 w-12 bg-white rounded flex items-center justify-center p-1 border">
                             <img src={ch.icon_url} alt={ch.name} className="max-h-full max-w-full object-contain" loading="lazy" decoding="async" />
                          </div>
                       </label>
                    ))}
                    {paymentChannels?.length === 0 && (
                       <label 
                         className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-colors ${selectedMethod === 'MANUAL_TRANSFER' ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'border-border hover:bg-muted/50'}`}
                       >
                          <div className="flex items-center gap-3">
                             <Input 
                               type="radio" 
                               name="payment_method" 
                               value="MANUAL_TRANSFER" 
                               checked={selectedMethod === 'MANUAL_TRANSFER'}
                               onChange={(e) => setSelectedMethod(e.target.value)}
                               className="h-4 w-4 text-primary focus:ring-primary"
                             />
                             <div>
                                <div className="font-semibold text-sm">Transfer Manual</div>
                                <div className="text-xs text-muted-foreground">{manualPayment?.bank}</div>
                             </div>
                          </div>
                          <div className="h-8 w-12 bg-muted/50 rounded flex items-center justify-center p-1 border text-[10px] font-bold text-muted-foreground">
                             MANUAL
                          </div>
                       </label>
                    )}
                 </div>
              </ScrollArea>
           </CardContent>
           <CardFooter className="bg-muted/20 border-t border-border/50 pt-4">
              <Button 
                onClick={handleTopup} 
                className="w-full" 
                size="lg" 
                disabled={isLoadingTopup || !selectedMethod || !selectedPackageId}
              >
                 {isLoadingTopup ? "Memproses..." : "Bayar Sekarang"}
              </Button>
           </CardFooter>
         </Card>
      </div>

      <div className="pt-4 border-t border-border/50">
        <h3 className="text-lg font-bold tracking-tight mb-4 flex items-center gap-2">
          <History className="h-5 w-5 text-muted-foreground" /> 
          Histori Penggunaan Token
        </h3>
        <GtkAiUsageHistory />
      </div>
    </div>
  )
}
