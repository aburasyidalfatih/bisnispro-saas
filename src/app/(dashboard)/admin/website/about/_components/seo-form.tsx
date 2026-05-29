import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Globe } from "lucide-react"
import { AboutFormState } from "./types"

interface SeoFormProps {
  form: AboutFormState
  setForm: React.Dispatch<React.SetStateAction<AboutFormState>>
}

export function SeoForm({ form, setForm }: SeoFormProps) {
  return (
    <Card className="glass border-0 lg:col-span-2">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Globe className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">SEO & Meta</CardTitle>
            <CardDescription>Optimasi mesin pencari untuk website Anda</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Meta Title</Label>
              <button type="button" onClick={() => setForm(p => ({ ...p, seoTitle: p.name ? `Website Resmi ${p.name}` : "" }))} className="text-[10px] text-primary hover:underline font-medium">Isi Otomatis</button>
            </div>
            <Input value={form.seoTitle} onChange={e => setForm(p => ({ ...p, seoTitle: e.target.value }))}
              placeholder="Judul halaman untuk Google (maks. 70 karakter)" className="rounded-xl" maxLength={70} />
            <p className="text-xs text-muted-foreground">{form.seoTitle?.length || 0}/70 · Kosongkan untuk pakai nama lembaga</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Meta Description</Label>
              <button type="button" onClick={() => setForm(p => ({ ...p, seoDesc: p.description || (p.name ? `Selamat datang di website resmi ${p.name}. Dapatkan informasi terbaru seputar profil, kegiatan, dan pendaftaran siswa baru kami.` : "") }))} className="text-[10px] text-primary hover:underline font-medium">Isi Otomatis</button>
            </div>
            <textarea value={form.seoDesc} onChange={e => setForm(p => ({ ...p, seoDesc: e.target.value }))}
              placeholder="Deskripsi singkat untuk hasil pencarian Google (maks. 160 karakter)"
              maxLength={160} rows={3}
              className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-y min-h-[100px]" />
            <p className="text-xs text-muted-foreground">{form.seoDesc?.length || 0}/160 · Kosongkan untuk pakai deskripsi lembaga</p>
          </div>
        </div>
        {/* Preview */}
        {(form.seoTitle || form.name || form.seoDesc || form.description) && (
          <div className="rounded-xl border bg-muted/20 p-4">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Preview di Google:</p>
            <p className="text-blue-600 text-base font-medium leading-tight">
              {form.seoTitle || form.name || "Nama Website"}
            </p>
            <p className="text-green-700 text-xs mt-0.5">https://yourdomain.com</p>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {form.seoDesc || form.description || "Deskripsi website Anda akan muncul di sini..."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
