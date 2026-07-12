"use client"

import { useEffect, useState, useRef } from"react"
import { useSession } from"next-auth/react"
import { Button } from"@/components/ui/button"
import { toast } from"@/hooks/use-toast"
import { Save, ExternalLink } from"lucide-react"
import { useRouter } from"next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from"@/components/ui/tabs"
import { getStaff } from"@/features/staff/actions/staff.action"

import { AboutFormState, AiPromptType } from"./_components/types"
import { IdentityForm } from"./_components/identity-form"
import { ContactForm } from"./_components/contact-form"
import { SocialMediaForm } from"./_components/social-media-form"
import { AboutDetailsForm } from"./_components/about-details-form"
import { PrincipalSpeechForm } from"./_components/principal-speech-form"
import { SeoForm } from"./_components/seo-form"
import { LabelsForm } from"./_components/labels-form"
import { StatsForm } from"./_components/stats-form"
import { AiContentModal } from"./_components/ai-content-modal"

export default function WebsiteAboutPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [slug, setSlug] = useState<string | null>(null)
  const [logoPreview, setLogoPreview] = useState("")
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [domainStatus, setDomainStatus] = useState<{ domain: string | null; status: string | null }>({ domain: null, status: null })
  const [staffList, setStaffList] = useState<any[]>([])

  const [form, setForm] = useState<AboutFormState>({
    name:"", logo:"", tagline:"", description:"", about:"",
    seoTitle:"", seoDesc:"",
    address:"", phone:"", email:"", website:"",
    whatsapp:"", instagram:"", facebook:"", youtube:"", tiktok:"", telegram:"",
    settings: {} as any,
  })

  // AI State
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [aiPromptType, setAiPromptType] = useState<AiPromptType>("about")
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
          name: d.name ||"", logo: d.logo ||"", tagline: d.tagline ||"",
          description: d.description ||"", about: d.about ||"",
          seoTitle: d.seoTitle || (d.name ? `Website Resmi ${d.name}` :""), 
          seoDesc: d.seoDesc || d.description || (d.name ? `Selamat datang di website resmi ${d.name}. Dapatkan informasi terbaru seputar profil, kegiatan, dan pendaftaran siswa baru kami.` :""),
          address: d.address ||"", phone: d.phone ||"", email: d.email ||"",
          website: d.website ||"", whatsapp: d.whatsapp ||"",
          instagram: d.instagram ||"", facebook: d.facebook ||"",
          youtube: d.youtube ||"", tiktok: d.tiktok ||"", telegram: d.telegram ||"",
          settings: d.settings || {},
        })
        setLogoPreview(d.logo ||"")
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
        title:"Data Belum Lengkap", 
        description: `Mohon lengkapi: ${missingFields.join(', ')}`, 
        variant:"destructive" 
      })
      return
    }

    setSaving(true)
    const payload: any = { tenantId, ...form }
    Object.keys(payload).forEach(k => {
      if (payload[k] ==="") payload[k] = null
    })
    const res = await fetch("/api/tenant/website", {
      method:"PUT",
      headers: {"Content-Type":"application/json" },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    if (res.ok) {
      toast({ title:"Disimpan", description:"Profil lembaga berhasil diperbarui." })
    } else {
      const d = await res.json().catch(() => ({}))
      toast({ title:"Gagal", description: d.error ||"Terjadi kesalahan.", variant:"destructive" })
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
      fd.append("subDir","brand")
      const res = await fetch("/api/upload", { method:"POST", body: fd })
      const d = await res.json()
      if (res.ok && d.url) {
        setForm(p => ({ ...p, logo: d.url }))
        setLogoPreview(d.url)
        toast({ title:"Logo diunggah", description:"Klik Simpan untuk menyimpan perubahan." })
      } else {
        toast({ title:"Gagal upload", description: d.error, variant:"destructive" })
      }
    } finally {
      setUploadingLogo(false)
      e.target.value =""
    }
  }

  const handlePrincipalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !tenantId) return
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("tenantId", tenantId)
      fd.append("subDir","principal")
      const res = await fetch("/api/upload", { method:"POST", body: fd })
      const d = await res.json()
      if (res.ok && d.url) {
        setForm(p => ({ ...p, settings: { ...(p.settings || {}), principalImage: d.url } }))
        toast({ title:"Foto diunggah", description:"Klik Simpan untuk menyimpan perubahan." })
      } else {
        toast({ title:"Gagal upload", description: d.error, variant:"destructive" })
      }
    } finally {
      e.target.value =""
    }
  }

  const handleGenerateAI = async () => {
    if (!aiInputText.trim()) {
      toast({ title:"Input kosong", description:"Silakan masukkan poin/fakta terlebih dahulu.", variant:"destructive" })
      return
    }

    setAiLoading(true)
    try {
      const res = await fetch("/api/tenant/ai/generate-content", {
        method:"POST",
        headers: {"Content-Type":"application/json" },
        body: JSON.stringify({ 
          tenantId, 
          promptType: aiPromptType, 
          inputs: { text: aiInputText, name: aiInputName } 
        })
      })
      const d = await res.json()
      if (res.ok && d.success && d.data?.result) {
        if (aiPromptType ==="vision-mission") {
          setForm(p => ({ ...p, settings: { ...p.settings, visi: d.data.result } }))
        } else if (aiPromptType ==="about") {
          setForm(p => ({ ...p, about: d.data.result }))
        } else if (aiPromptType ==="principal-speech") {
          setForm(p => ({ ...p, settings: { ...p.settings, principalMessage: d.data.result } }))
        }
        setAiModalOpen(false)
        setAiInputText("")
        toast({ title:"Berhasil", description:"Konten berhasil di-generate AI." })
      } else {
        toast({ title:"Gagal", description: d.error ||"Terjadi kesalahan", variant:"destructive" })
      }
    } catch (err) {
      toast({ title:"Error", description:"Gagal menghubungi server AI", variant:"destructive" })
    } finally {
      setAiLoading(false)
    }
  }

  const openAiModal = (type: AiPromptType) => {
    setAiPromptType(type)
    setAiInputText("")
    setAiInputName(type ==="principal-speech" ? form.settings?.principalName ||"" :"")
    setAiModalOpen(true)
  }

  // Fix radix UI body lock bug
  useEffect(() => {
    if (!aiModalOpen) {
      setTimeout(() => {
        document.body.style.pointerEvents = ""
      }, 100)
    }
  }, [aiModalOpen])

  if (loading) return (
    <div className="space-y-4">
      {[1,2,3].map(i => <div key={i} className="skeleton h-40 rounded-2xl" />)}
    </div>
  )

  const getPublicUrl = (path: string) => {
    if (typeof window !=="undefined" && window.location.pathname.startsWith('/site/')) {
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
          <Button className="justify-center items-center flex gap-2 btn-gradient text-white border-0 rounded-xl h-10 px-4" onClick={handleSave} disabled={saving}>
            {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-4 w-4" />}
            Simpan
          </Button>
        </div>
      </div>

      <Tabs defaultValue="identity" className="space-y-6">
        <div className="flex justify-between items-center bg-white/50 p-1 rounded-2xl border backdrop-blur-sm sticky top-0 z-10">
          <TabsList className="bg-transparent border-0 h-11 flex overflow-x-auto w-full justify-start no-scrollbar">
            <TabsTrigger value="identity" className="rounded-xl px-6 data-[state=active]:bg-primary data-[state=active]:text-white transition-all whitespace-nowrap">Identitas & Logo</TabsTrigger>
            <TabsTrigger value="contact" className="rounded-xl px-6 data-[state=active]:bg-primary data-[state=active]:text-white transition-all whitespace-nowrap">Kontak & Lokasi</TabsTrigger>
            <TabsTrigger value="social" className="rounded-xl px-6 data-[state=active]:bg-primary data-[state=active]:text-white transition-all whitespace-nowrap">Media Sosial</TabsTrigger>
            <TabsTrigger value="about" className="rounded-xl px-6 data-[state=active]:bg-primary data-[state=active]:text-white transition-all whitespace-nowrap">Detail Profil & Visi Misi</TabsTrigger>
            <TabsTrigger value="principal" className="rounded-xl px-6 data-[state=active]:bg-primary data-[state=active]:text-white transition-all whitespace-nowrap">Sambutan Utama</TabsTrigger>
            <TabsTrigger value="stats" className="rounded-xl px-6 data-[state=active]:bg-primary data-[state=active]:text-white transition-all whitespace-nowrap">Statistik Bar</TabsTrigger>
            <TabsTrigger value="labels" className="rounded-xl px-6 data-[state=active]:bg-primary data-[state=active]:text-white transition-all whitespace-nowrap">Teks & Label</TabsTrigger>
            <TabsTrigger value="marquee" className="rounded-xl px-6 data-[state=active]:bg-primary data-[state=active]:text-white transition-all whitespace-nowrap">Teks Berjalan</TabsTrigger>
            <TabsTrigger value="seo" className="rounded-xl px-6 data-[state=active]:bg-primary data-[state=active]:text-white transition-all whitespace-nowrap">SEO & Meta</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="identity" className="outline-none">
          <IdentityForm
            form={form} setForm={setForm}
            logoPreview={logoPreview} uploadingLogo={uploadingLogo} handleLogoUpload={handleLogoUpload}
            domainStatus={domainStatus} slug={slug} router={router}
          />
        </TabsContent>

        <TabsContent value="contact" className="outline-none">
          <ContactForm form={form} setForm={setForm} />
        </TabsContent>

        <TabsContent value="social" className="outline-none">
          <SocialMediaForm form={form} setForm={setForm} />
        </TabsContent>

        <TabsContent value="about" className="outline-none">
          <AboutDetailsForm
            form={form} setForm={setForm} staffList={staffList}
            openAiModal={openAiModal}
          />
        </TabsContent>

        <TabsContent value="principal" className="outline-none">
          <PrincipalSpeechForm
            form={form} setForm={setForm} staffList={staffList}
            handlePrincipalImageUpload={handlePrincipalImageUpload} openAiModal={openAiModal}
          />
        </TabsContent>

        <TabsContent value="stats" className="outline-none">
          <StatsForm form={form} setForm={setForm} />
        </TabsContent>

        <TabsContent value="labels" className="outline-none">
          <LabelsForm form={form} setForm={setForm} />
        </TabsContent>

        <TabsContent value="marquee" className="outline-none">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold">Teks Berjalan (Marquee)</h2>
              <p className="text-sm text-muted-foreground">Teks berjalan yang muncul di bagian paling atas website publik sekolah.</p>
            </div>
            <div className="space-y-2 max-w-2xl">
              <label className="text-sm font-medium">Teks Pengumuman</label>
              <textarea
                placeholder="Kosongkan jika tidak ingin menampilkan teks berjalan..."
                value={form.settings?.marqueeText || ""}
                onChange={(e) => setForm({ ...form, settings: { ...form.settings, marqueeText: e.target.value } })}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
              <p className="text-[11px] text-muted-foreground">Jika diisi, teks akan berjalan dari kanan ke kiri di halaman pengunjung. Jika dikosongkan, area teks berjalan akan disembunyikan secara otomatis.</p>
            </div>
            
            <div className="space-y-2 max-w-[250px]">
              <label className="text-sm font-medium">Kecepatan Berjalan</label>
              <select
                value={form.settings?.marqueeSpeed || "25s"}
                onChange={(e) => setForm({ ...form, settings: { ...form.settings, marqueeSpeed: e.target.value } })}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="40s">Sangat Lambat (40s)</option>
                <option value="30s">Lambat (30s)</option>
                <option value="25s">Normal (25s)</option>
                <option value="15s">Cepat (15s)</option>
                <option value="10s">Sangat Cepat (10s)</option>
              </select>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="seo" className="mt-0 outline-none">
          <SeoForm form={form} setForm={setForm} domainStatus={domainStatus} slug={slug} />
        </TabsContent>
      </Tabs>

      <AiContentModal
        aiModalOpen={aiModalOpen} setAiModalOpen={setAiModalOpen}
        aiPromptType={aiPromptType}
        aiInputName={aiInputName} setAiInputName={setAiInputName}
        aiInputText={aiInputText} setAiInputText={setAiInputText}
        aiLoading={aiLoading} handleGenerateAI={handleGenerateAI}
      />
    </div>
  )
}
