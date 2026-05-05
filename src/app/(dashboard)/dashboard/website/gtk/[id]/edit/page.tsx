"use client"

import { useState, useRef, useEffect } from "react"
import { useTenantBranding } from "@/components/providers/tenant-branding-provider"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { ArrowLeft, Save, Users } from "lucide-react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { getStaffById, updateStaff } from "@/lib/actions/staff"

export default function EditStaffPage() {
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
    role: "",
    bio: "",
    sortOrder: 0,
    imageUrl: "",
    email: "",
    phone: "",
    subject: "",
    education: ""
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isLoadingTenant && tenantId) {
      getStaffById(id, tenantId)
        .then(d => {
          if (!d) {
            toast({ title: "Gagal", description: "Data GTK tidak ditemukan", variant: "destructive" })
            router.push("/dashboard/website/gtk")
          } else {
            setFormData({
              name: d.name || "",
              role: d.role || "",
              bio: d.bio || "",
              sortOrder: d.sortOrder || 0,
              imageUrl: d.imageUrl || "",
              email: (d as any).email || "",
              phone: (d as any).phone || "",
              subject: (d as any).subject || "",
              education: (d as any).education || ""
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
    if (!tenantId || !formData.name || !formData.role) {
      toast({ title: "Lengkapi nama dan jabatan", variant: "destructive" })
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
        fd.append("subDir", "staff")
        
        const uploadRes = await fetch("/api/upload", { method: "POST", body: fd })
        const uploadData = await uploadRes.json()
        
        if (!uploadRes.ok || !uploadData.url) {
          throw new Error(uploadData.error || "Gagal mengunggah foto")
        }
        
        finalImageUrl = uploadData.url
        setUploading(false)
      }
      
      await updateStaff(id, tenantId, {
        name: formData.name,
        role: formData.role,
        bio: formData.bio,
        sortOrder: Number(formData.sortOrder),
        imageUrl: finalImageUrl,
        email: formData.email,
        phone: formData.phone,
        subject: formData.subject,
        education: formData.education
      })

      toast({ title: "Data GTK berhasil diperbarui!" })
      router.push("/dashboard/website/gtk")
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
            <Link href="/dashboard/website/gtk">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit GTK</h1>
            <p className="text-muted-foreground mt-1 text-sm">Perbarui profil guru atau staf.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Kolom Kiri: Konten Utama */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass border-0 overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/30 pb-4 border-b border-border/50">
              <CardTitle className="text-base">Informasi GTK</CardTitle>
              <CardDescription className="text-xs">Lengkapi biodata dan foto profil.</CardDescription>
            </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="space-y-2">
                <Label>Foto Profil</Label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`cursor-pointer flex flex-col items-center justify-center border-2 border-dashed rounded-2xl w-32 h-40 transition-colors overflow-hidden relative ${file || previewUrl ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-primary/5'}`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept="image/jpeg,image/png,image/webp"
                  />
                  
                  {previewUrl ? (
                    <div className="relative w-full h-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={previewUrl} alt="Preview" className="object-cover w-full h-full" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-center p-2">
                        <p className="text-white text-[10px] font-medium">Ubah Foto</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-4">
                      <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                      <p className="text-[10px] font-medium">Klik Foto</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 w-full space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Lengkap & Gelar <span className="text-destructive">*</span></Label>
                  <Input 
                    id="name" 
                    required 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    placeholder="Contoh: Dr. Ahmad S.Pd, M.Pd" 
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Jabatan / Mata Pelajaran <span className="text-destructive">*</span></Label>
                  <Input 
                    id="role" 
                    required 
                    value={formData.role} 
                    onChange={e => setFormData({...formData, role: e.target.value})} 
                    placeholder="Contoh: Kepala Sekolah / Guru Matematika" 
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email (Opsional - Untuk Login)</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                    placeholder="Contoh: guru@sekolah.com" 
                    className="rounded-xl"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Jika diisi dan akun belum ada, akun User otomatis dibuat. Jika password dikosongkan, user harus menggunakan fitur Lupa Password untuk login perdana.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sortOrder">Urutan Tampil (Semakin kecil semakin awal)</Label>
                  <Input 
                    id="sortOrder" 
                    type="number"
                    value={formData.sortOrder} 
                    onChange={e => setFormData({...formData, sortOrder: Number(e.target.value)})} 
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Nomor WhatsApp (Cth: 0812345...)</Label>
                <Input 
                  id="phone" 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                  placeholder="Opsional" 
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Mata Pelajaran (Selain Jabatan)</Label>
                <Input 
                  id="subject" 
                  value={formData.subject} 
                  onChange={e => setFormData({...formData, subject: e.target.value})} 
                  placeholder="Contoh: Matematika" 
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="education">Riwayat Akademik / Pendidikan Terakhir</Label>
                <Input 
                  id="education" 
                  value={formData.education} 
                  onChange={e => setFormData({...formData, education: e.target.value})} 
                  placeholder="Contoh: S1 Pendidikan Matematika - Universitas ABC" 
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio / Riwayat Singkat</Label>
              <Textarea 
                id="bio" 
                value={formData.bio} 
                onChange={e => setFormData({...formData, bio: e.target.value})} 
                placeholder="Penjelasan singkat mengenai profil guru..."
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
              <Button type="submit" className="w-full gap-2 btn-gradient text-white border-0 rounded-xl" disabled={saving || !formData.name || !formData.role}>
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
