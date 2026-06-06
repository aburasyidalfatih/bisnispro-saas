"use client"

import { useState, useRef, useEffect } from"react"
import { useTenantBranding } from"@/components/providers/tenant-branding-provider"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { Input } from"@/components/ui/input"
import { Label } from"@/components/ui/label"
import { Textarea } from"@/components/ui/textarea"
import { toast } from"@/hooks/use-toast"
import { ArrowLeft, Save, ImageIcon, Sparkles, Wand2, Loader2 as Loader2Icon } from"lucide-react"
import Link from"next/link"
import { useRouter, useParams } from"next/navigation"
import { getFacilityById, updateFacility } from"@/features/facility/actions/facility.action"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from"@/components/ui/dialog"
import { normalizeImageUrl } from"@/lib/utils"

export default function EditFacilityPage() {
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
    name:"",
    description:"",
    imageUrl:"",
    category:"",
    condition:"",
    access:"",
  })

  // AI State
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [aiInputText, setAiInputText] = useState("")
  const [aiLoading, setAiLoading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isLoadingTenant && tenantId) {
      getFacilityById(id, tenantId)
        .then(d => {
          if (!d) {
            toast({ title:"Gagal", description:"Fasilitas tidak ditemukan", variant:"destructive" })
            router.push("/admin/website/facilities")
          } else {
            setFormData({
              name: d.name ||"",
              description: d.description ||"",
              imageUrl: d.imageUrl ||"",
              category: d.category ||"",
              condition: d.condition ||"",
              access: d.access ||""
            })
            if (d.imageUrl) setPreviewUrl(normalizeImageUrl(d.imageUrl) || null)
          }
          setLoading(false)
        })
        .catch((err: any) => {
          toast({ title:"Error", description: err.message ||"Gagal memuat data", variant:"destructive" })
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
    if (!tenantId || !formData.name) {
      toast({ title:"Isi nama fasilitas", variant:"destructive" })
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
        fd.append("subDir","facilities")
        
        const uploadRes = await fetch("/api/upload", { method:"POST", body: fd })
        const uploadData = await uploadRes.json()
        
        if (!uploadRes.ok || !uploadData.url) {
          throw new Error(uploadData.error ||"Gagal mengunggah gambar")
        }
        
        finalImageUrl = uploadData.url
        setUploading(false)
      }
      
      await updateFacility(id, tenantId, {
        name: formData.name,
        description: formData.description,
        imageUrl: finalImageUrl,
        category: formData.category,
        condition: formData.condition,
        access: formData.access,
      })

      toast({ title:"Fasilitas berhasil diperbarui!" })
      router.push("/admin/website/facilities")
    } catch (error: any) {
      toast({ title:"Gagal", description: error.message, variant:"destructive" })
      setUploading(false)
      setSaving(false)
    }
  }

  const handleGenerateAI = async () => {
    if (!formData.name) {
      toast({ title:"Nama Belum Diisi", description:"Silakan isi Nama Fasilitas terlebih dahulu.", variant:"destructive" })
      return
    }
    if (!aiInputText.trim()) {
      toast({ title:"Input kosong", description:"Silakan masukkan kondisi/kelengkapan fasilitas.", variant:"destructive" })
      return
    }

    setAiLoading(true)
    try {
      const res = await fetch("/api/tenant/ai/generate-content", {
        method:"POST",
        headers: {"Content-Type":"application/json" },
        body: JSON.stringify({ 
          tenantId, 
          promptType:"facility", 
          inputs: { text: aiInputText, name: formData.name } 
        })
      })
      const d = await res.json()
      if (res.ok && d.success && d.data?.result) {
        setFormData(p => ({ ...p, description: d.data.result }))
        setAiModalOpen(false)
        setAiInputText("")
        toast({ title:"Berhasil", description:"Deskripsi fasilitas berhasil di-generate AI." })
      } else {
        toast({ title:"Gagal", description: d.error ||"Terjadi kesalahan", variant:"destructive" })
      }
    } catch (err) {
      toast({ title:"Error", description:"Gagal menghubungi server AI", variant:"destructive" })
    } finally {
      setAiLoading(false)
    }
  }

  if (loading) return <div className="skeleton h-96 max-w-3xl rounded-2xl" />

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-full">
            <Link href="/admin/website/facilities">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Fasilitas</h1>
            <p className="text-muted-foreground mt-1 text-sm">Perbarui data fasilitas sekolah.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Kolom Kiri: Konten Utama */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass border-0 overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/30 pb-4 border-b border-border/50">
              <CardTitle className="text-base">Informasi Fasilitas</CardTitle>
              <CardDescription className="text-xs">Lengkapi detail fasilitas dan unggah foto representatif.</CardDescription>
            </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="space-y-2">
              <Label>Foto Fasilitas</Label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 transition-colors overflow-hidden relative ${file || previewUrl ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-primary/5'}`}
              >
                <Input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept="image/jpeg,image/png,image/webp"
                />
                
                {previewUrl ? (
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden flex items-center justify-center bg-black/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewUrl} alt="Preview" className="object-cover w-full h-full" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-white text-sm font-medium">Klik untuk mengubah foto</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <ImageIcon className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-sm font-medium">Klik untuk memilih foto</p>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP (Max 5MB)</p>
                    <p className="text-xs text-primary font-semibold mt-2 bg-primary/10 inline-block px-2 py-1 rounded-md">Rekomendasi rasio 16:9 atau 4:3</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nama Fasilitas <span className="text-destructive">*</span></Label>
              <Input 
                id="name" 
                required 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                placeholder="Misal: Laboratorium Komputer" 
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description">Deskripsi Singkat</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setAiModalOpen(true)} className="h-7 text-[10px] gap-1.5 rounded-xl border-violet-200 text-violet-600 bg-violet-50 hover:bg-violet-100 hover:text-violet-700 px-2">
                  <Sparkles className="h-3 w-3" /> Deskripsi AI
                </Button>
              </div>
              <Textarea 
                id="description" 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
                placeholder="Jelaskan kegunaan dan kelengkapan fasilitas ini..."
                className="rounded-xl resize-none h-24"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <Input 
                  id="category" 
                  value={formData.category} 
                  onChange={e => setFormData({...formData, category: e.target.value})} 
                  placeholder="Contoh: Sarana Olahraga" 
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="condition">Kondisi</Label>
                <Input 
                  id="condition" 
                  value={formData.condition} 
                  onChange={e => setFormData({...formData, condition: e.target.value})} 
                  placeholder="Contoh: Sangat Baik" 
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="access">Hak Akses</Label>
                <Input 
                  id="access" 
                  value={formData.access} 
                  onChange={e => setFormData({...formData, access: e.target.value})} 
                  placeholder="Contoh: Seluruh Siswa" 
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
              <CardTitle className="text-base">Aksi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <button type="submit" className="w-full gap-2 btn-gradient text-white border-0 rounded-xl" disabled={saving || !formData.name}>
                {saving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {uploading ?"Mengunggah Foto..." :"Menyimpan..."}
                  </>
                ) : (
                  <><Save className="h-4 w-4" /> Simpan Perubahan</>
                )}
              </button>
              <Button type="button" variant="ghost" className="w-full rounded-xl" onClick={() => router.back()} disabled={saving}>
                Batal
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>

      {/* AI Content Modal */}
      <Dialog open={aiModalOpen} onOpenChange={setAiModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" />
              Generate Deskripsi Fasilitas
            </DialogTitle>
            <DialogDescription>
              AI akan membuat kalimat deskripsi yang menonjolkan keunggulan dan kenyamanan fasilitas ini.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Kondisi / Kelengkapan <span className="text-red-500">*</span></Label>
              <Textarea 
                value={aiInputText}
                onChange={(e) => setAiInputText(e.target.value)}
                placeholder="Contoh: AC dingin, komputer terbaru i7, internet 100Mbps, nyaman untuk praktik harian."
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
              {aiLoading ?"Memproses..." :"Generate Deskripsi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
