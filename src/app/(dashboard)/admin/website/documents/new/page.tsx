"use client"

import { useState, useRef } from"react"
import { useTenantBranding } from"@/components/providers/tenant-branding-provider"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { Input } from"@/components/ui/input"
import { Label } from"@/components/ui/label"
import { Textarea } from"@/components/ui/textarea"
import { toast } from"@/hooks/use-toast"
import { Upload, ArrowLeft, Save, FileType } from"lucide-react"
import Link from"next/link"
import { useRouter } from"next/navigation"

export default function NewDocumentPage() {
  const router = useRouter()
  const { branding } = useTenantBranding()
  const tenantId = branding.id
  
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  
  const [formData, setFormData] = useState({
    title:"",
    description:"",
    type:"UNDUHAN_UMUM"
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0]
      if (selected.size > 10 * 1024 * 1024) {
        toast({ title:"File terlalu besar", description:"Maksimal 10MB", variant:"destructive" })
        return
      }
      setFile(selected)
      if (!formData.title) {
        setFormData(prev => ({ ...prev, title: selected.name }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenantId || !file) {
      toast({ title:"Pilih file terlebih dahulu", variant:"destructive" })
      return
    }

    setSaving(true)
    setUploading(true)

    try {
      // 1. Upload File
      const fd = new FormData()
      fd.append("file", file)
      fd.append("tenantId", tenantId)
      fd.append("subDir","documents")
      
      const uploadRes = await fetch("/api/upload", { method:"POST", body: fd })
      const uploadData = await uploadRes.json()
      
      if (!uploadRes.ok || !uploadData.url) {
        throw new Error(uploadData.error ||"Gagal mengunggah file")
      }
      
      setUploading(false)
      
      // 2. Save Document Record
      const docRes = await fetch("/api/tenant/documents", {
        method:"POST",
        headers: {"Content-Type":"application/json" },
        body: JSON.stringify({
          tenantId,
          title: formData.title,
          description: formData.description,
          type: formData.type,
          fileUrl: uploadData.url,
          mimeType: file.type ||"application/octet-stream",
          size: file.size
        })
      })

      if (docRes.ok) {
        toast({ title:"Dokumen berhasil disimpan!" })
        router.push("/admin/website/documents")
      } else {
        const d = await docRes.json()
        throw new Error(d.error ||"Gagal menyimpan dokumen")
      }
    } catch (error: any) {
      toast({ title:"Gagal", description: error.message, variant:"destructive" })
      setUploading(false)
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-full">
            <Link href="/admin/website/documents">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Unggah Dokumen</h1>
            <p className="text-muted-foreground mt-1 text-sm">Tambahkan dokumen baru ke pusat unduhan.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Kolom Kiri: Konten Utama */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass border-0 overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/30 pb-4 border-b border-border/50">
              <CardTitle className="text-base">Detail Dokumen</CardTitle>
              <CardDescription className="text-xs">Pastikan informasi diisi dengan jelas agar mudah dicari.</CardDescription>
            </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="space-y-2">
              <Label>File Dokumen <span className="text-destructive">*</span></Label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 transition-colors ${file ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-primary/5'}`}
              >
                <Input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
                />
                <FileType className={`h-8 w-8 mb-3 ${file ? 'text-primary' : 'text-muted-foreground/50'}`} />
                {file ? (
                  <div className="text-center">
                    <p className="text-sm font-medium text-primary">{file.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm font-medium">Klik untuk memilih file</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, Word, Excel, PPT, ZIP (Max 10MB)</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Judul Dokumen <span className="text-destructive">*</span></Label>
              <Input 
                id="title" 
                required 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
                placeholder="Materi Panduan Penggunaan..." 
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Kategori / Tipe</Label>
              <select 
                id="type"
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
                className="flex h-10 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="UNDUHAN_UMUM">Unduhan Umum (Bebas)</option>
                <option value="MATERI_TUGAS">Materi / Tugas Sekolah</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi Singkat</Label>
              <Textarea 
                id="description" 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
                placeholder="Berisi panduan langkah demi langkah tentang..."
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
              <button type="submit" className="justify-center items-center flex w-full gap-2 btn-gradient text-white border-0 rounded-xl h-10 px-4" disabled={saving || !file || !formData.title}>
                {saving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {uploading ?"Mengunggah File..." :"Menyimpan..."}
                  </>
                ) : (
                  <><Save className="h-4 w-4" /> Simpan Dokumen</>
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
