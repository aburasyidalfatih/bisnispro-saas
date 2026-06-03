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
            Pesan Retensi - 30 Hari (Peringatan)
          </CardTitle>
          <CardDescription>Pesan peringatan ketika tenant tidak login selama 30 hari.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid gap-2">
            <Label>Subjek Email</Label>
            <Input value={form.RETENTION_30_EMAIL_SUBJECT} onChange={e => setForm({...form, RETENTION_30_EMAIL_SUBJECT: e.target.value})} />
          </div>
          <div className="grid gap-2">
            <Label>Isi Email (HTML)</Label>
            <Textarea rows={4} value={form.RETENTION_30_EMAIL_BODY} onChange={e => setForm({...form, RETENTION_30_EMAIL_BODY: e.target.value})} className="font-mono text-sm" />
            <p className="text-xs text-muted-foreground">Gunakan <code>{"{nama_sekolah}"}</code> untuk variabel dinamis.</p>
          </div>
          <div className="grid gap-2">
            <Label>Pesan WhatsApp</Label>
            <Textarea rows={3} value={form.RETENTION_30_WA} onChange={e => setForm({...form, RETENTION_30_WA: e.target.value})} />
            <p className="text-xs text-muted-foreground">Gunakan <code>{"{nama_sekolah}"}</code> untuk variabel dinamis.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-0 shadow-sm overflow-hidden col-span-full">
        <CardHeader className="border-b bg-white/50">
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-amber-500" />
            Pesan Retensi - 60 Hari (Suspend)
          </CardTitle>
          <CardDescription>Pemberitahuan bahwa website telah ditangguhkan karena tidak aktif 60 hari.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid gap-2">
            <Label>Subjek Email</Label>
            <Input value={form.RETENTION_60_EMAIL_SUBJECT} onChange={e => setForm({...form, RETENTION_60_EMAIL_SUBJECT: e.target.value})} />
          </div>
          <div className="grid gap-2">
            <Label>Isi Email (HTML)</Label>
            <Textarea rows={4} value={form.RETENTION_60_EMAIL_BODY} onChange={e => setForm({...form, RETENTION_60_EMAIL_BODY: e.target.value})} className="font-mono text-sm" />
            <p className="text-xs text-muted-foreground">Gunakan <code>{"{nama_sekolah}"}</code> untuk variabel dinamis.</p>
          </div>
          <div className="grid gap-2">
            <Label>Pesan WhatsApp</Label>
            <Textarea rows={3} value={form.RETENTION_60_WA} onChange={e => setForm({...form, RETENTION_60_WA: e.target.value})} />
            <p className="text-xs text-muted-foreground">Gunakan <code>{"{nama_sekolah}"}</code> untuk variabel dinamis.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-0 shadow-sm overflow-hidden col-span-full">
        <CardHeader className="border-b bg-white/50">
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-red-500" />
            Pesan Retensi - 90 Hari (Dihapus)
          </CardTitle>
          <CardDescription>Pemberitahuan bahwa website telah dihapus permanen pada hari ke-90.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid gap-2">
            <Label>Subjek Email</Label>
            <Input value={form.RETENTION_90_EMAIL_SUBJECT} onChange={e => setForm({...form, RETENTION_90_EMAIL_SUBJECT: e.target.value})} />
          </div>
          <div className="grid gap-2">
            <Label>Isi Email (HTML)</Label>
            <Textarea rows={4} value={form.RETENTION_90_EMAIL_BODY} onChange={e => setForm({...form, RETENTION_90_EMAIL_BODY: e.target.value})} className="font-mono text-sm" />
            <p className="text-xs text-muted-foreground">Gunakan <code>{"{nama_sekolah}"}</code> untuk variabel dinamis.</p>
          </div>
          <div className="grid gap-2">
            <Label>Pesan WhatsApp</Label>
            <Textarea rows={3} value={form.RETENTION_90_WA} onChange={e => setForm({...form, RETENTION_90_WA: e.target.value})} />
            <p className="text-xs text-muted-foreground">Gunakan <code>{"{nama_sekolah}"}</code> untuk variabel dinamis.</p>
          </div>
        </CardContent>
      </Card>

      <div className="col-span-full">
        <Button 
          className="w-full gap-2 btn-gradient text-white border-0 rounded-xl"
          onClick={() => handleSaveBatch([
            'RETENTION_30_EMAIL_SUBJECT', 'RETENTION_30_EMAIL_BODY', 'RETENTION_30_WA',
            'RETENTION_60_EMAIL_SUBJECT', 'RETENTION_60_EMAIL_BODY', 'RETENTION_60_WA',
            'RETENTION_90_EMAIL_SUBJECT', 'RETENTION_90_EMAIL_BODY', 'RETENTION_90_WA'
          ])}
          disabled={saving}
        >
          {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-4 w-4" />}
          Simpan Semua Pesan Retensi
        </Button>
      </div>
    </div>
  )
}
