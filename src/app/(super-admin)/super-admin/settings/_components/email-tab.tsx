import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Save, Send, Eye, EyeOff } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { SettingsForm } from "../constants"

interface EmailTabProps {
  form: SettingsForm;
  setForm: React.Dispatch<React.SetStateAction<SettingsForm>>;
  handleSaveBatch: (fields: string[], overrides?: Record<string, string>) => Promise<void>;
  saving: boolean;
}

export function EmailTab({ form, setForm, handleSaveBatch, saving }: EmailTabProps) {
  const [showPass, setShowPass] = useState(false)
  const [testEmail, setTestEmail] = useState("")
  const [testing, setTesting] = useState(false)

  const handleTestEmail = async () => {
    if (!testEmail) { toast({ title: "Isi email tujuan", variant: "destructive" }); return }
    setTesting(true)
    try {
      const res = await fetch("/api/tenant/settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "smtp",
          smtpHost: form.SMTP_HOST, 
          smtpPort: Number(form.SMTP_PORT),
          smtpUser: form.SMTP_USER, 
          smtpPass: form.SMTP_PASS,
          smtpFrom: form.SMTP_FROM || form.SMTP_USER, 
          smtpTo: testEmail,
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
    <div className="grid gap-6 lg:grid-cols-2 outline-none">
      <Card className="glass border-0">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10"><Mail className="h-4 w-4 text-blue-500" /></div>
            <CardTitle className="text-lg">Konfigurasi SMTP</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-2">
              <Label>SMTP Host</Label>
              <Input value={form.SMTP_HOST} onChange={e => setForm({...form, SMTP_HOST: e.target.value})} placeholder="smtp.mailketing.co.id" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Port</Label>
              <Input value={form.SMTP_PORT} onChange={e => setForm({...form, SMTP_PORT: e.target.value})} placeholder="587" className="rounded-xl" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Username</Label>
            <Input value={form.SMTP_USER} onChange={e => setForm({...form, SMTP_USER: e.target.value})} placeholder="user@domain.com" className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Password / API Key</Label>
            <div className="relative">
              <Input type={showPass ? "text" : "password"} value={form.SMTP_PASS} onChange={e => setForm({...form, SMTP_PASS: e.target.value})} placeholder="••••••••" className="rounded-xl pr-10" />
              <Button variant="ghost" size="icon" type="button" onClick={() => setShowPass(!showPass)} className="absolute right-1 h-8 w-8 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email Pengirim (From)</Label>
            <Input value={form.SMTP_FROM} onChange={e => setForm({...form, SMTP_FROM: e.target.value})} placeholder="noreply@schoolpro.id" className="rounded-xl" />
          </div>
          <Button className="w-full gap-2 btn-gradient text-white border-0 rounded-xl mt-2" onClick={() => handleSaveBatch(['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'])} disabled={saving}>
            <Save className="h-4 w-4" /> Simpan SMTP
          </Button>
        </CardContent>
      </Card>

      <Card className="glass border-0">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10"><Send className="h-4 w-4 text-emerald-500" /></div>
            <CardTitle className="text-lg">Uji Coba Pengiriman</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Email Tujuan</Label>
            <Input value={testEmail} onChange={e => setTestEmail(e.target.value)} type="email" placeholder="tujuan@gmail.com" className="rounded-xl" />
          </div>
          <Button variant="outline" className="w-full rounded-xl gap-2 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/5" onClick={handleTestEmail} disabled={testing || !form.SMTP_HOST}>
            {testing ? "Mengirim..." : "Kirim Email Test"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
