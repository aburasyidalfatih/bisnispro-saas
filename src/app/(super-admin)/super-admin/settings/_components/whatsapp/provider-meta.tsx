import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MessageSquare, Save, Eye, EyeOff, Smartphone, ShieldCheck } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { SettingsForm } from "../../constants"

interface Props {
  form: SettingsForm;
  setForm: React.Dispatch<React.SetStateAction<SettingsForm>>;
  handleSaveBatch: (fields: string[], overrides?: Record<string, string>) => Promise<void>;
  saving: boolean;
}

export function ProviderMeta({ form, setForm, handleSaveBatch, saving }: Props) {
  const [showWAToken, setShowWAToken] = useState(false)
  const [testWANumber, setTestWANumber] = useState("")
  const [testing, setTesting] = useState(false)

  const handleTestWA = async () => {
    if (!testWANumber) { toast({ title: "Isi nomor tujuan", variant: "destructive" }); return }
    if (!form.META_WA_PHONE_NUMBER_ID || !form.META_WA_ACCESS_TOKEN) {
      toast({ title: "Isi Phone ID dan Access Token Meta API", variant: "destructive" }); return
    }
    
    setTesting(true)
    try {
      const res = await fetch("/api/tenant/settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "meta_wa",
          metaPhoneId: form.META_WA_PHONE_NUMBER_ID,
          metaToken: form.META_WA_ACCESS_TOKEN,
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
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10"><MessageSquare className="h-4 w-4 text-blue-500" /></div>
            <CardTitle className="text-lg">Meta Official API</CardTitle>
          </div>
          <CardDescription>Gunakan API Resmi WhatsApp untuk pengiriman stabil dan aman.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Phone Number ID</Label>
            <Input value={form.META_WA_PHONE_NUMBER_ID} onChange={e => setForm({...form, META_WA_PHONE_NUMBER_ID: e.target.value})} placeholder="Misal: 102345678901234" className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Business Account ID</Label>
            <Input value={form.META_WA_BUSINESS_ACCOUNT_ID} onChange={e => setForm({...form, META_WA_BUSINESS_ACCOUNT_ID: e.target.value})} placeholder="Misal: 104567890123456" className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Permanent Access Token</Label>
            <div className="relative">
              <Input type={showWAToken ? "text" : "password"} value={form.META_WA_ACCESS_TOKEN} onChange={e => setForm({...form, META_WA_ACCESS_TOKEN: e.target.value})} placeholder="EAAxxxx..." className="rounded-xl pr-10" />
              <Button variant="ghost" size="icon" type="button" onClick={() => setShowWAToken(!showWAToken)} className="absolute right-1 h-8 w-8 top-1/2 -translate-y-1/2 text-muted-foreground">{showWAToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
            </div>
          </div>
          <Button className="w-full gap-2 btn-gradient text-white border-0 rounded-xl mt-2 flex items-center justify-center h-10 px-4" onClick={() => handleSaveBatch(['META_WA_PHONE_NUMBER_ID', 'META_WA_BUSINESS_ACCOUNT_ID', 'META_WA_ACCESS_TOKEN'])} disabled={saving}>
            <Save className="h-4 w-4" /> Simpan Kredensial Meta
          </Button>
        </CardContent>
      </Card>

      <Card className="glass border-0">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10"><Smartphone className="h-4 w-4 text-primary" /></div>
            <CardTitle className="text-lg">Test WhatsApp (Meta API)</CardTitle>
          </div>
          <CardDescription>Pesan pertama mungkin membutuhkan Message Template jika nomor belum pernah membalas Anda (24-hour window).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Nomor Tujuan</Label>
            <Input value={testWANumber} onChange={e => setTestWANumber(e.target.value)} placeholder="0812345678xx" className="rounded-xl" />
          </div>
          <Button variant="outline" className="w-full rounded-xl gap-2 border-primary/30 text-primary hover:bg-primary/5" onClick={() => { setForm({...form, WA_ACTIVE_PROVIDER: 'meta'}); setTimeout(handleTestWA, 100); }} disabled={testing || !form.META_WA_PHONE_NUMBER_ID || !form.META_WA_ACCESS_TOKEN}>
            {testing ? "Mengirim..." : "Kirim Pesan Tes (Meta)"}
          </Button>
        </CardContent>
      </Card>

      <Card className="glass border-0">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10"><ShieldCheck className="h-4 w-4 text-blue-500" /></div>
            <CardTitle className="text-lg">Konfigurasi Webhook & Meta App</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-sm space-y-4 text-muted-foreground">
          <p>Gunakan informasi berikut untuk setup App di <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">Meta for Developers</a>:</p>
          <div className="rounded-xl bg-muted/50 p-4 space-y-3">
            <div>
              <p className="font-semibold text-foreground mb-1">URL Kebijakan Privasi:</p>
              <code className="block bg-background border p-2 rounded-lg text-xs break-all">https://schoolpro.id/privacy-policy</code>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">Webhook Callback URL:</p>
              <code className="block bg-background border p-2 rounded-lg text-xs break-all">https://schoolpro.id/api/webhook/meta-wa</code>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">Webhook Verify Token:</p>
              <code className="block bg-background border p-2 rounded-lg text-xs break-all">schoolpro_meta_verify_token_123</code>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
