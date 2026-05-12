"use client"

import { useState, useRef } from "react"
import { useTenantBranding } from "@/components/providers/tenant-branding-provider"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { ArrowLeft, Save, ImageIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createAchievement } from "@/lib/actions/achievements"

export default function NewAchievementPage() {
  const router = useRouter()
  const { branding } = useTenantBranding()
  const tenantId = branding.id
  
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
    level: "LOKAL"
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0]
      if (selected.size > 5 * 1024 * 1024) {
        toast({ title: "File terlalu besar", description: "Maksimal 5MB", variant: "destructive" })
        return
      }
      setFile(selected)
      setPreviewUrl(URL.createObjectURL(selected))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenantId || !formData.title || !formData.date) {
      toast({ title: "Isi data yang wajib", variant: "destructive" })
      return
    }

    setSaving(true)

    try {
      let imageUrl = null
      
      if (file) {
        setUploading(true)
        const fd = new FormData()
        fd.append("file", file)
        fd.append("tenantId", tenantId)
        fd.append("subDir", "achievements")
        
        const uploadRes = await fetch("/api/upload", { method: "POST", body: fd })
        const uploadData = await uploadRes.json()
        
        if (!uploadRes.ok || !uploadData.url) {
          throw new Error(uploadData.error || "Gagal mengunggah gambar")
        }
        
        imageUrl = uploadData.url
        setUploading(false)
      }
      
      await createAchievement(tenantId, {
        title: formData.title,
        description: formData.description,
        date: new Date(formData.date).toISOString(),
        level: formData.level,
        imageUrl: imageUrl,
      })

      toast({ title: "Prestasi berhasil disimpan!" })
      router.push("/admin/website/achievements")
    } catch (error: any) {
      toast({ title: "Gagal", description: error.message, variant: "destructive" })
      setUploading(false)
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-full">
            <Link href="/admin/website/achievements">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tambah Prestasi</h1>
            <p className="text-muted-foreground mt-1 text-sm">Tambahkan capaian baru untuk ditampilkan di website.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Kolom Kiri: Konten Utama */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass border-0 overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/30 pb-4 border-b border-border/50">
              <CardTitle className="text-base">Informasi Prestasi</CardTitle>
              <CardDescription className="text-xs">Lengkapi detail prestasi beserta dokumentasinya.</CardDescription>
            </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="space-y-2">
              <Label>Foto Dokumentasi/Piala</Label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 transition-colors overflow-hidden relative ${file ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-primary/5'}`}
              >
                <input 
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
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="title">Nama Prestasi/Penghargaan <span className="text-destructive">*</span></Label>
                <Input 
                  id="title" 
                  required 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  placeholder="Misal: Juara 1 Olimpiade Matematika" 
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Tanggal Perolehan <span className="text-destructive">*</span></Label>
                <Input 
                  id="date" 
                  type="date"
                  required 
                  value={formData.date} 
                  onChange={e => setFormData({...formData, date: e.target.value})} 
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">Tingkat Prestasi</Label>
                <select 
                  id="level"
                  value={formData.level}
                  onChange={e => setFormData({...formData, level: e.target.value})}
                  className="flex h-10 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="LOKAL">Tingkat Lokal / Sekolah</option>
                  <option value="KABUPATEN">Tingkat Kabupaten/Kota</option>
                  <option value="PROVINSI">Tingkat Provinsi</option>
                  <option value="NASIONAL">Tingkat Nasional</option>
                  <option value="INTERNASIONAL">Tingkat Internasional</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi Singkat</Label>
              <Textarea 
                id="description" 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
                placeholder="Penjelasan detail tentang kompetisi atau penghargaan tersebut..."
                className="rounded-xl resize-none h-24"
              />
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
              <Button type="submit" className="w-full gap-2 btn-gradient text-white border-0 rounded-xl" disabled={saving || !formData.title || !formData.date}>
                {saving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {uploading ? "Mengunggah Foto..." : "Menyimpan..."}
                  </>
                ) : (
                  <><Save className="h-4 w-4" /> Simpan Prestasi</>
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
