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
import { createFacility } from "@/lib/actions/facilities"

export default function NewFacilityPage() {
  const router = useRouter()
  const { branding } = useTenantBranding()
  const tenantId = branding.id
  
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    condition: "",
    access: "",
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
    if (!tenantId || !formData.name) {
      toast({ title: "Isi nama fasilitas", variant: "destructive" })
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
        fd.append("subDir", "facilities")
        
        const uploadRes = await fetch("/api/upload", { method: "POST", body: fd })
        const uploadData = await uploadRes.json()
        
        if (!uploadRes.ok || !uploadData.url) {
          throw new Error(uploadData.error || "Gagal mengunggah gambar")
        }
        
        imageUrl = uploadData.url
        setUploading(false)
      }
      
      await createFacility(tenantId, {
        name: formData.name,
        description: formData.description,
        imageUrl: imageUrl,
        category: formData.category,
        condition: formData.condition,
        access: formData.access,
      })

      toast({ title: "Fasilitas berhasil disimpan!" })
      router.push("/admin/website/facilities")
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
            <Link href="/admin/website/facilities">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tambah Fasilitas</h1>
            <p className="text-muted-foreground mt-1 text-sm">Tambahkan data fasilitas untuk ditampilkan di website.</p>
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
              <Label htmlFor="description">Deskripsi Singkat</Label>
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
              <Button type="submit" className="w-full gap-2 btn-gradient text-white border-0 rounded-xl" disabled={saving || !formData.name}>
                {saving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {uploading ? "Mengunggah Foto..." : "Menyimpan..."}
                  </>
                ) : (
                  <><Save className="h-4 w-4" /> Simpan Fasilitas</>
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
