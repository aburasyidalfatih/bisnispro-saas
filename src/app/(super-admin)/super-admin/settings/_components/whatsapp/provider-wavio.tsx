import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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

export function ProviderWavio({ form, setForm, handleSaveBatch, saving }: Props) {
  const [showWAToken, setShowWAToken] = useState(false)
  const [testWANumber, setTestWANumber] = useState("")
  const [testing, setTesting] = useState(false)

  const handleTestWA = async () => {
    if (!testWANumber) { toast({ title: "Isi nomor tujuan", variant: "destructive" }); return }
    if (!form.WAVIO_API_KEY || !form.WAVIO_NUMBER_ID) {
      toast({ title: "Isi API Key dan Number ID Wavio terlebih dahulu", variant: "destructive" }); return
    }
    
    setTesting(true)
    try {
      const res = await fetch("/api/tenant/settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "wavio",
          wavioApiKey: form.WAVIO_API_KEY,
          wavioNumberId: form.WAVIO_NUMBER_ID,
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
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10"><MessageSquare className="h-4 w-4 text-orange-500" /></div>
            <CardTitle className="text-lg">Wavio API</CardTitle>
          </div>
          <CardDescription>Integrasi layanan gateway WhatsApp Wavio.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Number ID (WABA ID)</Label>
            <Input value={form.WAVIO_NUMBER_ID} onChange={e => setForm({...form, WAVIO_NUMBER_ID: e.target.value})} placeholder="Misal: waba_xxx" className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>API Key</Label>
            <div className="relative">
              <Input type={showWAToken ? "text" : "password"} value={form.WAVIO_API_KEY} onChange={e => setForm({...form, WAVIO_API_KEY: e.target.value})} placeholder="wavio_xxx" className="rounded-xl pr-10" />
              <button type="button" onClick={() => setShowWAToken(!showWAToken)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showWAToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
            </div>
          </div>
          <Button className="w-full gap-2 btn-gradient text-white border-0 rounded-xl mt-2" onClick={() => handleSaveBatch(['WAVIO_API_KEY', 'WAVIO_NUMBER_ID'])} disabled={saving}>
            <Save className="h-4 w-4" /> Simpan Konfigurasi Wavio
          </Button>
        </CardContent>
      </Card>

      <Card className="glass border-0">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10"><Smartphone className="h-4 w-4 text-primary" /></div>
            <CardTitle className="text-lg">Test WhatsApp (Wavio)</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Nomor Tujuan</Label>
            <Input value={testWANumber} onChange={e => setTestWANumber(e.target.value)} placeholder="0812345678xx" className="rounded-xl" />
          </div>
          <Button variant="outline" className="w-full rounded-xl gap-2 border-primary/30 text-primary hover:bg-primary/5" onClick={() => { setForm({...form, WA_ACTIVE_PROVIDER: 'wavio'}); setTimeout(handleTestWA, 100); }} disabled={testing || !form.WAVIO_API_KEY || !form.WAVIO_NUMBER_ID}>
            {testing ? "Mengirim..." : "Kirim Pesan Tes (Wavio)"}
          </Button>
        </CardContent>
      </Card>
    </>
  )
}
