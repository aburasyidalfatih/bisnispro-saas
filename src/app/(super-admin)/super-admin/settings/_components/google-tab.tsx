import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Globe, Save, Eye, EyeOff, ExternalLink, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SettingsForm } from "../constants"

interface GoogleTabProps {
  form: SettingsForm;
  setForm: React.Dispatch<React.SetStateAction<SettingsForm>>;
  handleSaveBatch: (fields: string[], overrides?: Record<string, string>) => Promise<void>;
  saving: boolean;
}

export function GoogleTab({ form, setForm, handleSaveBatch, saving }: GoogleTabProps) {
  const [showPass, setShowPass] = useState(false)

  return (
    <div className="grid gap-6 lg:grid-cols-2 outline-none">
      <Card className="glass border-0">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-red-500" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
            </div>
            <CardTitle className="text-lg">Google Login (OAuth 2.0)</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Kredensial ini digunakan untuk login Super Admin dan pendaftaran Mitra Afiliasi secara otomatis di domain utama.</p>
          
          <div className="space-y-2">
            <Label>Client ID</Label>
            <Input value={form.GOOGLE_CLIENT_ID} onChange={e => setForm({...form, GOOGLE_CLIENT_ID: e.target.value})} placeholder="Masukkan Google Client ID" className="rounded-xl font-mono text-xs" />
          </div>
          <div className="space-y-2">
            <Label>Client Secret</Label>
            <Input type="password" value={form.GOOGLE_CLIENT_SECRET} onChange={e => setForm({...form, GOOGLE_CLIENT_SECRET: e.target.value})} placeholder="Masukkan Google Client Secret" className="rounded-xl font-mono text-xs" />
          </div>
          <Button className="w-full gap-2 btn-gradient text-white border-0 rounded-xl mt-2" onClick={() => handleSaveBatch(['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'])} disabled={saving}>
            <Save className="h-4 w-4" /> Simpan Kredensial
          </Button>
        </CardContent>
      </Card>

      <Card className="glass border-0">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10">
              <Globe className="h-4 w-4 text-blue-500" />
            </div>
            <CardTitle className="text-lg">Google Indexing API (SEO)</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Kredensial ini digunakan sebagai <i>fallback</i> jika sekolah/tenant tidak mengatur kredensial Indexing mereka sendiri. Berguna untuk meminta Google mengindeks artikel secara instan.</p>
          
          <div className="space-y-2">
            <Label>Client Email</Label>
            <Input value={form.GOOGLE_INDEXING_CLIENT_EMAIL} onChange={e => setForm({...form, GOOGLE_INDEXING_CLIENT_EMAIL: e.target.value})} placeholder="nama-akun@project-id.iam.gserviceaccount.com" className="rounded-xl font-mono text-xs" />
          </div>
          <div className="space-y-2">
            <Label>Private Key (JSON)</Label>
            <div className="relative">
              <Input type={showPass ? "text" : "password"} value={form.GOOGLE_INDEXING_PRIVATE_KEY} onChange={e => setForm({...form, GOOGLE_INDEXING_PRIVATE_KEY: e.target.value})} placeholder="-----BEGIN PRIVATE KEY-----\n..." className="rounded-xl font-mono text-xs pr-10" />
              <Button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
            </div>
          </div>
          <Button className="w-full gap-2 btn-gradient text-white border-0 rounded-xl mt-2" onClick={() => handleSaveBatch(['GOOGLE_INDEXING_CLIENT_EMAIL', 'GOOGLE_INDEXING_PRIVATE_KEY'])} disabled={saving}>
            <Save className="h-4 w-4" /> Simpan Kredensial Indexing
          </Button>
        </CardContent>
      </Card>

      <Card className="glass border-0">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10">
              <ShieldCheck className="h-4 w-4 text-orange-500" />
            </div>
            <CardTitle className="text-lg">Keamanan Cloudflare Turnstile</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Konfigurasi Cloudflare Turnstile untuk mencegah serangan bot dan spam pada halaman Login Super Admin.</p>
          
          <Button
            onClick={() => {
              const newVal = form.TURNSTILE_ENABLED === "true" ? "false" : "true"
              setForm({...form, TURNSTILE_ENABLED: newVal})
              handleSaveBatch(['TURNSTILE_ENABLED'], { TURNSTILE_ENABLED: newVal })
            }}
            className={cn(
              "flex w-full items-center justify-between rounded-xl border-2 p-4 transition-all duration-200 text-left mb-4 mt-4",
              form.TURNSTILE_ENABLED === "true" ? "border-primary bg-primary/5" : "border-transparent bg-muted/50 hover:bg-muted"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", form.TURNSTILE_ENABLED === "true" ? "bg-primary/10" : "bg-muted")}>
                <ShieldCheck className={cn("h-5 w-5", form.TURNSTILE_ENABLED === "true" ? "text-primary" : "text-muted-foreground")} />
              </div>
              <div>
                <p className="font-medium text-sm">Aktifkan Turnstile</p>
                <p className="text-xs text-muted-foreground">Wajibkan CAPTCHA pada halaman login</p>
              </div>
            </div>
            <div className={cn("h-2.5 w-2.5 rounded-full", form.TURNSTILE_ENABLED === "true" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-muted-foreground/30")} />
          </Button>

          <div className="space-y-2">
            <Label>Site Key</Label>
            <Input value={form.TURNSTILE_SITE_KEY} onChange={e => setForm({...form, TURNSTILE_SITE_KEY: e.target.value})} placeholder="Masukkan Site Key" className="rounded-xl font-mono text-xs" />
          </div>
          <div className="space-y-2">
            <Label>Secret Key</Label>
            <Input type="password" value={form.TURNSTILE_SECRET_KEY} onChange={e => setForm({...form, TURNSTILE_SECRET_KEY: e.target.value})} placeholder="Masukkan Secret Key" className="rounded-xl font-mono text-xs" />
          </div>
          <Button className="w-full gap-2 btn-gradient text-white border-0 rounded-xl mt-2" onClick={() => handleSaveBatch(['TURNSTILE_SITE_KEY', 'TURNSTILE_SECRET_KEY'])} disabled={saving}>
            <Save className="h-4 w-4" /> Simpan Kredensial
          </Button>
        </CardContent>
      </Card>


      <Card className="glass border-0">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10"><ExternalLink className="h-4 w-4 text-primary" /></div>
            <CardTitle className="text-lg">Panduan Singkat</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-sm space-y-4 text-muted-foreground">
          <p>Untuk mendapatkan Client ID dan Secret:</p>
          <ol className="list-decimal pl-4 space-y-2">
            <li>Buka <a href="https://console.cloud.google.com" target="_blank" className="text-primary hover:underline font-medium">Google Cloud Console</a>.</li>
            <li>Pilih atau buat project baru.</li>
            <li>Masuk ke menu <strong>APIs & Services &gt; Credentials</strong>.</li>
            <li>Klik <strong>Create Credentials &gt; OAuth client ID</strong>.</li>
            <li>Pilih <strong>Web application</strong>.</li>
            <li>Pada <strong>Authorized redirect URIs</strong>, tambahkan URL berikut:
              <code className="block mt-1 bg-muted p-2 rounded-lg text-xs break-all text-foreground font-semibold">https://schoolpro.my.id/api/auth/callback/google</code>
              <code className="block mt-1 bg-muted p-2 rounded-lg text-xs break-all text-foreground font-semibold">https://schoolpro.id/api/auth/callback/google</code>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
