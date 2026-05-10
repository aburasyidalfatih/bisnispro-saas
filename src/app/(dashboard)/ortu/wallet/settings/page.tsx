"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock, Loader2, Save, ShieldAlert, AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function WalletSettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasPin, setHasPin] = useState(false)
  const [pin, setPin] = useState("")
  const [dailyLimit, setDailyLimit] = useState("")

  useEffect(() => {
    fetch("/api/wallet/settings")
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error)
        setHasPin(d.hasPin)
        if (d.dailyLimit) setDailyLimit(d.dailyLimit.toString())
      })
      .catch(() => toast({ title: "Gagal memuat pengaturan", variant: "destructive" }))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    if (pin && pin.length !== 6) {
      return toast({ title: "PIN tidak valid", description: "PIN harus 6 digit angka", variant: "destructive" })
    }

    setSaving(true)
    try {
      const res = await fetch("/api/wallet/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          pin: pin || undefined, 
          dailyLimit: dailyLimit ? parseInt(dailyLimit.replace(/\D/g, "")) : 0 
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      if (pin) setHasPin(true)
      setPin("") // clear after save
      toast({ title: "Pengaturan berhasil disimpan!", description: "PIN dan limit harian telah diperbarui." })
    } catch (err: any) {
      toast({ title: "Gagal menyimpan", description: err.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="pb-12 space-y-5">
      {/* Hero */}
      <div className="bg-slate-800 rounded-b-[2.5rem] pt-8 pb-16 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Lock className="w-32 h-32 text-white" />
        </div>
        <Link href="/ortu/wallet" className="text-white/70 text-sm mb-4 inline-block hover:text-white">
          &larr; Kembali ke Wallet
        </Link>
        <h1 className="text-white font-bold text-2xl mb-2 relative z-10">Pengaturan Keamanan</h1>
        <p className="text-white/70 text-sm relative z-10">Lindungi saldo anak Anda dan atur batas jajan harian mereka.</p>
      </div>

      <div className="px-5 -mt-8 space-y-4 relative z-10">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            {!hasPin && (
              <div className="bg-amber-100 border border-amber-300 text-amber-800 p-4 rounded-xl flex gap-3 text-sm">
                <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Keamanan Rentan!</p>
                  <p>Anda belum mengatur PIN. Kartu anak Anda bisa disalahgunakan jika hilang. Segera atur PIN di bawah ini.</p>
                </div>
              </div>
            )}

            <Card className="glass border-0 shadow-md rounded-2xl overflow-hidden">
              <CardHeader className="bg-muted/30 pb-4 border-b">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" /> PIN Transaksi (6 Digit)
                </CardTitle>
                <CardDescription>
                  PIN ini wajib dimasukkan saat anak jajan di Kantin Sekolah menggunakan Kartu Pelajar.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <Label>{hasPin ? "Ubah PIN Baru" : "Buat PIN Baru"}</Label>
                  <Input 
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="******"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    className="tracking-[0.5em] text-center font-bold text-lg h-12 rounded-xl"
                  />
                  {hasPin && !pin && <p className="text-xs text-muted-foreground mt-1">Kosongkan jika tidak ingin mengubah PIN saat ini.</p>}
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-0 shadow-md rounded-2xl overflow-hidden">
              <CardHeader className="bg-muted/30 pb-4 border-b">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-primary" /> Limit Jajan Harian
                </CardTitle>
                <CardDescription>
                  Batasi maksimal pengeluaran anak per hari agar tidak boros.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <Label>Maksimal Jajan Per Hari (Rp)</Label>
                  <Input 
                    type="text"
                    inputMode="numeric"
                    placeholder="Misal: 30000"
                    value={dailyLimit}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '')
                      setDailyLimit(val ? parseInt(val).toLocaleString("id-ID") : "")
                    }}
                    className="font-bold text-lg h-12 rounded-xl"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Isi 0 atau kosongkan jika tidak ada limit (Bebas).</p>
                </div>
              </CardContent>
            </Card>

            <Button 
              className="w-full h-14 rounded-xl text-lg font-bold shadow-lg shadow-primary/25"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
              Simpan Pengaturan
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
