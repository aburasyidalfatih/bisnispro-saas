"use client"

import { useState, useRef } from"react"
import { useTenantBranding } from"@/components/providers/tenant-branding-provider"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { Input } from"@/components/ui/input"
import { Label } from"@/components/ui/label"
import { Switch } from"@/components/ui/switch"
import { toast } from"@/hooks/use-toast"
import { ArrowLeft, Save, ImageIcon } from"lucide-react"
import Link from"next/link"
import { useRouter } from"next/navigation"
import { createSlider } from"@/features/slider/actions/slider.action"

export default function NewSliderPage() {
  const router = useRouter()
  const { branding } = useTenantBranding()
  const tenantId = branding.id
  
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
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement("img")
      img.src = URL.createObjectURL(file)
      img.onload = () => {
        const canvas = document.createElement("canvas")
        let { width, height } = img
        // Resize to max 1920x1080 to keep it lightweight
        if (width > 1920) {
          height = Math.round((height * 1920) / width)
          width = 1920
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        if (!ctx) return resolve(file) // fallback
        ctx.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file)
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/,"") +".webp", {
              type:"image/webp",
              lastModified: Date.now(),
            })
            resolve(compressedFile)
          },"image/webp",
          0.8 // 80% quality
        )
      }
      img.onerror = () => resolve(file) // fallback if error
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenantId || !file) {
      toast({ title:"Gambar wajib diunggah", variant:"destructive" })
      return
    }

    setSaving(true)

    try {
      setUploading(true)
      
      // Kompres gambar di klien (browser) untuk menghindari batas Nginx/Next.js
      const compressedFile = await compressImage(file)
      
      const fd = new FormData()
      fd.append("file", compressedFile)
      fd.append("tenantId", tenantId)
      fd.append("subDir","sliders")
      
      const uploadRes = await fetch("/api/upload", { method:"POST", body: fd })
      const uploadData = await uploadRes.json()
      
      if (!uploadRes.ok || !uploadData.url) {
        throw new Error(uploadData.error ||"Gagal mengunggah gambar")
      }
      
      const imageUrl = uploadData.url
      setUploading(false)
      
      await createSlider(tenantId, {
        ...formData,
        sortOrder: Number(formData.sortOrder),
        imageUrl: imageUrl,
      })

      toast({ title:"Slide berhasil dibuat!" })
      router.push("/admin/website/sliders")
    } catch (error: any) {
      toast({ title:"Gagal", description: error.message, variant:"destructive" })
      setUploading(false)
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-10 max-w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-full">
            <Link href="/admin/website/sliders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tambah Slide Baru</h1>
            <p className="text-muted-foreground mt-1 text-sm">Unggah gambar dan atur teks promosi.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Kolom Kiri: Konten Utama */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass border-0 overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/30 pb-4 border-b border-border/50">
              <CardTitle className="text-base">Gambar Slide</CardTitle>
              <CardDescription className="text-xs">Gunakan gambar dengan resolusi tinggi (rekomendasi 1920x800).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-4 transition-colors overflow-hidden relative aspect-video ${file ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-primary/5'}`}
              >
                <Input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded-lg" loading="lazy" decoding="async" />
                ) : (
                  <div className="text-center py-8">
                    <ImageIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-sm font-medium">Klik untuk upload gambar slider</p>
                    <p className="text-xs text-muted-foreground mt-1">Format: JPG, PNG, WebP (Maks 5MB)</p>
                    <p className="text-xs text-primary font-semibold mt-2 bg-primary/10 inline-block px-2 py-1 rounded-md">Rekomendasi rasio 21:9 atau 16:9 (Desktop)</p>
                  </div>
                )}
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
                  placeholder="Misal: Selamat Datang di BisnisPro" 
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

              <Button type="submit" className="flex items-center justify-center h-10 w-full gap-2 btn-gradient text-white border-0 rounded-xl px-4" disabled={saving || !file}>
                {saving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {uploading ?"Mengunggah & Mengoptimalkan..." :"Menyimpan..."}
                  </>
                ) : (
                  <><Save className="h-4 w-4" /> Simpan Slide</>
                )}
              </Button>
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
