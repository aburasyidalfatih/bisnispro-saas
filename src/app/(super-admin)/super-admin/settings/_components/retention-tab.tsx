import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Megaphone, Save } from "lucide-react"
import type { SettingsForm } from "../constants"

interface RetentionTabProps {
  form: SettingsForm;
  setForm: React.Dispatch<React.SetStateAction<SettingsForm>>;
  handleSaveBatch: (fields: string[], overrides?: Record<string, string>) => Promise<void>;
  saving: boolean;
}

export function RetentionTab({ form, setForm, handleSaveBatch, saving }: RetentionTabProps) {
  return (
    <div className="grid gap-6 outline-none">
      <Card className="glass border-0 shadow-sm overflow-hidden col-span-full">
        <CardHeader className="border-b bg-white/50">
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            Pesan Retensi & Penagihan (30 Hari)
          </CardTitle>
          <CardDescription>Sesuaikan pesan yang dikirim ke tenant yang tidak aktif selama 30 hari.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid gap-2">
            <Label>Subjek Email</Label>
            <Input value={form.RETENTION_30_EMAIL_SUBJECT} onChange={e => setForm({...form, RETENTION_30_EMAIL_SUBJECT: e.target.value})} />
          </div>
          <div className="grid gap-2">
            <Label>Isi Email (HTML)</Label>
            <Textarea rows={6} value={form.RETENTION_30_EMAIL_BODY} onChange={e => setForm({...form, RETENTION_30_EMAIL_BODY: e.target.value})} className="font-mono text-sm" />
            <p className="text-xs text-muted-foreground">Gunakan <code>{"{nama_sekolah}"}</code> untuk variabel dinamis.</p>
          </div>
          <div className="grid gap-2">
            <Label>Pesan WhatsApp</Label>
            <Textarea rows={4} value={form.RETENTION_30_WA} onChange={e => setForm({...form, RETENTION_30_WA: e.target.value})} />
            <p className="text-xs text-muted-foreground">Gunakan <code>{"{nama_sekolah}"}</code> untuk variabel dinamis.</p>
          </div>

          <Button 
            className="w-full gap-2 btn-gradient text-white border-0 rounded-xl"
            onClick={() => handleSaveBatch(['RETENTION_30_EMAIL_SUBJECT', 'RETENTION_30_EMAIL_BODY', 'RETENTION_30_WA'])}
            disabled={saving}
          >
            {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-4 w-4" />}
            Simpan Pesan Retensi
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
