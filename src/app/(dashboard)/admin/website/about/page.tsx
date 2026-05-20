"use client"

import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Save, Info, ExternalLink, Globe, Upload, Building2, ShieldCheck, ShieldOff, ArrowRight, X, Phone, MapPin, Mail, MessageCircle, Megaphone, Sparkles, Wand2, Loader2 as Loader2Icon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { cn, normalizeImageUrl } from "@/lib/utils"
import { RegionSelector } from "@/components/ui/region-selector"
import { getStaff } from "@/features/staff/actions/staff.action"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import Image from "next/image"

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
  const [staffList, setStaffList] = useState<any[]>([])

  const [form, setForm] = useState({
    name: "", logo: "", tagline: "", description: "", about: "",
    seoTitle: "", seoDesc: "",
    address: "", phone: "", email: "", website: "",
    whatsapp: "", instagram: "", facebook: "", youtube: "", tiktok: "",
    settings: {} as any,
  })

  // AI State
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [aiPromptType, setAiPromptType] = useState<"vision-mission" | "about" | "principal-speech">("about")
  const [aiInputText, setAiInputText] = useState("")
  const [aiInputName, setAiInputName] = useState("")
  const [aiLoading, setAiLoading] = useState(false)

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
          seoTitle: d.seoTitle || (d.name ? `Website Resmi ${d.name}` : ""), 
          seoDesc: d.seoDesc || d.description || (d.name ? `Selamat datang di website resmi ${d.name}. Dapatkan informasi terbaru seputar profil, kegiatan, dan pendaftaran siswa baru kami.` : ""),
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

    getStaff(tenantId)
      .then(data => {
        setStaffList(data || [])
      })
      .catch(console.error)
  }, [tenantId])

  const handleSave = async () => {
    if (!tenantId) return

    const missingFields: string[] = []
    if (!form.name?.trim()) missingFields.push("Nama Lembaga")
    if (!form.logo?.trim()) missingFields.push("Logo Lembaga")
    if (!form.tagline?.trim()) missingFields.push("Tagline / Slogan")
    if (!form.description?.trim()) missingFields.push("Deskripsi Singkat")
    if (!form.settings?.schoolStatus?.trim()) missingFields.push("Status Sekolah")
    if (!form.settings?.studentCount || form.settings.studentCount < 1) missingFields.push("Estimasi Jumlah Siswa")
    if (!form.settings?.province?.trim()) missingFields.push("Provinsi")
    if (!form.settings?.regency?.trim()) missingFields.push("Kabupaten/Kota")
    if (!form.address?.trim()) missingFields.push("Alamat Lengkap")
    if (!form.phone?.trim()) missingFields.push("Nomor Telepon")
    if (!form.email?.trim()) missingFields.push("Email Lembaga")

    if (missingFields.length > 0) {
      toast({ 
        title: "Data Belum Lengkap", 
        description: `Mohon lengkapi: ${missingFields.join(', ')}`, 
        variant: "destructive" 
      })
      return
    }

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

  const handleGenerateAI = async () => {
    if (!aiInputText.trim()) {
      toast({ title: "Input kosong", description: "Silakan masukkan poin/fakta terlebih dahulu.", variant: "destructive" })
      return
    }

    setAiLoading(true)
    try {
      const res = await fetch("/api/tenant/ai/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          tenantId, 
          promptType: aiPromptType, 
          inputs: { text: aiInputText, name: aiInputName } 
        })
      })
      const d = await res.json()
      if (res.ok && d.success && d.data?.result) {
        if (aiPromptType === "vision-mission") {
          // Put result in visi for now, user can split
          setForm(p => ({ ...p, settings: { ...p.settings, visi: d.data.result } }))
        } else if (aiPromptType === "about") {
          setForm(p => ({ ...p, about: d.data.result }))
        } else if (aiPromptType === "principal-speech") {
          setForm(p => ({ ...p, settings: { ...p.settings, principalMessage: d.data.result } }))
        }
        setAiModalOpen(false)
        setAiInputText("")
        toast({ title: "Berhasil", description: "Konten berhasil di-generate AI." })
      } else {
        toast({ title: "Gagal", description: d.error || "Terjadi kesalahan", variant: "destructive" })
      }
    } catch (err) {
      toast({ title: "Error", description: "Gagal menghubungi server AI", variant: "destructive" })
    } finally {
      setAiLoading(false)
    }
  }

  const openAiModal = (type: "vision-mission" | "about" | "principal-speech") => {
    setAiPromptType(type)
    setAiInputText("")
    setAiInputName(type === "principal-speech" ? form.settings?.principalName || "" : "")
    setAiModalOpen(true)
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
                  <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" className="hidden" onChange={handleLogoUpload} />
                  <Button type="button" variant="outline" size="sm" className="rounded-xl gap-2 h-9" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}>
                    {uploadingLogo ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" /> : <Upload className="h-3.5 w-3.5" />}
                    {uploadingLogo ? "Mengunggah..." : "Upload Logo"}
                  </Button>
                  <p className="text-[11px] text-muted-foreground">PNG, JPG, WebP, SVG. Maks 5MB.</p>
                  <p className="text-[11px] text-primary font-semibold mt-1 bg-primary/10 inline-block px-1.5 py-0.5 rounded">Rekomendasi rasio 1:1</p>
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
                className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-y min-h-[100px]" />
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
          <CardHeader className="flex flex-row items-start sm:items-center justify-between space-y-0 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                <Info className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-lg">Tentang Kami</CardTitle>
                <CardDescription>Cerita lengkap, sejarah, visi, dan misi lembaga</CardDescription>
              </div>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => openAiModal("about")} className="h-7 text-[10px] gap-1.5 rounded-xl border-violet-200 text-violet-600 bg-violet-50 hover:bg-violet-100 hover:text-violet-700 px-2 mt-0 shrink-0">
              <Sparkles className="h-3 w-3" /> Generate Sejarah
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <RichTextEditor 
                value={form.about || ""}
                onChange={val => setForm(p => ({ ...p, about: val }))}
                placeholder="Ceritakan tentang lembaga Anda, sejarah panjang..."
              />
            </div>
            
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
                  className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-y min-h-[100px]" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t relative">
              <div className="absolute top-4 right-0">
                <Button type="button" variant="outline" size="sm" onClick={() => openAiModal("vision-mission")} className="h-7 text-[10px] gap-1.5 rounded-xl border-violet-200 text-violet-600 bg-violet-50 hover:bg-violet-100 hover:text-violet-700 px-2 mt-0">
                  <Sparkles className="h-3 w-3" /> Poles Visi Misi
                </Button>
              </div>
              <div className="space-y-1.5 md:col-span-2 mt-8">
                <Label>Visi</Label>
                <RichTextEditor 
                  value={form.settings?.visi || ""}
                  onChange={val => setForm(p => ({ ...p, settings: { ...p.settings, visi: val } }))}
                  placeholder="Visi sekolah..."
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Misi</Label>
                <RichTextEditor 
                  value={form.settings?.misi || ""}
                  onChange={val => setForm(p => ({ ...p, settings: { ...p.settings, misi: val } }))}
                  placeholder="Misi sekolah..."
                />
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Sambutan Kepala Sekolah */}
        <Card className="glass border-0 lg:col-span-2">
          <CardHeader className="flex flex-row items-start sm:items-center justify-between space-y-0 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                <Info className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-lg">Sambutan Utama (Pimpinan / Kepala Sekolah)</CardTitle>
                <CardDescription>Pesan sambutan dari tokoh utama untuk beranda website</CardDescription>
              </div>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => openAiModal("principal-speech")} className="h-7 text-[10px] gap-1.5 rounded-xl border-violet-200 text-violet-600 bg-violet-50 hover:bg-violet-100 hover:text-violet-700 px-2 mt-0 shrink-0">
              <Sparkles className="h-3 w-3" /> Buat Sambutan AI
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Pilih dari Data GTK</Label>
                <select
                  value={staffList.find(s => s.name === form.settings?.principalName)?.id || ""}
                  onChange={(e) => {
                    const selectedId = e.target.value
                    if (selectedId) {
                      const selected = staffList.find(s => s.id === selectedId)
                      if (selected) {
                        setForm(p => ({
                          ...p,
                          settings: {
                            ...p.settings,
                            principalName: selected.name,
                            principalTitle: selected.role || "Kepala Sekolah",
                            principalImage: selected.imageUrl || p.settings?.principalImage
                          }
                        }))
                      }
                    }
                  }}
                  className="flex h-10 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">-- Isi Manual Atau Pilih GTK --</option>
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground">Pilih GTK untuk mengisi otomatis Nama, Jabatan, dan Foto.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nama Pemberi Sambutan</Label>
                  <Input value={form.settings?.principalName || ""} onChange={e => setForm(p => ({ ...p, settings: { ...p.settings, principalName: e.target.value } }))}
                    placeholder="Contoh: Ir. Sherly Puspita, M.Pd" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Jabatan (Opsional)</Label>
                  <Input value={form.settings?.principalTitle || ""} onChange={e => setForm(p => ({ ...p, settings: { ...p.settings, principalTitle: e.target.value } }))}
                    placeholder="Contoh: Kepala Sekolah" className="rounded-xl" />
                </div>
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
              <RichTextEditor 
                value={form.settings?.principalMessage || ""}
                onChange={val => setForm(p => ({ ...p, settings: { ...p.settings, principalMessage: val } }))}
                placeholder="Puji syukur ke hadirat Tuhan YME..."
              />
            </div>

            <div className="space-y-2">
              <Label>Foto Profil Utama</Label>
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
                  <img src={normalizeImageUrl(form.settings?.principalImage) || form.settings?.principalImage} alt="Principal preview" className="w-full h-full object-cover" />
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
      </div>

      {/* AI Content Modal */}
      <Dialog open={aiModalOpen} onOpenChange={setAiModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" />
              {aiPromptType === "vision-mission" && "Poles Visi & Misi"}
              {aiPromptType === "about" && "Generate Sejarah Sekolah"}
              {aiPromptType === "principal-speech" && "Buat Sambutan Kepala Sekolah"}
            </DialogTitle>
            <DialogDescription>
              Ubah poin-poin singkat Anda menjadi konten profesional.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {aiPromptType === "principal-speech" && (
              <div className="space-y-2">
                <Label>Nama Kepala Sekolah</Label>
                <Input value={aiInputName} onChange={e => setAiInputName(e.target.value)} placeholder="Contoh: Bpk. Budi Santoso" className="rounded-xl" />
              </div>
            )}
            <div className="space-y-2">
              <Label>
                {aiPromptType === "vision-mission" && "Masukkan Visi/Misi Kasar"}
                {aiPromptType === "about" && "Fakta & Sejarah Singkat"}
                {aiPromptType === "principal-speech" && "Fokus/Harapan Utama Sekolah Tahun Ini"}
                <span className="text-red-500">*</span>
              </Label>
              <Textarea 
                value={aiInputText}
                onChange={(e) => setAiInputText(e.target.value)}
                placeholder={
                  aiPromptType === "vision-mission" ? "Sekolah yang pintar, bertakwa, dan bisa komputer." :
                  aiPromptType === "about" ? "Berdiri tahun 1990, awalnya 3 kelas. Sekarang fasilitas lengkap." :
                  "Ingin tingkatkan akhlak dan teknologi. Fokus pada prestasi olimpiade sains."
                }
                className="min-h-[120px] rounded-xl resize-none"
              />
            </div>
            
            <div className="rounded-xl bg-violet-500/10 p-3 flex gap-2 items-start mt-2 border border-violet-500/20">
              <Wand2 className="h-4 w-4 text-violet-600 mt-0.5 shrink-0" />
              <p className="text-[11px] text-violet-700 leading-relaxed">
                Akan memotong saldo AI Token (25 token).
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="ghost" className="rounded-xl" onClick={() => setAiModalOpen(false)} disabled={aiLoading}>
              Batal
            </Button>
            <Button 
              onClick={handleGenerateAI} 
              disabled={aiLoading || !aiInputText.trim()}
              className="rounded-xl gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white border-0"
            >
              {aiLoading ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {aiLoading ? "Memproses..." : "Generate dengan AI"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
