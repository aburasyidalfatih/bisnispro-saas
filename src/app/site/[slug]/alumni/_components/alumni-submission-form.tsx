"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { User, MessageCircle, Send, Loader2 } from "lucide-react"
import { submitPublicAlumni } from "@/features/alumni/actions/alumni.action"

export function AlumniSubmissionForm({ tenantId }: { tenantId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: "",
    graduationYear: new Date().getFullYear().toString(),
    currentStatus: "KULIAH",
    institutionName: "",
    testimonial: "",
    instagram: "",
    facebook: "",
    tiktok: "",
    youtube: "",
    linkedin: "",
    twitter: "",
    pinterest: ""
  })
  const [isCustomStatus, setIsCustomStatus] = useState(false)

  const [captcha, setCaptcha] = useState({ num1: 0, num2: 0, answer: "" })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const generateCaptcha = () => {
    const n1 = Math.floor(Math.random() * 10) + 1
    const n2 = Math.floor(Math.random() * 10) + 1
    setCaptcha({ num1: n1, num2: n2, answer: "" })
  }

  useEffect(() => {
    if (open) {
      generateCaptcha()
    }
  }, [open])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0]
      if (selected.size > 2 * 1024 * 1024) {
        toast({ title: "File terlalu besar", description: "Maksimal 2MB", variant: "destructive" })
        return
      }
      setFile(selected)
      setPreviewUrl(URL.createObjectURL(selected))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (parseInt(captcha.answer) !== captcha.num1 + captcha.num2) {
      toast({ title: "Verifikasi gagal", description: "Jawaban matematika salah.", variant: "destructive" })
      generateCaptcha()
      return
    }

    if (!formData.name || !formData.graduationYear || !formData.testimonial) {
      toast({ title: "Wajib diisi", description: "Nama, Tahun Lulus, dan Testimoni wajib diisi.", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      let finalImageUrl = null
      
      if (file) {
        setUploading(true)
        const fd = new FormData()
        fd.append("file", file)
        fd.append("tenantId", tenantId)
        fd.append("subDir", "alumni-public")
        
        const uploadRes = await fetch("/api/upload", { method: "POST", body: fd })
        const uploadData = await uploadRes.json()
        
        if (!uploadRes.ok || !uploadData.url) {
          throw new Error(uploadData.error || "Gagal mengunggah foto")
        }
        
        finalImageUrl = uploadData.url
        setUploading(false)
      }
      
      await submitPublicAlumni(tenantId, {
        name: formData.name,
        graduationYear: Number(formData.graduationYear),
        currentStatus: formData.currentStatus,
        institutionName: formData.institutionName,
        testimonial: formData.testimonial,
        imageUrl: finalImageUrl,
      })

      toast({ 
        title: "Berhasil Terkirim", 
        description: "Testimoni Anda akan ditinjau oleh Admin sebelum ditampilkan.",
      })
      
      setOpen(false)
      setFormData({
        name: "",
        graduationYear: new Date().getFullYear().toString(),
        currentStatus: "KULIAH",
        institutionName: "",
        testimonial: "",
        instagram: "",
        facebook: "",
        tiktok: "",
        youtube: "",
        linkedin: "",
        twitter: "",
        pinterest: ""
      })
      setFile(null)
      setPreviewUrl(null)
    } catch (error: any) {
      toast({ title: "Gagal", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-white text-primary hover:bg-white/90 shadow-lg">
          <MessageCircle className="h-4 w-4" /> Kirim Testimoni Anda
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-[2rem]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Bagikan Cerita Anda</DialogTitle>
          <DialogDescription>
            Testimoni Anda akan sangat menginspirasi adik-adik kelas. (Perlu persetujuan admin sebelum tampil).
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="space-y-2">
              <Label>Foto Profil (Opsional)</Label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer flex flex-col items-center justify-center border-2 border-dashed rounded-full w-24 h-24 transition-colors overflow-hidden relative ${file || previewUrl ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-primary/5'}`}
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
                  <div className="text-center p-2">
                    <User className="h-6 w-6 mx-auto mb-1 text-muted-foreground/50" />
                    <p className="text-[9px] font-medium text-muted-foreground">Upload Foto</p>
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
            <Label htmlFor="testimonial">Testimoni / Kisah Sukses <span className="text-destructive">*</span></Label>
            <Textarea 
              id="testimonial" 
              required
              value={formData.testimonial} 
              onChange={e => setFormData({...formData, testimonial: e.target.value})} 
              placeholder="Ceritakan pengalaman belajar di sekolah atau kesuksesan yang diraih..." 
              className="min-h-[120px] rounded-xl resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <div className="p-4 bg-muted/50 rounded-xl space-y-3">
            <Label>Verifikasi Keamanan</Label>
            <p className="text-xs text-muted-foreground">Berapa hasil dari <b>{captcha.num1} + {captcha.num2}</b>?</p>
            <Input 
              type="number" 
              required 
              value={captcha.answer}
              onChange={e => setCaptcha({...captcha, answer: e.target.value})}
              placeholder="Masukkan hasil penjumlahan"
              className="rounded-xl"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="rounded-xl" disabled={loading}>
              Batal
            </Button>
            <Button type="submit" disabled={loading} className="rounded-xl gap-2 min-w-[120px]">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {uploading ? "Mengunggah..." : loading ? "Mengirim..." : "Kirim Testimoni"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
