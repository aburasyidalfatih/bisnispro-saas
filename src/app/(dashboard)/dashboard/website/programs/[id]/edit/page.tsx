"use client"

import { useState, useRef, useEffect } from "react"
import { useTenantBranding } from "@/components/providers/tenant-branding-provider"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { ArrowLeft, Save, GraduationCap } from "lucide-react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { getProgramById, updateProgram } from "@/lib/actions/program"

export default function EditProgramPage() {
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
    name: "",
    description: "",
    imageUrl: "",
    focus: "",
    prospects: ""
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isLoadingTenant && tenantId) {
      getProgramById(id, tenantId)
        .then(d => {
          if (!d) {
            toast({ title: "Gagal", description: "Program tidak ditemukan", variant: "destructive" })
            router.push("/dashboard/website/programs")
          } else {
            setFormData({
              name: d.name || "",
              description: d.description || "",
              imageUrl: d.imageUrl || "",
              focus: d.focus || "",
              prospects: d.prospects || ""
            })
            if (d.imageUrl) setPreviewUrl(d.imageUrl)
          }
          setLoading(false)
        })
        .catch((err: any) => {
          toast({ title: "Error", description: err.message, variant: "destructive" })
          setLoading(false)
        })
    }
  }, [tenantId, isLoadingTenant, id, router])

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
      toast({ title: "Nama program harus diisi", variant: "destructive" })
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
        fd.append("subDir", "programs")
        
        const uploadRes = await fetch("/api/upload", { method: "POST", body: fd })
        const uploadData = await uploadRes.json()
        
        if (!uploadRes.ok || !uploadData.url) {
          throw new Error(uploadData.error || "Gagal mengunggah gambar")
        }
        
        finalImageUrl = uploadData.url
        setUploading(false)
      }
      
      await updateProgram(id, tenantId, {
        name: formData.name,
        description: formData.description,
        imageUrl: finalImageUrl,
        focus: formData.focus,
        prospects: formData.prospects
      })

      toast({ title: "Program berhasil diperbarui!" })
      router.push("/dashboard/website/programs")
    } catch (error: any) {
      toast({ title: "Gagal", description: error.message, variant: "destructive" })
      setUploading(false)
      setSaving(false)
    }
  }

  if (loading) return <div className="skeleton h-96 max-w-3xl rounded-2xl" />

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-full">
            <Link href="/dashboard/website/programs">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Program / Jurusan</h1>
            <p className="text-muted-foreground mt-1 text-sm">Perbarui informasi program studi.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Kolom Kiri: Konten Utama */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass border-0 overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/30 pb-4 border-b border-border/50">
              <CardTitle className="text-base">Informasi Program</CardTitle>
              <CardDescription className="text-xs">Lengkapi detail mengenai program atau jurusan.</CardDescription>
            </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="space-y-2">
              <Label>Gambar Ilustrasi / Banner</Label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 transition-colors overflow-hidden relative ${file || previewUrl ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-primary/5'}`}
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
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-center">
                      <p className="text-white text-sm font-medium">Klik untuk mengubah foto</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <GraduationCap className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-sm font-medium">Klik untuk memilih gambar ilustrasi</p>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP (Max 5MB)</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nama Program / Jurusan <span className="text-destructive">*</span></Label>
              <Input 
                id="name" 
                required 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                placeholder="Misal: Teknik Komputer dan Jaringan, IPA, dsb." 
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi Program</Label>
              <Textarea 
                id="description" 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
                placeholder="Penjelasan umum mengenai program studi..."
                className="rounded-xl resize-none h-24"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="focus">Fokus Pembelajaran (Pisahkan dengan koma)</Label>
              <Textarea 
                id="focus" 
                value={formData.focus} 
                onChange={e => setFormData({...formData, focus: e.target.value})} 
                placeholder="Misal: Pemrograman Web, Pemrograman Dasar, Sistem Basis Data"
                className="rounded-xl resize-none h-16"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prospects">Prospek Lulusan (Pisahkan dengan koma)</Label>
              <Textarea 
                id="prospects" 
                value={formData.prospects} 
                onChange={e => setFormData({...formData, prospects: e.target.value})} 
                placeholder="Misal: Software Engineer, Web Developer, System Analyst"
                className="rounded-xl resize-none h-16"
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
              <Button type="submit" className="w-full gap-2 btn-gradient text-white border-0 rounded-xl" disabled={saving || !formData.name}>
                {saving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {uploading ? "Mengunggah..." : "Menyimpan..."}
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
    </div>
  )
}
