"use client"

import { useState, useRef, useEffect } from"react"
import { useTenantBranding } from"@/components/providers/tenant-branding-provider"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { Input } from"@/components/ui/input"
import { Label } from"@/components/ui/label"
import { Switch } from"@/components/ui/switch"
import { toast } from"@/hooks/use-toast"
import { ArrowLeft, Save, ImageIcon } from"lucide-react"
import Link from"next/link"
import { useRouter, useParams } from"next/navigation"
import { getSliderById, updateSlider } from"@/features/slider/actions/slider.action"
import { normalizeImageUrl } from"@/lib/utils"

export default function EditSliderPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const { branding, isLoadingTenant } = useTenantBranding()
  const tenantId = branding.id
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    title:"",
    subtitle:"",
    buttonText:"",
    buttonLink:"",
    sortOrder: 0,
    isActive: true,
    imageUrl:""
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isLoadingTenant && tenantId) {
      getSliderById(id, tenantId)
        .then(d => {
          if (!d) {
            toast({ title:"Gagal", description:"Slide tidak ditemukan", variant:"destructive" })
            router.push("/admin/website/sliders")
          } else {
            setFormData({
              title: d.title ||"",
              subtitle: d.subtitle ||"",
              buttonText: d.buttonText ||"",
              buttonLink: d.buttonLink ||"",
              sortOrder: d.sortOrder,
              isActive: d.isActive,
              imageUrl: d.imageUrl
            })
            setPreviewUrl(normalizeImageUrl(d.imageUrl) || null)
          }
          setLoading(false)
        })
        .catch((err: any) => {
          toast({ title:"Error", description: err.message, variant:"destructive" })
          setLoading(false)
        })
    }
  }, [tenantId, isLoadingTenant, id, router])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0]
      if (selected.size > 5 * 1024 * 1024) {
        toast({ title:"File terlalu besar", description:"Maksimal 5MB", variant:"destructive" })
        return
      }
      setFile(selected)
      setPreviewUrl(URL.createObjectURL(selected))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenantId) return

    setSaving(true)

    try {
      let finalImageUrl = formData.imageUrl
      
      if (file) {
        setUploading(true)
        const fd = new FormData()
        fd.append("file", file)
        fd.append("tenantId", tenantId)
        fd.append("subDir","sliders")
        
        const uploadRes = await fetch("/api/upload", { method:"POST", body: fd })
        const uploadData = await uploadRes.json()
        
        if (!uploadRes.ok || !uploadData.url) {
          throw new Error(uploadData.error ||"Gagal mengunggah gambar")
        }
        
        finalImageUrl = uploadData.url
        setUploading(false)
      }
      
      await updateSlider(id, tenantId, {
        ...formData,
        sortOrder: Number(formData.sortOrder),
        imageUrl: finalImageUrl,
      })

      toast({ title:"Slide berhasil diperbarui!" })
      router.push("/admin/website/sliders")
    } catch (error: any) {
      toast({ title:"Gagal", description: error.message, variant:"destructive" })
      setUploading(false)
      setSaving(false)
    }
  }

  if (loading) return <div className="skeleton h-96 max-w-4xl rounded-2xl" />

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-full">
            <Link href="/admin/website/sliders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Slide</h1>
            <p className="text-muted-foreground mt-1 text-sm">Perbarui gambar dan informasi slider.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Kolom Kiri: Konten Utama */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass border-0 overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/30 pb-4 border-b border-border/50">
              <CardTitle className="text-base">Gambar Slide</CardTitle>
              <CardDescription className="text-xs">Klik gambar untuk mengganti dengan yang baru.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-4 transition-colors overflow-hidden relative aspect-video border-border hover:border-primary/50 hover:bg-primary/5`}
              >
                <Input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <div className="text-center py-8">
                    <ImageIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-sm font-medium">Klik untuk upload gambar slider</p>
                    <p className="text-xs text-muted-foreground mt-1">Format: JPG, PNG, WebP (Maks 5MB)</p>
                    <p className="text-xs text-primary font-semibold mt-2 bg-primary/10 inline-block px-2 py-1 rounded-md">Rekomendasi rasio 21:9 atau 16:9 (Desktop)</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-center">
                   <p className="text-white text-sm font-medium">Klik untuk ganti gambar</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-0 overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/30 pb-4 border-b border-border/50">
              <CardTitle className="text-base">Teks & Tombol (Opsional)</CardTitle>
              <CardDescription className="text-xs">Teks ini akan muncul di atas gambar slide.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Judul Utama (Headline)</Label>
                <Input 
                  id="title" 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  placeholder="Misal: Selamat Datang di SchoolPro" 
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitle">Sub-judul (Keterangan)</Label>
                <Input 
                  id="subtitle" 
                  value={formData.subtitle} 
                  onChange={e => setFormData({...formData, subtitle: e.target.value})} 
                  placeholder="Misal: Mewujudkan Generasi Cerdas & Berakhlak" 
                  className="rounded-xl"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="buttonText">Teks Tombol</Label>
                  <Input 
                    id="buttonText" 
                    value={formData.buttonText} 
                    onChange={e => setFormData({...formData, buttonText: e.target.value})} 
                    placeholder="Misal: Daftar Sekarang" 
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buttonLink">Link Tombol</Label>
                  <Input 
                    id="buttonLink" 
                    value={formData.buttonLink} 
                    onChange={e => setFormData({...formData, buttonLink: e.target.value})} 
                    placeholder="https://..." 
                    className="rounded-xl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kolom Kanan: Pengaturan */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="glass border-0 overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/30 pb-4 border-b border-border/50">
              <CardTitle className="text-base">Pengaturan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Urutan Tampil</Label>
                <Input 
                  id="sortOrder" 
                  type="number"
                  value={formData.sortOrder} 
                  onChange={e => setFormData({...formData, sortOrder: Number(e.target.value)})} 
                  className="rounded-xl"
                />
                <p className="text-[10px] text-muted-foreground italic">Angka terkecil muncul paling awal.</p>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <Label>Status Aktif</Label>
                  <p className="text-[10px] text-muted-foreground">Slide akan langsung tampil jika aktif.</p>
                </div>
                <Switch 
                  checked={formData.isActive} 
                  onCheckedChange={v => setFormData({...formData, isActive: v})} 
                />
              </div>

              <hr className="border-border/50" />

              <button type="submit" className="justify-center items-center flex w-full gap-2 btn-gradient text-white border-0 rounded-xl h-10 px-4" disabled={saving}>
                {saving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {uploading ?"Mengunggah..." :"Menyimpan..."}
                  </>
                ) : (
                  <><Save className="h-4 w-4" /> Perbarui Slide</>
                )}
              </button>
              <Button type="button" variant="ghost" className="w-full rounded-xl" onClick={() => router.back()} disabled={saving}>
                Batal
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
