"use client"

import { useState, useRef, useEffect } from"react"
import { useTenantBranding } from"@/components/providers/tenant-branding-provider"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { Input } from"@/components/ui/input"
import { Label } from"@/components/ui/label"
import { Textarea } from"@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from"@/components/ui/select"
import { toast } from"@/hooks/use-toast"
import { ArrowLeft, Save, User, Quote, Sparkles, Wand2, Loader2 as Loader2Icon } from"lucide-react"
import Link from"next/link"
import { useRouter, useParams } from"next/navigation"
import { getAlumniById, updateAlumni } from"@/features/alumni/actions/alumni.action"
import { normalizeImageUrl } from"@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from"@/components/ui/dialog"


export default function EditAlumniPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const { branding, isLoadingLembaga } = useTenantBranding()
  const tenantId = branding.id
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name:"",
    graduationYear:"",
    currentStatus:"KULIAH",
    institutionName:"",
    testimonial:"",
    imageUrl:"",
    instagram:"",
    facebook:"",
    tiktok:"",
    youtube:"",
    linkedin:"",
    twitter:"",
    pinterest:""
  })
  const [isCustomStatus, setIsCustomStatus] = useState(false)

  // AI State
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [aiInputText, setAiInputText] = useState("")
  const [aiLoading, setAiLoading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isLoadingLembaga && tenantId) {
      getAlumniById(id, tenantId)
        .then(d => {
          if (!d) {
            toast({ title:"Gagal", description:"Data alumni tidak ditemukan", variant:"destructive" })
            router.push("/admin/website/alumni")
          } else {
            const defaultStatuses = ["KULIAH", "KERJA", "WIRAUSAHA", "MENCARI_KERJA"]
            const isCustom = d.currentStatus ? !defaultStatuses.includes(d.currentStatus) : false
            setIsCustomStatus(isCustom)
            setFormData({
              name: d.name ||"",
              graduationYear: d.graduationYear.toString(),
              currentStatus: d.currentStatus ||"KULIAH",
              institutionName: d.institutionName ||"",
              testimonial: d.testimonial ||"",
              imageUrl: d.imageUrl ||"",
              instagram: (d as any).instagram ||"",
              facebook: (d as any).facebook ||"",
              tiktok: (d as any).tiktok ||"",
              youtube: (d as any).youtube ||"",
              linkedin: (d as any).linkedin ||"",
              twitter: (d as any).twitter ||"",
              pinterest: (d as any).pinterest ||""
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
      if (selected.size > 2 * 1024 * 1024) {
        toast({ title:"File terlalu besar", description:"Maksimal 2MB", variant:"destructive" })
        return
      }
      setFile(selected)
      setPreviewUrl(URL.createObjectURL(selected))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenantId || !formData.name || !formData.graduationYear) {
      toast({ title:"Nama dan Tahun Lulus wajib diisi", variant:"destructive" })
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
        fd.append("subDir","alumni")
        
        const uploadRes = await fetch("/api/upload", { method:"POST", body: fd })
        const uploadData = await uploadRes.json()
        
        if (!uploadRes.ok || !uploadData.url) {
          throw new Error(uploadData.error ||"Gagal mengunggah foto")
        }
        
        finalImageUrl = uploadData.url
        setUploading(false)
      }
      
      await updateAlumni(id, tenantId, {
        name: formData.name,
        graduationYear: Number(formData.graduationYear),
        currentStatus: formData.currentStatus,
        institutionName: formData.institutionName,
        testimonial: formData.testimonial,
        imageUrl: finalImageUrl,
        instagram: formData.instagram,
        facebook: formData.facebook,
        tiktok: formData.tiktok,
        youtube: formData.youtube,
        linkedin: formData.linkedin,
        twitter: formData.twitter,
        pinterest: formData.pinterest,
      })

      toast({ title:"Data alumni berhasil diperbarui!" })
      router.push("/admin/website/alumni")
    } catch (error: any) {
      toast({ title:"Gagal", description: error.message, variant:"destructive" })
      setUploading(false)
      setSaving(false)
    }
  }

  const handleGenerateAI = async () => {
    if (!aiInputText.trim()) {
      toast({ title:"Input kosong", description:"Silakan masukkan kata kunci testimoni.", variant:"destructive" })
      return
    }

    setAiLoading(true)
    try {
      const res = await fetch("/api/tenant/ai/generate-content", {
        method:"POST",
        headers: {"Content-Type":"application/json" },
        body: JSON.stringify({ 
          tenantId, 
          promptType:"alumni", 
          inputs: { text: aiInputText, name: formData.currentStatus } 
        })
      })
      const d = await res.json()
      if (res.ok && d.success && d.data?.result) {
        setFormData(p => ({ ...p, testimonial: d.data.result }))
        setAiModalOpen(false)
        setAiInputText("")
        toast({ title:"Berhasil", description:"Testimoni berhasil di-generate AI." })
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
    <div className="space-y-6 max-w-[1200px] mx-auto pb-10 max-w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-full">
            <Link href="/admin/website/alumni">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Alumni</h1>
            <p className="text-muted-foreground mt-1 text-sm">Perbarui data profil dan testimoni alumni.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Kolom Kiri: Konten Utama */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass border-0 overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/30 pb-4 border-b border-border/50">
              <CardTitle className="text-base">Informasi Alumni</CardTitle>
              <CardDescription className="text-xs">Lengkapi data diri dan aktivitas alumni saat ini.</CardDescription>
            </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="space-y-2">
                <Label>Foto Alumni</Label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`cursor-pointer flex flex-col items-center justify-center border-2 border-dashed rounded-full w-32 h-32 transition-colors overflow-hidden relative ${file || previewUrl ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-primary/5'}`}
                >
                  <Input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept="image/jpeg,image/png,image/webp"
                  />
                  
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="object-cover w-full h-full" loading="lazy" decoding="async" />
                  ) : (
                    <div className="text-center p-4">
                      <User className="h-8 w-8 mx-auto mb-1 text-muted-foreground/50" />
                      <p className="text-[10px] font-medium text-muted-foreground">Upload Foto</p>
                      <p className="text-[9px] text-primary font-semibold mt-1 bg-primary/10 inline-block px-1 rounded">Rasio 3:4 atau 1:1</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 w-full space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Lengkap <span className="text-destructive">*</span></Label>
                  <Input 
                    id="name" 
                    required 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    placeholder="Contoh: Muhammad Rafli, S.Kom" 
                    className="rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="graduationYear">Tahun Lulus <span className="text-destructive">*</span></Label>
                    <Input 
                      id="graduationYear" 
                      type="number"
                      required 
                      value={formData.graduationYear} 
                      onChange={e => setFormData({...formData, graduationYear: e.target.value})} 
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currentStatus">Status Saat Ini</Label>
                    <Select 
                      value={isCustomStatus ? "LAINNYA" : formData.currentStatus} 
                      onValueChange={v => {
                        if (v === "LAINNYA") {
                          setIsCustomStatus(true)
                          setFormData({...formData, currentStatus: ""})
                        } else {
                          setIsCustomStatus(false)
                          setFormData({...formData, currentStatus: v})
                        }
                      }}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Pilih Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KULIAH">Kuliah</SelectItem>
                        <SelectItem value="KERJA">Bekerja</SelectItem>
                        <SelectItem value="WIRAUSAHA">Wirausaha</SelectItem>
                        <SelectItem value="MENCARI_KERJA">Mencari Kerja</SelectItem>
                        <SelectItem value="LAINNYA">Lainnya (Ketik Sendiri)</SelectItem>
                      </SelectContent>
                    </Select>
                    {isCustomStatus && (
                      <Input 
                        placeholder="Masukkan status lainnya..." 
                        value={formData.currentStatus}
                        onChange={e => setFormData({...formData, currentStatus: e.target.value})}
                        className="rounded-xl mt-2"
                        required
                        autoFocus
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="institutionName">Nama Instansi / Kampus / Perusahaan</Label>
              <Input 
                id="institutionName" 
                value={formData.institutionName} 
                onChange={e => setFormData({...formData, institutionName: e.target.value})} 
                placeholder="Misal: Universitas Indonesia / PT. Maju Jaya" 
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="testimonial">Testimoni / Kisah Sukses</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setAiModalOpen(true)} className="h-7 text-[10px] gap-1.5 rounded-xl border-violet-200 text-violet-600 bg-violet-50 hover:bg-violet-100 hover:text-violet-700 px-2">
                  <Sparkles className="h-3 w-3" /> Buat Testimoni AI
                </Button>
              </div>
              <div className="relative">
                <Quote className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/30" />
                <Textarea 
                  id="testimonial" 
                  value={formData.testimonial} 
                  onChange={e => setFormData({...formData, testimonial: e.target.value})} 
                  placeholder="Ceritakan pengalaman belajar di sekolah atau kesuksesan yang diraih..."
                  className="rounded-xl resize-none h-32 pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border/50">
              <div className="col-span-1 sm:col-span-2">
                <Label className="text-sm font-semibold">Sosial Media</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram" className="text-xs">Instagram (Opsional)</Label>
                <Input 
                  id="instagram" 
                  value={formData.instagram} 
                  onChange={e => setFormData({...formData, instagram: e.target.value})} 
                  placeholder="URL atau username" 
                  className="rounded-xl h-8 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facebook" className="text-xs">Facebook (Opsional)</Label>
                <Input 
                  id="facebook" 
                  value={formData.facebook} 
                  onChange={e => setFormData({...formData, facebook: e.target.value})} 
                  placeholder="URL atau username" 
                  className="rounded-xl h-8 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tiktok" className="text-xs">TikTok (Opsional)</Label>
                <Input 
                  id="tiktok" 
                  value={formData.tiktok} 
                  onChange={e => setFormData({...formData, tiktok: e.target.value})} 
                  placeholder="URL atau username" 
                  className="rounded-xl h-8 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin" className="text-xs">LinkedIn (Opsional)</Label>
                <Input 
                  id="linkedin" 
                  value={formData.linkedin} 
                  onChange={e => setFormData({...formData, linkedin: e.target.value})} 
                  placeholder="URL LinkedIn" 
                  className="rounded-xl h-8 text-sm"
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
              <Button type="submit" className="justify-center items-center flex w-full gap-2 btn-gradient text-white border-0 rounded-xl h-10 px-4" disabled={saving || !formData.name || !formData.graduationYear}>
                {saving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {uploading ?"Mengunggah..." :"Menyimpan..."}
                  </>
                ) : (
                  <><Save className="h-4 w-4" /> Simpan Perubahan</>
                )}
              </Button>
              <Button type="button" variant="ghost" className="w-full rounded-xl" onClick={() => router.back()} disabled={saving}>
                Batal
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>

      {/* AI Content Modal */}
      <Dialog open={aiModalOpen} onOpenChange={setAiModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl max-w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" />
              Generate Testimoni Alumni
            </DialogTitle>
            <DialogDescription>
              AI akan membuat kalimat testimoni yang menarik berdasarkan status alumni saat ini.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Kata Kunci / Pengalaman <span className="text-red-500">*</span></Label>
              <Textarea 
                value={aiInputText}
                onChange={(e) => setAiInputText(e.target.value)}
                placeholder="Contoh: Guru disiplin, fasilitas lab sangat membantu waktu kuliah, bangga jadi alumni."
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
              type="button"
              onClick={handleGenerateAI} 
              disabled={aiLoading || !aiInputText.trim()}
              className="rounded-xl gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white border-0"
            >
              {aiLoading ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {aiLoading ?"Memproses..." :"Generate Testimoni"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
