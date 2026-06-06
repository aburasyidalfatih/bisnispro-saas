import React from"react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { Input } from"@/components/ui/input"
import { Label } from"@/components/ui/label"
import { KeyRound, Globe, Save } from"lucide-react"

interface IntegrationSettingsProps {
  session: any
  orgForm: { googleClientId: string; googleClientSecret: string }
  setOrgForm: React.Dispatch<React.SetStateAction<{ googleClientId: string; googleClientSecret: string }>>
  rawSettings: any
  setRawSettings: React.Dispatch<React.SetStateAction<any>>
  savingOrg: boolean
  tenantId: string | null
  handleSaveOrg: () => Promise<void>
}

export function IntegrationSettings({
  session, orgForm, setOrgForm, rawSettings, setRawSettings, savingOrg, tenantId, handleSaveOrg
}: IntegrationSettingsProps) {
  return (
    <Card className="glass border-0">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <KeyRound className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Integrasi & Autentikasi</CardTitle>
            <CardDescription>Pengaturan OAuth untuk tenant</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Google OAuth Tenant */}
        <div className="space-y-2 p-4 rounded-xl border border-red-500/20 bg-red-500/5">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-4 w-4 text-red-500" />
            <Label className="font-semibold text-red-600">Google Login (OAuth 2.0)</Label>
          </div>
          <p className="text-[11px] text-muted-foreground mb-3">Isi kredensial ini jika ingin mengaktifkan"Login dengan Google" khusus untuk sekolah Anda. Authorized redirect URI: <code className="bg-white/50 px-1 rounded">https://{session?.user?.tenants?.[0]?.slug ||"sub"}.schoolpro.id/api/auth/callback/google</code></p>
          
          <div className="space-y-1.5">
            <Label className="text-xs">Client ID</Label>
            <Input value={orgForm.googleClientId} onChange={e => setOrgForm(p => ({ ...p, googleClientId: e.target.value }))} placeholder="Google Client ID" className="rounded-xl h-9 text-xs font-mono" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Client Secret</Label>
            <Input type="password" value={orgForm.googleClientSecret} onChange={e => setOrgForm(p => ({ ...p, googleClientSecret: e.target.value }))} placeholder="Google Client Secret" className="rounded-xl h-9 text-xs font-mono" />
          </div>
        </div>
        {/* Google Indexing API Tenant */}
        <div className="space-y-2 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 mt-4">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-4 w-4 text-blue-500" />
            <Label className="font-semibold text-blue-600">Google Indexing API (SEO)</Label>
          </div>
          <p className="text-[11px] text-muted-foreground mb-3">Masukkan kredensial Service Account Google Cloud untuk melakukan indeksasi instan setiap kali Anda mempublikasikan berita/pengumuman. Jika dikosongkan, sistem akan menggunakan sistem indeksasi bawaan SchoolPro.</p>
          
          <div className="space-y-1.5">
            <Label className="text-xs">Client Email</Label>
            <Input value={rawSettings.googleIndexingEmail ||""} onChange={e => setRawSettings((p:any) => ({ ...p, googleIndexingEmail: e.target.value }))} placeholder="nama-akun@project-id.iam.gserviceaccount.com" className="rounded-xl h-9 text-xs font-mono" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Private Key (JSON)</Label>
            <Input type="password" value={rawSettings.googleIndexingKey ||""} onChange={e => setRawSettings((p:any) => ({ ...p, googleIndexingKey: e.target.value }))} placeholder="-----BEGIN PRIVATE KEY-----\n..." className="rounded-xl h-9 text-xs font-mono" />
          </div>
        </div>

        <button className="flex items-center justify-center btn-gradient text-white border-0 rounded-xl w-full gap-2 h-9 mt-4" onClick={handleSaveOrg} disabled={savingOrg || !tenantId}>
          {savingOrg ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-3.5 w-3.5" />}
          Simpan Integrasi
        </button>
      </CardContent>
    </Card>
  )
}
