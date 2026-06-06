"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Coins, Sparkles, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"

export function AiTopupDialog({ 
  open, 
  onOpenChange,
  userTokens,
  aiPackages,
  paymentChannels,
  manualPayment
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  userTokens: number
  aiPackages: any[]
  paymentChannels: any[]
  manualPayment: any
}) {
  const [selectedPackageId, setSelectedPackageId] = useState<string>("")
  const [selectedMethod, setSelectedMethod] = useState<string>("")
  const [isLoadingTopup, setIsLoadingTopup] = useState(false)

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl rounded-3xl p-0 overflow-hidden border-0 shadow-2xl glass bg-background/95">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50 bg-muted/20">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Sparkles className="h-5 w-5" />
            </div>
            Top-Up Token AI
          </DialogTitle>
          <DialogDescription>
            Beli token untuk menggunakan Asisten AI Pintar. Token pribadi tidak akan hangus.
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2">
          {/* Bagian Kiri: Info & Paket */}
          <div className="p-6 space-y-6 border-r border-border/50">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
               <div>
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-500">Token Anda Saat Ini</p>
                  <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-2">
                    <Coins className="h-6 w-6" /> {userTokens.toLocaleString("id-ID")}
                  </div>
               </div>
               {userTokens < 500 && (
                 <div className="bg-red-500/10 text-red-600 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border border-red-500/20">
                   <AlertCircle className="h-3 w-3" /> Token Menipis
                 </div>
               )}
            </div>

            <div className="space-y-3">
               <h3 className="font-semibold text-sm">Pilih Paket:</h3>
               <div className="grid grid-cols-2 gap-3">
                  {aiPackages?.map(pkg => (
                    <div 
                      key={pkg.id}
                      onClick={() => setSelectedPackageId(pkg.id)}
                      className={`cursor-pointer border rounded-xl p-3 text-center transition-all ${selectedPackageId === pkg.id ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/50 scale-[1.02] shadow-md shadow-amber-500/10' : 'border-border hover:border-amber-500/30 hover:bg-amber-500/5'}`}
                    >
                       <div className="font-bold text-sm mb-0.5">{pkg.name}</div>
                       <div className="text-lg font-black text-amber-600 dark:text-amber-400">{pkg.tokens.toLocaleString("id-ID")}</div>
                       <div className="text-[10px] text-muted-foreground mt-1 font-medium bg-muted/50 rounded-md py-0.5">Token AI</div>
                    </div>
                  ))}
                  {aiPackages?.length === 0 && (
                     <div className="col-span-2 text-center p-4 text-sm text-muted-foreground border rounded-xl">
                        Belum ada paket token tersedia.
                     </div>
                  )}
               </div>
            </div>
          </div>

          {/* Bagian Kanan: Metode Pembayaran */}
          <div className="p-6 flex flex-col h-full">
            <h3 className="font-semibold text-sm mb-3">Metode Pembayaran:</h3>
            <ScrollArea className="flex-1 pr-4 min-h-[200px]">
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
                           <img src={ch.icon_url} alt={ch.name} className="max-h-full max-w-full object-contain" />
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
                              <div className="text-[10px] text-muted-foreground line-clamp-1">{manualPayment?.bank}</div>
                           </div>
                        </div>
                        <div className="h-6 w-10 bg-muted/50 rounded flex items-center justify-center p-1 border text-[8px] font-bold text-muted-foreground">
                           MANUAL
                        </div>
                     </label>
                  )}
               </div>
            </ScrollArea>

            <div className="mt-4 pt-4 border-t border-border/50">
               {selectedPackageId && (
                 <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-medium">Total Bayar:</span>
                    <span className="text-xl font-bold text-primary">
                      Rp {aiPackages.find(p => p.id === selectedPackageId)?.price?.toLocaleString("id-ID") || 0}
                    </span>
                 </div>
               )}
               <button 
                 onClick={handleTopup} 
                 className="justify-center items-center flex w-full rounded-xl btn-gradient text-white shadow-lg shadow-primary/20 h-11 px-4" 
                 disabled={isLoadingTopup || !selectedMethod || !selectedPackageId}
               >
                  {isLoadingTopup ? (
                    <><div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" /> Memproses...</>
                  ) : "Bayar Sekarang"}
               </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
