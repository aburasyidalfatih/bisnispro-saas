import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MessageSquare, Save, Eye, EyeOff, Smartphone } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { SettingsForm } from "../../constants"

interface Props {
  form: SettingsForm;
  setForm: React.Dispatch<React.SetStateAction<SettingsForm>>;
  handleSaveBatch: (fields: string[], overrides?: Record<string, string>) => Promise<void>;
  saving: boolean;
}

export function ProviderStarsender({ form, setForm, handleSaveBatch, saving }: Props) {
  const [showWAToken, setShowWAToken] = useState(false)
  const [testWANumber, setTestWANumber] = useState("")
  const [testing, setTesting] = useState(false)

  const handleTestWA = async () => {
    if (!testWANumber) { toast({ title: "Isi nomor tujuan", variant: "destructive" }); return }
    if (!form.STARSENDER_API_KEY) { toast({ title: "Isi API Key terlebih dahulu", variant: "destructive" }); return }
    
    setTesting(true)
    try {
      const res = await fetch("/api/tenant/settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "whatsapp",
          waApiUrl: "https://api.starsender.online/api",
          waApiKey: form.STARSENDER_API_KEY,
          waDeviceId: form.STARSENDER_DEVICE_ID || undefined,
          waDelayMin: parseInt(form.STARSENDER_DELAY_MIN) || 5,
          waDelayMax: parseInt(form.STARSENDER_DELAY_MAX) || 15,
          waPhone: testWANumber,
        }),
      })
      const data = await res.json()
      if (res.ok) toast({ title: "✅ Berhasil!", description: data.message })
      else throw new Error(data.error)
    } catch (e: any) {
      toast({ title: "❌ Gagal", description: e.message, variant: "destructive" })
    } finally {
      setTesting(false)
    }
  }

  return (
    <>
      <Card className="glass border-0">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10"><MessageSquare className="h-4 w-4 text-emerald-500" /></div>
            <CardTitle className="text-lg">StarSender API</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>API Token / Key</Label>
            <div className="relative">
              <Input type={showWAToken ? "text" : "password"} value={form.STARSENDER_API_KEY} onChange={e => setForm({...form, STARSENDER_API_KEY: e.target.value})} placeholder="Token StarSender" className="rounded-xl pr-10" />
              <button type="button" onClick={() => setShowWAToken(!showWAToken)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showWAToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Device ID (Opsional)</Label>
            <Input value={form.STARSENDER_DEVICE_ID} onChange={e => setForm({...form, STARSENDER_DEVICE_ID: e.target.value})} placeholder="ID Perangkat" className="rounded-xl" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Delay Minimum (Menit)</Label>
              <Input 
                type="number" 
                value={form.STARSENDER_DELAY_MIN} 
                onChange={e => setForm({...form, STARSENDER_DELAY_MIN: e.target.value})} 
                className="rounded-xl" 
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Delay Maksimum (Menit)</Label>
              <Input 
                type="number" 
                value={form.STARSENDER_DELAY_MAX} 
                onChange={e => setForm({...form, STARSENDER_DELAY_MAX: e.target.value})} 
                className="rounded-xl" 
                min="0"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Penundaan waktu (jeda) acak dalam satuan <strong>Menit</strong> sebelum pesan terkirim. Membantu menghindari blokir WhatsApp karena terdeteksi mengirim pesan terlalu cepat.
          </p>

          <Button className="w-full gap-2 btn-gradient text-white border-0 rounded-xl mt-2" onClick={() => handleSaveBatch(['STARSENDER_API_KEY', 'STARSENDER_DEVICE_ID', 'STARSENDER_DELAY_MIN', 'STARSENDER_DELAY_MAX'])} disabled={saving}>
            <Save className="h-4 w-4" /> Simpan WhatsApp
          </Button>
        </CardContent>
      </Card>

      <Card className="glass border-0">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10"><Smartphone className="h-4 w-4 text-primary" /></div>
            <CardTitle className="text-lg">Test WhatsApp (StarSender)</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Nomor Tujuan</Label>
            <Input value={testWANumber} onChange={e => setTestWANumber(e.target.value)} placeholder="0812345678xx" className="rounded-xl" />
          </div>
          <Button variant="outline" className="w-full rounded-xl gap-2 border-primary/30 text-primary hover:bg-primary/5" onClick={handleTestWA} disabled={testing || !form.STARSENDER_API_KEY}>
            {testing ? "Mengirim..." : "Kirim Pesan Tes"}
          </Button>
        </CardContent>
      </Card>
    </>
  )
}
