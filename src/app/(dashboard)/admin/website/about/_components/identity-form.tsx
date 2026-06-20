import React, { useRef } from"react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { Input } from"@/components/ui/input"
import { Label } from"@/components/ui/label"
import { Globe, Building2, Upload, ArrowRight, ShieldCheck, ShieldOff } from"lucide-react"
import Image from"next/image"
import { normalizeImageUrl, cn } from"@/lib/utils"
import { AboutFormState } from"./types"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface IdentityFormProps {
  form: AboutFormState
  setForm: React.Dispatch<React.SetStateAction<AboutFormState>>
  logoPreview: string
  uploadingLogo: boolean
  handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>
  domainStatus: { domain: string | null; status: string | null }
  slug: string | null
  router: any
}

export function IdentityForm({
  form, setForm, logoPreview, uploadingLogo, handleLogoUpload, domainStatus, slug, router
}: IdentityFormProps) {
  const logoInputRef = useRef<HTMLInputElement>(null)

  return (
    <Card className="glass border-0 lg:col-span-2">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Globe className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Identitas Website</CardTitle>
            <CardDescription>Nama, tagline, dan deskripsi singkat</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Kolom Kiri */}
          <div className="space-y-4">
            <div className="space-y-2 mb-4">
              <Label>Logo Lembaga</Label>
              <div className="flex items-center gap-4">
                <div className="relative shrink-0 h-14 w-14 overflow-hidden rounded-xl border bg-muted">
                  {logoPreview ? (
                      <Image src={normalizeImageUrl(logoPreview) || logoPreview} alt="Logo" fill className="object-contain p-1" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-dashed bg-muted/30">
                      <Building2 className="h-5 w-5 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <Input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" className="hidden" onChange={handleLogoUpload} />
                  <Button type="button" variant="outline" size="sm" className="rounded-xl gap-2 h-9" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}>
                    {uploadingLogo ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" /> : <Upload className="h-3.5 w-3.5" />}
                    {uploadingLogo ?"Mengunggah..." :"Upload Logo"}
                  </Button>
                  <p className="text-[11px] text-muted-foreground">PNG, JPG, WebP, SVG. Maks 5MB.</p>
                  <p className="text-[11px] text-primary font-semibold mt-1 bg-primary/10 inline-block px-1.5 py-0.5 rounded">Rekomendasi rasio 1:1</p>
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <Label>Domain Website</Label>
              <Button type="button" variant="outline" onClick={() => router.push("/admin/settings/domain")}
                className="flex w-full h-auto items-center justify-between rounded-xl border bg-muted/30 px-3 py-2.5 text-left transition-colors hover:bg-muted/60 font-normal">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    {domainStatus.domain ? (
                      <>
                        <p className="text-sm font-mono font-medium">{domainStatus.domain}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {domainStatus.status ==="verified"
                            ? <ShieldCheck className="h-3 w-3 text-emerald-500" />
                            : <ShieldOff className="h-3 w-3 text-amber-500" />}
                          <span className={cn("text-xs", domainStatus.status ==="verified" ?"text-emerald-600" :"text-amber-600")}>
                            {domainStatus.status ==="verified" ?"Terverifikasi" :"Belum diverifikasi"}
                          </span>
                        </div>
                      </>
                    ) : <p className="text-sm text-muted-foreground">Belum ada custom domain</p>}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </Button>
              <p className="text-[11px] text-muted-foreground">Subdomain aktif: <span className="font-mono">{slug ||"—"}</span></p>
            </div>

            <div className="space-y-2 mb-4">
              <Label>Zona Waktu (Timezone)</Label>
              <Select value={form.settings?.timezone || "Asia/Jakarta"} onValueChange={v => setForm(p => ({ ...p, settings: { ...p.settings, timezone: v } }))}>
                <SelectTrigger className="rounded-xl h-10 w-full bg-background border-input">
                  <SelectValue placeholder="Pilih Zona Waktu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Jakarta">WIB (Asia/Jakarta)</SelectItem>
                  <SelectItem value="Asia/Makassar">WITA (Asia/Makassar)</SelectItem>
                  <SelectItem value="Asia/Jayapura">WIT (Asia/Jayapura)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">Basis waktu untuk keseluruhan website tenan.</p>
            </div>
          </div>

          {/* Kolom Kanan */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Lembaga</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Nama lembaga Anda" className="rounded-xl" />
            </div>

            <div className="space-y-2">
              <Label>Tagline / Slogan</Label>
              <Input value={form.tagline} onChange={e => setForm(p => ({ ...p, tagline: e.target.value }))}
                placeholder="Slogan singkat yang menggambarkan lembaga" className="rounded-xl" />
              <p className="text-xs text-muted-foreground">Tampil di hero section dan navbar website</p>
            </div>

            <div className="space-y-2">
              <Label>Deskripsi Singkat</Label>
              <Textarea value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Deskripsi singkat lembaga Anda (maks. 300 karakter)"
                maxLength={300} rows={4}
                className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-y min-h-[100px]" />
              <p className="text-xs text-muted-foreground">{form.description.length}/300 karakter</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 mt-2">
          <div className="space-y-2">
            <Label>Status Sekolah</Label>
            <Select value={form.settings?.schoolStatus ||"SWASTA"}
              onValueChange={v => setForm(p => ({ ...p, settings: { ...p.settings, schoolStatus: v } }))}>
              <SelectTrigger className="flex h-10 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                <SelectValue placeholder="Pilih Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SWASTA">SWASTA</SelectItem>
                <SelectItem value="NEGERI">NEGERI</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Estimasi Jumlah Siswa Saat Ini</Label>
            <Input type="number" value={form.settings?.studentCount ||""} 
              onChange={e => setForm(p => ({ ...p, settings: { ...p.settings, studentCount: parseInt(e.target.value) || 0 } }))}
              placeholder="Misal: 500" className="rounded-xl" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 mt-4">
          <div className="space-y-2">
            <Label>Tahun Ajaran Aktif</Label>
            <Input 
              value={form.settings?.academicYear || ""} 
              onChange={e => setForm(p => ({ ...p, settings: { ...p.settings, academicYear: e.target.value } }))}
              placeholder="Contoh: 2024/2025" 
              className="rounded-xl" 
            />
          </div>
          <div className="space-y-2">
            <Label>Semester Aktif</Label>
            <Select 
              value={form.settings?.academicSemester || "Ganjil"} 
              onValueChange={v => setForm(p => ({ ...p, settings: { ...p.settings, academicSemester: v } }))} 
            >
              <SelectTrigger className="flex h-10 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                <SelectValue placeholder="Pilih Semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ganjil">Ganjil</SelectItem>
                <SelectItem value="Genap">Genap</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
