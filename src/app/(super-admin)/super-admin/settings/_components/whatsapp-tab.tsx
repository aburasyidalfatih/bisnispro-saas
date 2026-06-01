import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, Save, Eye, EyeOff, Smartphone, ShieldCheck, Settings2, CreditCard } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/hooks/use-toast"
import type { SettingsForm } from "../constants"

interface WhatsappTabProps {
  form: SettingsForm;
  setForm: React.Dispatch<React.SetStateAction<SettingsForm>>;
  handleSaveBatch: (fields: string[], overrides?: Record<string, string>) => Promise<void>;
  saving: boolean;
}

export function WhatsappTab({ form, setForm, handleSaveBatch, saving }: WhatsappTabProps) {
  const [showWAToken, setShowWAToken] = useState(false)
  const [testWANumber, setTestWANumber] = useState("")
  const [testing, setTesting] = useState(false)

  const handleTestWA = async () => {
    if (!testWANumber) { toast({ title: "Isi nomor tujuan", variant: "destructive" }); return }
    
    // Test Meta WA
    if (form.WA_ACTIVE_PROVIDER === "meta") {
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
      return
    }

    // Test Wavio API
    if (form.WA_ACTIVE_PROVIDER === "wavio") {
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
      return
    }

    // Test StarSender / Internal
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
    <div className="space-y-6 outline-none">
      <Tabs defaultValue="starsender" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-1">
            <h3 className="text-lg font-medium leading-none">Provider WhatsApp</h3>
            <p className="text-sm text-muted-foreground">Pilih provider yang akan digunakan untuk mengirim pesan platform.</p>
          </div>
          <TabsList className="bg-muted/50 rounded-xl p-1 border flex-wrap h-auto">
            <TabsTrigger value="starsender" className="rounded-lg">StarSender API</TabsTrigger>
            <TabsTrigger value="meta" className="rounded-lg">Meta Official API</TabsTrigger>
            <TabsTrigger value="wavio" className="rounded-lg">Wavio API</TabsTrigger>
          </TabsList>
        </div>
        
        <div className="mb-6 rounded-xl border bg-card p-4">
           <Label className="mb-2 block">Aktifkan Provider Pengiriman Utama</Label>
           <select 
             value={form.WA_ACTIVE_PROVIDER} 
             onChange={e => {
               setForm({...form, WA_ACTIVE_PROVIDER: e.target.value});
               handleSaveBatch(['WA_ACTIVE_PROVIDER'], { WA_ACTIVE_PROVIDER: e.target.value });
             }} 
             className="flex h-10 w-full md:w-1/3 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
           >
             <option value="starsender">StarSender API</option>
             <option value="meta">Meta Official API</option>
             <option value="wavio">Wavio API</option>
           </select>
           <p className="text-xs text-muted-foreground mt-2">Pilih gateway mana yang aktif untuk notifikasi otomatis platform (seperti alert pendaftaran baru).</p>
        </div>

        <TabsContent value="starsender" className="mt-0 outline-none grid gap-6 lg:grid-cols-2">
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
                  <Label>Delay Minimum (Detik)</Label>
                  <Input 
                    type="number" 
                    value={form.STARSENDER_DELAY_MIN} 
                    onChange={e => setForm({...form, STARSENDER_DELAY_MIN: e.target.value})} 
                    className="rounded-xl" 
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Delay Maksimum (Detik)</Label>
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
                Penundaan waktu (jeda) acak sebelum pesan terkirim. Membantu menghindari blokir WhatsApp karena terdeteksi mengirim pesan terlalu cepat.
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
        </TabsContent>

        {/* TAB: META OFFICIAL API */}
        <TabsContent value="meta" className="mt-0 outline-none grid gap-6 lg:grid-cols-2">
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
                  <button type="button" onClick={() => setShowWAToken(!showWAToken)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showWAToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                </div>
              </div>
              <Button className="w-full gap-2 btn-gradient text-white border-0 rounded-xl mt-2" onClick={() => handleSaveBatch(['META_WA_PHONE_NUMBER_ID', 'META_WA_BUSINESS_ACCOUNT_ID', 'META_WA_ACCESS_TOKEN'])} disabled={saving}>
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
        </TabsContent>

        {/* TAB: WAVIO API */}
        <TabsContent value="wavio" className="mt-0 outline-none grid gap-6 lg:grid-cols-2">
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
        </TabsContent>
      </Tabs>

      <Card className="glass border-0 lg:col-span-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10"><Settings2 className="h-4 w-4 text-blue-500" /></div>
            <CardTitle className="text-lg">Template Pesan WhatsApp</CardTitle>
          </div>
          <CardDescription>Gunakan variabel dinamis seperti {'{{adminName}}, {{schoolName}}, {{adminEmail}}, {{tempPwd}}, {{schoolSlug}}, {{adminMessage}}, {{adminPhone}}, {{affiliateName}}, {{referralCode}}'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                <Label className="text-emerald-600 font-bold">1. Pendaftaran Diterima (PENDING)</Label>
                <div className="flex items-center gap-4 mt-1 sm:mt-0">
                  <div className="flex items-center gap-1.5"><span className="text-[10px] uppercase font-bold text-muted-foreground">WA</span><Switch checked={form.WA_ENABLE_PENDING === "true"} onCheckedChange={(checked) => setForm({...form, WA_ENABLE_PENDING: checked ? "true" : "false"})} /></div>
                  <div className="flex items-center gap-1.5"><span className="text-[10px] uppercase font-bold text-muted-foreground">Email</span><Switch checked={form.EMAIL_ENABLE_PENDING === "true"} onCheckedChange={(checked) => setForm({...form, EMAIL_ENABLE_PENDING: checked ? "true" : "false"})} /></div>
                </div>
              </div>
              <Textarea value={form.WA_TEMPLATE_PENDING} onChange={e => setForm({...form, WA_TEMPLATE_PENDING: e.target.value})} placeholder={`Halo {{adminName}},\nSelamat! Pendaftaran {{schoolName}} diterima.`} className="min-h-[100px] text-xs font-mono" disabled={form.WA_ENABLE_PENDING !== "true" && form.EMAIL_ENABLE_PENDING !== "true"} />
            </div>
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                <Label className="text-blue-600 font-bold">2. Pendaftaran Disetujui (APPROVED)</Label>
                <div className="flex items-center gap-4 mt-1 sm:mt-0">
                  <div className="flex items-center gap-1.5"><span className="text-[10px] uppercase font-bold text-muted-foreground">WA</span><Switch checked={form.WA_ENABLE_APPROVED === "true"} onCheckedChange={(checked) => setForm({...form, WA_ENABLE_APPROVED: checked ? "true" : "false"})} /></div>
                  <div className="flex items-center gap-1.5"><span className="text-[10px] uppercase font-bold text-muted-foreground">Email</span><Switch checked={form.EMAIL_ENABLE_APPROVED === "true"} onCheckedChange={(checked) => setForm({...form, EMAIL_ENABLE_APPROVED: checked ? "true" : "false"})} /></div>
                </div>
              </div>
              <Textarea value={form.WA_TEMPLATE_APPROVED} onChange={e => setForm({...form, WA_TEMPLATE_APPROVED: e.target.value})} placeholder={`Halo {{adminName}},\nPendaftaran {{schoolName}} disetujui. URL: {{loginUrl}}`} className="min-h-[100px] text-xs font-mono" disabled={form.WA_ENABLE_APPROVED !== "true" && form.EMAIL_ENABLE_APPROVED !== "true"} />
            </div>
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                <Label className="text-amber-600 font-bold">3. Revisi Data (REVISION)</Label>
                <div className="flex items-center gap-4 mt-1 sm:mt-0">
                  <div className="flex items-center gap-1.5"><span className="text-[10px] uppercase font-bold text-muted-foreground">WA</span><Switch checked={form.WA_ENABLE_REVISION === "true"} onCheckedChange={(checked) => setForm({...form, WA_ENABLE_REVISION: checked ? "true" : "false"})} /></div>
                  <div className="flex items-center gap-1.5"><span className="text-[10px] uppercase font-bold text-muted-foreground">Email</span><Switch checked={form.EMAIL_ENABLE_REVISION === "true"} onCheckedChange={(checked) => setForm({...form, EMAIL_ENABLE_REVISION: checked ? "true" : "false"})} /></div>
                </div>
              </div>
              <Textarea value={form.WA_TEMPLATE_REVISION} onChange={e => setForm({...form, WA_TEMPLATE_REVISION: e.target.value})} placeholder={`Halo {{adminName}},\nRevisi: {{adminMessage}}\n\nKlik disini: {{revisionUrl}}`} className="min-h-[100px] text-xs font-mono" disabled={form.WA_ENABLE_REVISION !== "true" && form.EMAIL_ENABLE_REVISION !== "true"} />
            </div>
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                <Label className="text-red-600 font-bold">4. Pendaftaran Ditolak (REJECTED)</Label>
                <div className="flex items-center gap-4 mt-1 sm:mt-0">
                  <div className="flex items-center gap-1.5"><span className="text-[10px] uppercase font-bold text-muted-foreground">WA</span><Switch checked={form.WA_ENABLE_REJECTED === "true"} onCheckedChange={(checked) => setForm({...form, WA_ENABLE_REJECTED: checked ? "true" : "false"})} /></div>
                  <div className="flex items-center gap-1.5"><span className="text-[10px] uppercase font-bold text-muted-foreground">Email</span><Switch checked={form.EMAIL_ENABLE_REJECTED === "true"} onCheckedChange={(checked) => setForm({...form, EMAIL_ENABLE_REJECTED: checked ? "true" : "false"})} /></div>
                </div>
              </div>
              <Textarea value={form.WA_TEMPLATE_REJECTED} onChange={e => setForm({...form, WA_TEMPLATE_REJECTED: e.target.value})} placeholder={`Halo {{adminName}},\nDitolak: {{adminMessage}}`} className="min-h-[100px] text-xs font-mono" disabled={form.WA_ENABLE_REJECTED !== "true" && form.EMAIL_ENABLE_REJECTED !== "true"} />
            </div>
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                <Label className="text-purple-600 font-bold">5. Alert ke Super Admin</Label>
                <div className="flex items-center gap-4 mt-1 sm:mt-0">
                  <div className="flex items-center gap-1.5"><span className="text-[10px] uppercase font-bold text-muted-foreground">WA</span><Switch checked={form.WA_ENABLE_ALERT_SUPERADMIN === "true"} onCheckedChange={(checked) => setForm({...form, WA_ENABLE_ALERT_SUPERADMIN: checked ? "true" : "false"})} /></div>
                  <div className="flex items-center gap-1.5"><span className="text-[10px] uppercase font-bold text-muted-foreground">Email</span><Switch checked={form.EMAIL_ENABLE_ALERT_SUPERADMIN === "true"} onCheckedChange={(checked) => setForm({...form, EMAIL_ENABLE_ALERT_SUPERADMIN: checked ? "true" : "false"})} /></div>
                </div>
              </div>
              <Textarea value={form.WA_TEMPLATE_ALERT_SUPERADMIN} onChange={e => setForm({...form, WA_TEMPLATE_ALERT_SUPERADMIN: e.target.value})} placeholder={`Sekolah Baru: {{schoolName}}\nWA: {{adminPhone}}`} className="min-h-[100px] text-xs font-mono" disabled={form.WA_ENABLE_ALERT_SUPERADMIN !== "true" && form.EMAIL_ENABLE_ALERT_SUPERADMIN !== "true"} />
            </div>
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                <Label className="text-orange-600 font-bold">6. Alert ke Marketer (Afiliasi)</Label>
                <div className="flex items-center gap-4 mt-1 sm:mt-0">
                  <div className="flex items-center gap-1.5"><span className="text-[10px] uppercase font-bold text-muted-foreground">WA</span><Switch checked={form.WA_ENABLE_ALERT_AFFILIATE === "true"} onCheckedChange={(checked) => setForm({...form, WA_ENABLE_ALERT_AFFILIATE: checked ? "true" : "false"})} /></div>
                  <div className="flex items-center gap-1.5"><span className="text-[10px] uppercase font-bold text-muted-foreground">Email</span><Switch checked={form.EMAIL_ENABLE_ALERT_AFFILIATE === "true"} onCheckedChange={(checked) => setForm({...form, EMAIL_ENABLE_ALERT_AFFILIATE: checked ? "true" : "false"})} /></div>
                </div>
              </div>
              <Textarea value={form.WA_TEMPLATE_ALERT_AFFILIATE} onChange={e => setForm({...form, WA_TEMPLATE_ALERT_AFFILIATE: e.target.value})} placeholder={`Halo {{affiliateName}},\nLead baru: {{schoolName}}`} className="min-h-[100px] text-xs font-mono" disabled={form.WA_ENABLE_ALERT_AFFILIATE !== "true" && form.EMAIL_ENABLE_ALERT_AFFILIATE !== "true"} />
            </div>
          </div>

          <div className="border-t pt-6 mt-6">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="h-4 w-4 text-indigo-500" />
              <h4 className="font-bold text-base">Template Notifikasi Billing</h4>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Variabel: {'{{tenantName}}, {{reference}}, {{amount}}, {{expiredAt}}, {{expiresAt}}, {{invoiceType}}, {{bankName}}, {{bankNumber}}, {{bankAccountName}}, {{adminWA}}, {{studentQuota}}, {{affiliateName}}, {{commissionAmount}}, {{currentBalance}}, {{daysRemaining}}, {{urgency}}'}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                  <Label className="text-indigo-600 font-bold">7. Invoice Dibuat → Tenant</Label>
                  <div className="flex items-center gap-4 mt-1 sm:mt-0">
                    <div className="flex items-center gap-1.5"><span className="text-[10px] uppercase font-bold text-muted-foreground">WA</span><Switch checked={form.WA_ENABLE_INVOICE_CREATED === "true"} onCheckedChange={(checked) => setForm({...form, WA_ENABLE_INVOICE_CREATED: checked ? "true" : "false"})} /></div>
                    <div className="flex items-center gap-1.5"><span className="text-[10px] uppercase font-bold text-muted-foreground">Email</span><Switch checked={form.EMAIL_ENABLE_INVOICE_CREATED === "true"} onCheckedChange={(checked) => setForm({...form, EMAIL_ENABLE_INVOICE_CREATED: checked ? "true" : "false"})} /></div>
                  </div>
                </div>
                <Textarea value={form.WA_TEMPLATE_INVOICE_CREATED} onChange={e => setForm({...form, WA_TEMPLATE_INVOICE_CREATED: e.target.value})} className="min-h-[120px] text-xs font-mono" disabled={form.WA_ENABLE_INVOICE_CREATED !== "true" && form.EMAIL_ENABLE_INVOICE_CREATED !== "true"} />
              </div>
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                  <Label className="text-green-600 font-bold">8. Pembayaran Dikonfirmasi → Tenant</Label>
                  <div className="flex items-center gap-4 mt-1 sm:mt-0">
                    <div className="flex items-center gap-1.5"><span className="text-[10px] uppercase font-bold text-muted-foreground">WA</span><Switch checked={form.WA_ENABLE_PAYMENT_CONFIRMED === "true"} onCheckedChange={(checked) => setForm({...form, WA_ENABLE_PAYMENT_CONFIRMED: checked ? "true" : "false"})} /></div>
                    <div className="flex items-center gap-1.5"><span className="text-[10px] uppercase font-bold text-muted-foreground">Email</span><Switch checked={form.EMAIL_ENABLE_PAYMENT_CONFIRMED === "true"} onCheckedChange={(checked) => setForm({...form, EMAIL_ENABLE_PAYMENT_CONFIRMED: checked ? "true" : "false"})} /></div>
                  </div>
                </div>
                <Textarea value={form.WA_TEMPLATE_PAYMENT_CONFIRMED} onChange={e => setForm({...form, WA_TEMPLATE_PAYMENT_CONFIRMED: e.target.value})} className="min-h-[120px] text-xs font-mono" disabled={form.WA_ENABLE_PAYMENT_CONFIRMED !== "true" && form.EMAIL_ENABLE_PAYMENT_CONFIRMED !== "true"} />
              </div>
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                  <Label className="text-amber-600 font-bold">9. Komisi Masuk → Afiliasi</Label>
                  <div className="flex items-center gap-4 mt-1 sm:mt-0">
                    <div className="flex items-center gap-1.5"><span className="text-[10px] uppercase font-bold text-muted-foreground">WA</span><Switch checked={form.WA_ENABLE_AFFILIATE_COMMISSION === "true"} onCheckedChange={(checked) => setForm({...form, WA_ENABLE_AFFILIATE_COMMISSION: checked ? "true" : "false"})} /></div>
                    <div className="flex items-center gap-1.5"><span className="text-[10px] uppercase font-bold text-muted-foreground">Email</span><Switch checked={form.EMAIL_ENABLE_AFFILIATE_COMMISSION === "true"} onCheckedChange={(checked) => setForm({...form, EMAIL_ENABLE_AFFILIATE_COMMISSION: checked ? "true" : "false"})} /></div>
                  </div>
                </div>
                <Textarea value={form.WA_TEMPLATE_AFFILIATE_COMMISSION} onChange={e => setForm({...form, WA_TEMPLATE_AFFILIATE_COMMISSION: e.target.value})} className="min-h-[120px] text-xs font-mono" disabled={form.WA_ENABLE_AFFILIATE_COMMISSION !== "true" && form.EMAIL_ENABLE_AFFILIATE_COMMISSION !== "true"} />
              </div>
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                  <Label className="text-red-600 font-bold">10. Pengingat Langganan → Tenant</Label>
                  <div className="flex items-center gap-4 mt-1 sm:mt-0">
                    <div className="flex items-center gap-1.5"><span className="text-[10px] uppercase font-bold text-muted-foreground">WA</span><Switch checked={form.WA_ENABLE_SUBSCRIPTION_REMINDER === "true"} onCheckedChange={(checked) => setForm({...form, WA_ENABLE_SUBSCRIPTION_REMINDER: checked ? "true" : "false"})} /></div>
                    <div className="flex items-center gap-1.5"><span className="text-[10px] uppercase font-bold text-muted-foreground">Email</span><Switch checked={form.EMAIL_ENABLE_SUBSCRIPTION_REMINDER === "true"} onCheckedChange={(checked) => setForm({...form, EMAIL_ENABLE_SUBSCRIPTION_REMINDER: checked ? "true" : "false"})} /></div>
                  </div>
                </div>
                <Textarea value={form.WA_TEMPLATE_SUBSCRIPTION_REMINDER} onChange={e => setForm({...form, WA_TEMPLATE_SUBSCRIPTION_REMINDER: e.target.value})} className="min-h-[120px] text-xs font-mono" disabled={form.WA_ENABLE_SUBSCRIPTION_REMINDER !== "true" && form.EMAIL_ENABLE_SUBSCRIPTION_REMINDER !== "true"} />
              </div>
            </div>
          </div>

          <Button 
            className="w-full gap-2 btn-gradient text-white border-0 rounded-xl" 
            onClick={() => handleSaveBatch([
              'WA_TEMPLATE_PENDING', 'WA_ENABLE_PENDING', 'EMAIL_ENABLE_PENDING',
              'WA_TEMPLATE_APPROVED', 'WA_ENABLE_APPROVED', 'EMAIL_ENABLE_APPROVED',
              'WA_TEMPLATE_REVISION', 'WA_ENABLE_REVISION', 'EMAIL_ENABLE_REVISION',
              'WA_TEMPLATE_REJECTED', 'WA_ENABLE_REJECTED', 'EMAIL_ENABLE_REJECTED',
              'WA_TEMPLATE_ALERT_SUPERADMIN', 'WA_ENABLE_ALERT_SUPERADMIN', 'EMAIL_ENABLE_ALERT_SUPERADMIN',
              'WA_TEMPLATE_ALERT_AFFILIATE', 'WA_ENABLE_ALERT_AFFILIATE', 'EMAIL_ENABLE_ALERT_AFFILIATE',
              'WA_TEMPLATE_INVOICE_CREATED', 'WA_ENABLE_INVOICE_CREATED', 'EMAIL_ENABLE_INVOICE_CREATED',
              'WA_TEMPLATE_PAYMENT_CONFIRMED', 'WA_ENABLE_PAYMENT_CONFIRMED', 'EMAIL_ENABLE_PAYMENT_CONFIRMED',
              'WA_TEMPLATE_AFFILIATE_COMMISSION', 'WA_ENABLE_AFFILIATE_COMMISSION', 'EMAIL_ENABLE_AFFILIATE_COMMISSION',
              'WA_TEMPLATE_SUBSCRIPTION_REMINDER', 'WA_ENABLE_SUBSCRIPTION_REMINDER', 'EMAIL_ENABLE_SUBSCRIPTION_REMINDER'
            ])} 
            disabled={saving}
          >
            <Save className="h-4 w-4" /> Simpan Semua Template Pesan
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
