"use client"

import { useState, useRef, useEffect } from"react"
import { useTenantBranding } from"@/components/providers/tenant-branding-provider"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { Input } from"@/components/ui/input"
import { Label } from"@/components/ui/label"
import { Textarea } from"@/components/ui/textarea"
import { Switch } from"@/components/ui/switch"
import { toast } from"@/hooks/use-toast"
import { ArrowLeft, Save, ImageIcon } from"lucide-react"
import Link from"next/link"
import { useRouter, useParams } from"next/navigation"
import { getPopupById, updatePopup } from"@/features/popup/actions/popup.action"
import { normalizeImageUrl } from"@/lib/utils"

export default function EditPopupPage() {
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
    content:"",
    videoUrl:"",
    buttonText:"",
    buttonLink:"",
    isActive: false,
    displayOnce: true,
    imageUrl:""
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isLoadingTenant && tenantId) {
      getPopupById(id, tenantId)
        .then(d => {
          if (!d) {
            toast({ title:"Gagal", description:"Popup tidak ditemukan", variant:"destructive" })
            router.push("/admin/website/popups")
          } else {
            setFormData({
              title: d.title ||"",
              content: d.content ||"",
              videoUrl: d.videoUrl ||"",
              buttonText: d.buttonText ||"",
              buttonLink: d.buttonLink ||"",
              isActive: d.isActive,
              displayOnce: d.displayOnce,
              imageUrl: d.imageUrl ||""
            })
            if (d.imageUrl) setPreviewUrl(normalizeImageUrl(d.imageUrl) || null)
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
    if (!tenantId || !formData.title) {
      toast({ title:"Judul harus diisi", variant:"destructive" })
      return
    }

    setSaving(true)

    try {
      let finalImageUrl = formData.imageUrl
      
      if (file) {
        setUploading(true)
        const fd = new FormData()
        fd.append("file", file)
        fd.append("tenantId", tenantId)
        fd.append("subDir","popups")
        
        const uploadRes = await fetch("/api/upload", { method:"POST", body: fd })
        const uploadData = await uploadRes.json()
        
        if (!uploadRes.ok || !uploadData.url) {
          throw new Error(uploadData.error ||"Gagal mengunggah gambar")
        }
        
        finalImageUrl = uploadData.url
        setUploading(false)
      }
      
      await updatePopup(id, tenantId, {
        title: formData.title,
        content: formData.content,
        videoUrl: formData.videoUrl,
        buttonText: formData.buttonText,
        buttonLink: formData.buttonLink,
        isActive: formData.isActive,
        displayOnce: formData.displayOnce,
        imageUrl: finalImageUrl,
      })

      toast({ title:"Popup berhasil diperbarui!" })
      router.push("/admin/website/popups")
    } catch (error: any) {
      toast({ title:"Gagal", description: error.message, variant:"destructive" })
      setUploading(false)
      setSaving(false)
    }
  }

  if (loading) return <div className="skeleton h-96 max-w-4xl rounded-2xl" />

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-10 max-w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-full">
            <Link href="/admin/website/popups">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Popup</h1>
            <p className="text-muted-foreground mt-1 text-sm">Perbarui konten dan pengaturan pengumuman.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Kolom Kiri: Konten Utama */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass border-0 overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/30 pb-4 border-b border-border/50">
              <CardTitle className="text-base">Konten Pengumuman</CardTitle>
              <CardDescription className="text-xs">Informasi utama yang muncul di modal.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Judul Pengumuman <span className="text-destructive">*</span></Label>
                <Input 
                  id="title" 
                  required 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  placeholder="Misal: Penerimaan Klien Baru Gelombang 2" 
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Deskripsi / Detail Pesan</Label>
                <Textarea 
                  id="content" 
                  value={formData.content} 
                  onChange={e => setFormData({...formData, content: e.target.value})} 
                  placeholder="Berikan penjelasan singkat mengenai pengumuman ini..."
                  className="rounded-xl resize-none h-32"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="buttonText">Teks Tombol (Opsional)</Label>
                  <Input 
                    id="buttonText" 
                    value={formData.buttonText} 
                    onChange={e => setFormData({...formData, buttonText: e.target.value})} 
                    placeholder="Misal: Daftar Sekarang" 
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buttonLink">Link Tombol (URL)</Label>
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

          <Card className="glass border-0 overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/30 pb-4 border-b border-border/50">
              <CardTitle className="text-base">Media (Opsional)</CardTitle>
              <CardDescription className="text-xs">Tambahkan gambar atau video YouTube agar lebih menarik.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Gambar Banner</Label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`cursor-pointer flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-4 transition-colors overflow-hidden relative ${file || previewUrl ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-primary/5'}`}
                >
                  <Input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                  {previewUrl ? (
                    <Image src={previewUrl} alt="Preview" width={400} height={200} className="max-h-48 rounded-lg object-contain" unoptimized />
                  ) : (
                    <div className="text-center py-4">
                      <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                      <p className="text-xs font-medium text-muted-foreground">Klik untuk upload gambar</p>
                      <p className="text-[11px] text-primary font-semibold mt-2 bg-primary/10 inline-block px-1.5 py-0.5 rounded">Rekomendasi rasio 1:1 atau 4:3</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="videoUrl">Link Video YouTube</Label>
                <Input 
                  id="videoUrl" 
                  value={formData.videoUrl} 
                  onChange={e => setFormData({...formData, videoUrl: e.target.value})} 
                  placeholder="https://youtube.com/watch?v=..." 
                  className="rounded-xl"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kolom Kanan: Pengaturan */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="glass border-0 overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/30 pb-4 border-b border-border/50">
              <CardTitle className="text-base">Pengaturan Tampilan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <Label>Langsung Aktifkan</Label>
                  <p className="text-[10px] text-muted-foreground">Tampilkan di website segera setelah disimpan.</p>
                </div>
                <Switch 
                  checked={formData.isActive} 
                  onCheckedChange={v => setFormData({...formData, isActive: v})} 
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <Label>Hanya Muncul Sekali</Label>
                  <p className="text-[10px] text-muted-foreground">Hanya muncul 1x per kunjungan (Session).</p>
                </div>
                <Switch 
                  checked={formData.displayOnce} 
                  onCheckedChange={v => setFormData({...formData, displayOnce: v})} 
                />
              </div>

              <hr className="border-border/50" />

              <Button type="submit" className="justify-center items-center flex w-full gap-2 btn-gradient text-white border-0 rounded-xl h-10 px-4" disabled={saving || !formData.title}>
                {saving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {uploading ?"Mengunggah..." :"Menyimpan..."}
                  </>
                ) : (
                  <><Save className="h-4 w-4" /> Perbarui Popup</>
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
