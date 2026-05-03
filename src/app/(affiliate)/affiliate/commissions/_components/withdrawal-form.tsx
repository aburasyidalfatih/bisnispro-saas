"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

export function WithdrawalForm({ balance, hasBankInfo }: { balance: number, hasBankInfo: boolean }) {
  const [amount, setAmount] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const numAmount = parseInt(amount.replace(/[^0-9]/g, ""))
    
    if (!numAmount || numAmount < 50000) {
      toast({ title: "Gagal", description: "Minimal penarikan adalah Rp 50.000", variant: "destructive" })
      return
    }
    
    if (numAmount > balance) {
      toast({ title: "Gagal", description: "Saldo tidak mencukupi", variant: "destructive" })
      return
    }

    setLoading(true)
    
    try {
      const res = await fetch("/api/affiliate/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numAmount }),
      })
      
      const data = await res.json()
      
      if (res.ok) {
        toast({ title: "Berhasil", description: "Permintaan penarikan dana berhasil dikirim." })
        setAmount("")
        window.location.reload()
      } else {
        toast({ title: "Gagal", description: data.error || "Terjadi kesalahan", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Gagal", description: "Terjadi kesalahan sistem", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleWithdraw} className="space-y-4">
      <div className="space-y-2">
        <Label>Nominal Penarikan (Min. Rp 50.000)</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">Rp</span>
          <Input 
            type="text" 
            value={amount}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, "")
              setAmount(val ? parseInt(val).toLocaleString('id-ID') : "")
            }}
            placeholder="0"
            className="pl-9 rounded-xl"
            disabled={!hasBankInfo || balance < 50000}
          />
        </div>
      </div>
      <Button 
        type="submit" 
        disabled={loading || !hasBankInfo || balance < 50000 || !amount} 
        className="w-full btn-gradient text-white border-0 shadow-lg rounded-xl"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        Tarik Dana Sekarang
      </Button>
    </form>
  )
}
