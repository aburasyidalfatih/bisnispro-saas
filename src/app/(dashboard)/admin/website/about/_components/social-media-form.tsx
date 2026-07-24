import React from"react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from"@/components/ui/card"
import { Input } from"@/components/ui/input"
import { Label } from"@/components/ui/label"
import { MessageCircle } from"lucide-react"
import { AboutFormState } from"./types"

interface SocialMediaFormProps {
  form: AboutFormState
  setForm: React.Dispatch<React.SetStateAction<AboutFormState>>
}

export function SocialMediaForm({ form, setForm }: SocialMediaFormProps) {
  return (
    <Card className="glass border-0 lg:col-span-2">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <MessageCircle className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Media Sosial</CardTitle>
            <CardDescription>Tautan ke akun media sosial bisnis</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>💬 WhatsApp</Label>
            <Input value={form.whatsapp} onChange={(e) => setForm(p => ({ ...p, whatsapp: e.target.value }))} placeholder="6281234567890" className="rounded-xl" />
            <p className="text-[11px] text-muted-foreground">Format internasional tanpa + (contoh: 6281234567890)</p>
          </div>
          <div className="space-y-2">
            <Label>📷 Instagram</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground shrink-0">@</span>
              <Input value={form.instagram} onChange={(e) => setForm(p => ({ ...p, instagram: e.target.value }))} placeholder="username" className="rounded-xl" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>📘 Facebook</Label>
            <Input value={form.facebook} onChange={(e) => setForm(p => ({ ...p, facebook: e.target.value }))} placeholder="nama-halaman" className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>🎵 TikTok</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground shrink-0">@</span>
              <Input value={form.tiktok} onChange={(e) => setForm(p => ({ ...p, tiktok: e.target.value }))} placeholder="username" className="rounded-xl" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>▶️ YouTube</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground shrink-0">@</span>
              <Input value={form.youtube} onChange={(e) => setForm(p => ({ ...p, youtube: e.target.value }))} placeholder="channel" className="rounded-xl" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>✈️ Telegram</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground shrink-0">@</span>
              <Input value={form.telegram} onChange={(e) => setForm(p => ({ ...p, telegram: e.target.value }))} placeholder="username" className="rounded-xl" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
