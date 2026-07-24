import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Save, Contact } from "lucide-react"

export function GoogleContactsTab({
  form,
  setForm,
  handleSaveBatch,
  saving
}: {
  form: any;
  setForm: any;
  handleSaveBatch: (fields: string[], overrides?: any) => Promise<void>;
  saving: boolean;
}) {
  const fields = ["GOOGLE_CONTACTS_CLIENT_ID", "GOOGLE_CONTACTS_CLIENT_SECRET", "GOOGLE_CONTACTS_REFRESH_TOKEN"]

  return (
    <div className="space-y-6 max-w-4xl">
      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Contact className="h-5 w-5 text-blue-500" />
            Integrasi Google Contacts
          </CardTitle>
          <CardDescription>
            Masukkan kredensial OAuth 2.0 untuk menyinkronkan kontak penanggung jawab Tenant/Perusahaan langsung ke akun Google Admin Anda secara massal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Client ID</Label>
              <Input
                placeholder="Google OAuth Client ID"
                value={form.GOOGLE_CONTACTS_CLIENT_ID}
                onChange={(e) => setForm({ ...form, GOOGLE_CONTACTS_CLIENT_ID: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Client Secret</Label>
              <Input
                type="password"
                placeholder="Google OAuth Client Secret"
                value={form.GOOGLE_CONTACTS_CLIENT_SECRET}
                onChange={(e) => setForm({ ...form, GOOGLE_CONTACTS_CLIENT_SECRET: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Refresh Token</Label>
              <Input
                type="password"
                placeholder="Refresh Token dari Google Playground"
                value={form.GOOGLE_CONTACTS_REFRESH_TOKEN}
                onChange={(e) => setForm({ ...form, GOOGLE_CONTACTS_REFRESH_TOKEN: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Gunakan Google OAuth 2.0 Playground dengan scope <code className="bg-muted px-1 rounded">https://www.googleapis.com/auth/contacts</code> untuk men-generate Refresh Token abadi.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border/50">
            <Button 
              onClick={() => handleSaveBatch(fields)} 
              disabled={saving}
              className="gap-2 rounded-xl"
            >
              <Save className="h-4 w-4" />
              {saving ? "Menyimpan..." : "Simpan Kredensial"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
