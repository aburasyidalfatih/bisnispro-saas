import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Phone, MapPin, Mail, MessageCircle } from "lucide-react"
import { RegionSelector } from "@/components/ui/region-selector"
import { AboutFormState } from "./types"

interface ContactFormProps {
  form: AboutFormState
  setForm: React.Dispatch<React.SetStateAction<AboutFormState>>
}

export function ContactForm({ form, setForm }: ContactFormProps) {
  return (
    <>
      <Card className="glass border-0 lg:col-span-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Phone className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Kontak & Lokasi</CardTitle>
              <CardDescription>Alamat, telepon, dan informasi wilayah</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <RegionSelector
            province={form.settings?.province || ""}
            regency={form.settings?.regency || ""}
            onProvinceChange={(v) => setForm(p => ({ ...p, settings: { ...p.settings, province: v, regency: "" } }))}
            onRegencyChange={(v) => setForm(p => ({ ...p, settings: { ...p.settings, regency: v } }))}
          />
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Alamat Lengkap</Label>
            <textarea value={form.address} onChange={(e) => setForm(p => ({ ...p, address: e.target.value }))}
              placeholder="Jl. Contoh No. 123" rows={3}
              className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-y min-h-[100px]" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Nomor Telepon</Label>
              <Input value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="021-12345678" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Email Lembaga</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} placeholder="info@lembaga.com" className="rounded-xl" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-0 lg:col-span-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <MessageCircle className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Media Sosial</CardTitle>
              <CardDescription>Tautan ke akun media sosial lembaga</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
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
          </div>
        </CardContent>
      </Card>
    </>
  )
}
