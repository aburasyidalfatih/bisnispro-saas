"use client"

import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Save, Info, ExternalLink, Globe, Upload, Building2, ShieldCheck, ShieldOff, ArrowRight, X, Phone, MapPin, Mail, MessageCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { RegionSelector } from "@/components/ui/region-selector"

export default function WebsiteAboutPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [slug, setSlug] = useState<string | null>(null)
  const [logoPreview, setLogoPreview] = useState("")
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [domainStatus, setDomainStatus] = useState<{ domain: string | null; status: string | null }>({ domain: null, status: null })

  const [form, setForm] = useState({
    name: "", logo: "", tagline: "", description: "", about: "",
    seoTitle: "", seoDesc: "",
    address: "", phone: "", email: "", website: "",
    whatsapp: "", instagram: "", facebook: "", youtube: "", tiktok: "",
    settings: {} as any,
  })

  // Resolve tenantId
  useEffect(() => {
    const id = session?.user?.tenants?.[0]?.id
    const s = session?.user?.tenants?.[0]?.slug
    if (id) { setTenantId(id); setSlug(s || null); return }
    const match = document.cookie.match(/impersonate-tenant=([^;]+)/)
    const impSlug = match?.[1]
    if (impSlug) {
      setSlug(impSlug)
      fetch(`/api/tenant/by-slug?slug=${impSlug}`)
        .then(r => r.json())
        .then(d => { if (d.id) setTenantId(d.id) })
    }
  }, [session?.user?.tenants])

  useEffect(() => {
    if (!tenantId) return
    fetch(`/api/tenant/website?tenantId=${tenantId}`)
      .then(r => r.json())
      .then(d => {
        setForm({
          name: d.name || "", logo: d.logo || "", tagline: d.tagline || "",
          description: d.description || "", about: d.about || "",
          seoTitle: d.seoTitle || "", seoDesc: d.seoDesc || "",
          address: d.address || "", phone: d.phone || "", email: d.email || "",
          website: d.website || "", whatsapp: d.whatsapp || "",
          instagram: d.instagram || "", facebook: d.facebook || "",
          youtube: d.youtube || "", tiktok: d.tiktok || "",
          settings: d.settings || {},
        })
        setLogoPreview(d.logo || "")
        setLoading(false)
      })
      .catch(() => setLoading(false))

    fetch(`/api/tenant/domain?tenantId=${tenantId}`)
      .then(r => r.json())
      .then(d => {
        setDomainStatus({ domain: d.domain || null, status: d.customDomain?.status || null })
      })
      .catch(() => {})
  }, [tenantId])

  const handleSave = async () => {
    if (!tenantId) return
    setSaving(true)
    const payload: any = { tenantId, ...form }
    Object.keys(payload).forEach(k => {
      if (payload[k] === "") payload[k] = null
    })
    const res = await fetch("/api/tenant/website", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    if (res.ok) {
      toast({ title: "Disimpan", description: "Profil lembaga berhasil diperbarui." })
    } else {
      const d = await res.json().catch(() => ({}))
      toast({ title: "Gagal", description: d.error || "Terjadi kesalahan.", variant: "destructive" })
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !tenantId) return
    setUploadingLogo(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("tenantId", tenantId)
      fd.append("subDir", "brand")
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const d = await res.json()
      if (res.ok && d.url) {
        setForm(p => ({ ...p, logo: d.url }))
        setLogoPreview(d.url)
        toast({ title: "Logo diunggah", description: "Klik Simpan untuk menyimpan perubahan." })
      } else {
        toast({ title: "Gagal upload", description: d.error, variant: "destructive" })
      }
    } finally {
      setUploadingLogo(false)
      e.target.value = ""
    }
  }

  const handlePrincipalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !tenantId) return
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("tenantId", tenantId)
      fd.append("subDir", "principal")
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const d = await res.json()
      if (res.ok && d.url) {
        setForm(p => ({ ...p, settings: { ...(p.settings || {}), principalImage: d.url } }))
        toast({ title: "Foto diunggah", description: "Klik Simpan untuk menyimpan perubahan." })
      } else {
        toast({ title: "Gagal upload", description: d.error, variant: "destructive" })
      }
    } finally {
      e.target.value = ""
    }
  }

  if (loading) return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {[1,2,3].map(i => <div key={i} className="skeleton h-40 rounded-2xl" />)}
    </div>
  )

  const getPublicUrl = (path: string) => {
    if (typeof window !== "undefined" && window.location.pathname.startsWith('/site/')) {
      return `/site/${slug}${path}`
    }
    return path
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profil Lembaga</h1>
          <p className="text-muted-foreground mt-1">Kelola identitas, konten beranda, dan cerita lembaga Anda.</p>
        </div>
        <div className="flex items-center gap-2">
          {slug && (
            <a href={getPublicUrl("/profil")} target="_blank" rel="noopener"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
              <ExternalLink className="h-3.5 w-3.5" /> Lihat Halaman
            </a>
          )}
          <Button className="gap-2 btn-gradient text-white border-0 rounded-xl" onClick={handleSave} disabled={saving}>
            {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-4 w-4" />}
            Simpan
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">

        {/* Identitas Website */}
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
            <div className="space-y-2 mb-4">
              <Label>Logo Lembaga</Label>
              <div className="flex items-center gap-4">
                <div className="relative shrink-0 overflow-hidden rounded-xl border bg-muted">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="h-14 w-14 object-cover" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-dashed bg-muted/30">
                      <Building2 className="h-5 w-5 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" className="hidden" onChange={handleLogoUpload} />
                  <Button type="button" variant="outline" size="sm" className="rounded-xl gap-2 h-9" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}>
                    {uploadingLogo ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" /> : <Upload className="h-3.5 w-3.5" />}
                    {uploadingLogo ? "Mengunggah..." : "Upload Logo"}
                  </Button>
                  <p className="text-[11px] text-muted-foreground">PNG, JPG, WebP, SVG. Maks 5MB.</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nama Lembaga</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Nama lembaga Anda" className="rounded-xl" />
            </div>

            <div className="space-y-2 mb-4">
              <Label>Domain Website</Label>
              <button onClick={() => router.push("/admin/settings/domain")}
                className="flex w-full items-center justify-between rounded-xl border bg-muted/30 px-3 py-2.5 text-left transition-colors hover:bg-muted/60">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    {domainStatus.domain ? (
                      <>
                        <p className="text-sm font-mono font-medium">{domainStatus.domain}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {domainStatus.status === "verified"
                            ? <ShieldCheck className="h-3 w-3 text-emerald-500" />
                            : <ShieldOff className="h-3 w-3 text-amber-500" />}
                          <span className={cn("text-xs", domainStatus.status === "verified" ? "text-emerald-600" : "text-amber-600")}>
                            {domainStatus.status === "verified" ? "Terverifikasi" : "Belum diverifikasi"}
                          </span>
                        </div>
                      </>
                    ) : <p className="text-sm text-muted-foreground">Belum ada custom domain</p>}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
              <p className="text-[11px] text-muted-foreground">Subdomain aktif: <span className="font-mono">{slug || "—"}</span></p>
            </div>

            <div className="space-y-2">
              <Label>Tagline / Slogan</Label>
              <Input value={form.tagline} onChange={e => setForm(p => ({ ...p, tagline: e.target.value }))}
                placeholder="Slogan singkat yang menggambarkan lembaga" className="rounded-xl" />
              <p className="text-xs text-muted-foreground">Tampil di hero section dan navbar website</p>
            </div>
            <div className="space-y-2">
              <Label>Deskripsi Singkat</Label>
              <textarea value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Deskripsi singkat lembaga Anda (maks. 300 karakter)"
                maxLength={300} rows={4}
                className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none" />
              <p className="text-xs text-muted-foreground">{form.description.length}/300 karakter</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 mt-2">
              <div className="space-y-2">
                <Label>Status Sekolah</Label>
                <select value={form.settings?.schoolStatus || "SWASTA"}
                  onChange={e => setForm(p => ({ ...p, settings: { ...p.settings, schoolStatus: e.target.value } }))}
                  className="flex h-10 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                  <option value="SWASTA">SWASTA</option>
                  <option value="NEGERI">NEGERI</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Estimasi Jumlah Siswa Saat Ini</Label>
                <Input type="number" value={form.settings?.studentCount || ""} 
                  onChange={e => setForm(p => ({ ...p, settings: { ...p.settings, studentCount: parseInt(e.target.value) || 0 } }))}
                  placeholder="Misal: 500" className="rounded-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Kontak & Lokasi */}
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
                className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none" />
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

        {/* Media Sosial */}
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

        {/* Tentang Kami */}
        <Card className="glass border-0 lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <Info className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Tentang Kami</CardTitle>
                <CardDescription>Cerita lengkap, sejarah, visi, dan misi lembaga</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <textarea value={form.about}
              onChange={e => setForm(p => ({ ...p, about: e.target.value }))}
              placeholder="Ceritakan tentang lembaga Anda, sejarah panjang..."
              rows={6}
              className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none" />
            
            <div className="space-y-1.5 mt-4">
              <Label>Link Video Profil (YouTube)</Label>
              <Input value={form.settings?.videoProfil || ""} onChange={e => setForm(p => ({ ...p, settings: { ...p.settings, videoProfil: e.target.value } }))} placeholder="https://youtube.com/watch?v=..." className="rounded-xl h-9" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="space-y-1.5">
                <Label>NPSN</Label>
                <Input value={form.settings?.npsn || ""} onChange={e => setForm(p => ({ ...p, settings: { ...p.settings, npsn: e.target.value } }))} placeholder="Nomor Pokok Sekolah Nasional" className="rounded-xl h-9" />
              </div>
              <div className="space-y-1.5">
                <Label>Akreditasi</Label>
                <Input value={form.settings?.akreditasi || ""} onChange={e => setForm(p => ({ ...p, settings: { ...p.settings, akreditasi: e.target.value } }))} placeholder="Contoh: A (Sangat Baik)" className="rounded-xl h-9" />
              </div>
              <div className="space-y-1.5">
                <Label>Tahun Berdiri</Label>
                <Input value={form.settings?.establishedYear || ""} onChange={e => setForm(p => ({ ...p, settings: { ...p.settings, establishedYear: e.target.value } }))} placeholder="Contoh: 1998" className="rounded-xl h-9" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
              <div className="space-y-1.5">
                <Label>Jam Operasional</Label>
                <textarea value={form.settings?.operationalHours || ""} onChange={e => setForm(p => ({ ...p, settings: { ...p.settings, operationalHours: e.target.value } }))}
                  placeholder="Senin - Jumat: 07.00 - 16.00&#10;Sabtu: 07.00 - 12.00" rows={3}
                  className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
              <div className="space-y-1.5">
                <Label>Visi</Label>
                <textarea value={form.settings?.visi || ""} onChange={e => setForm(p => ({ ...p, settings: { ...p.settings, visi: e.target.value } }))}
                  placeholder="Visi sekolah..." rows={3}
                  className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none" />
              </div>
              <div className="space-y-1.5">
                <Label>Misi</Label>
                <textarea value={form.settings?.misi || ""} onChange={e => setForm(p => ({ ...p, settings: { ...p.settings, misi: e.target.value } }))}
                  placeholder="Gunakan enter untuk memisahkan misi..." rows={4}
                  className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none" />
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Sambutan Kepala Sekolah */}
        <Card className="glass border-0 lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <Info className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Sambutan Kepala Sekolah</CardTitle>
                <CardDescription>Pesan sambutan dari kepala sekolah untuk beranda website</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nama Kepala Sekolah</Label>
                <Input value={form.settings?.principalName || ""} onChange={e => setForm(p => ({ ...p, settings: { ...p.settings, principalName: e.target.value } }))}
                  placeholder="Contoh: Ir. Sherly Puspita, M.Pd" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Jabatan (Opsional)</Label>
                <Input value={form.settings?.principalTitle || ""} onChange={e => setForm(p => ({ ...p, settings: { ...p.settings, principalTitle: e.target.value } }))}
                  placeholder="Contoh: Kepala Sekolah" className="rounded-xl" />
              </div>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2 mt-4">
              <div className="space-y-2">
                <Label>Tahun Berdedikasi (Badge Foto)</Label>
                <Input value={form.settings?.principalBadgeYear || ""} onChange={e => setForm(p => ({ ...p, settings: { ...p.settings, principalBadgeYear: e.target.value } }))}
                  placeholder="Contoh: 2015" className="rounded-xl" />
                <p className="text-xs text-muted-foreground">Tampil di badge foto halaman depan</p>
              </div>
            </div>
            
            <div className="space-y-2 mt-4">
              <Label>Pesan Sambutan</Label>
              <textarea value={form.settings?.principalMessage || ""}
                onChange={e => setForm(p => ({ ...p, settings: { ...p.settings, principalMessage: e.target.value } }))}
                placeholder="Puji syukur ke hadirat Tuhan YME..."
                rows={6}
                className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none" />
            </div>

            <div className="space-y-2">
              <Label>Foto Kepala Sekolah</Label>
              <div className="flex gap-2">
                <Input value={form.settings?.principalImage || ""} onChange={e => setForm(p => ({ ...p, settings: { ...p.settings, principalImage: e.target.value } }))}
                  placeholder="https://... atau upload file" className="rounded-xl flex-1" />
                <Label className="cursor-pointer">
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePrincipalImageUpload} />
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-input bg-background hover:bg-muted/50">
                    <Upload className="h-4 w-4" />
                  </div>
                </Label>
                {form.settings?.principalImage && (
                  <Button type="button" variant="outline" size="icon" className="rounded-xl shrink-0 text-destructive"
                    onClick={() => setForm(p => ({ ...p, settings: { ...p.settings, principalImage: "" } }))}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {form.settings?.principalImage && (
                <div className="mt-4 rounded-xl overflow-hidden border w-32 h-32">
                  <img src={form.settings?.principalImage} alt="Principal preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* SEO */}
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
                <Label>Meta Title</Label>
                <Input value={form.seoTitle} onChange={e => setForm(p => ({ ...p, seoTitle: e.target.value }))}
                  placeholder="Judul halaman untuk Google (maks. 70 karakter)" className="rounded-xl" maxLength={70} />
                <p className="text-xs text-muted-foreground">{form.seoTitle.length}/70 · Kosongkan untuk pakai nama lembaga</p>
              </div>
              <div className="space-y-2">
                <Label>Meta Description</Label>
                <textarea value={form.seoDesc} onChange={e => setForm(p => ({ ...p, seoDesc: e.target.value }))}
                  placeholder="Deskripsi singkat untuk hasil pencarian Google (maks. 160 karakter)"
                  maxLength={160} rows={3}
                  className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none" />
                <p className="text-xs text-muted-foreground">{form.seoDesc.length}/160 · Kosongkan untuk pakai deskripsi lembaga</p>
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

      </div>
    </div>
  )
}
