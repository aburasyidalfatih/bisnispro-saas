"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { 
  School, User, Phone, MapPin, Send, 
  Globe, Hash, Landmark, Loader2, AlertCircle, ImageIcon
} from "lucide-react"
import { RegionSelector } from "@/components/ui/region-selector"

export function RevisionForm({ application }: { application: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  
  const [form, setForm] = useState({
    businessName: application.businessName || application.schoolName || "",
    businessSlug: application.businessSlug || application.schoolSlug || "",
    businessType: application.businessType || "UMKM",
    province: application.province || "",
    regency: application.regency || "",
    adminName: application.adminName || "",
    adminPhone: application.adminPhone || "",
    address: application.address || "",
    logo: application.logo || null,
    employeeCount: application.employeeCount || application.studentCount || 1,
  })

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(application.logo)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!logoFile && !form.logo) {
        toast({ title: "Gagal", description: "Logo bisnis wajib diunggah", variant: "destructive" })
        setLoading(false)
        return
      }

      let finalLogoUrl = form.logo

      if (logoFile) {
        const formData = new FormData()
        formData.append("file", logoFile)
        formData.append("type", "business-logo")

        const uploadRes = await fetch("/api/public/upload", { method: "POST", body: formData })
        if (!uploadRes.ok) {
          const uploadErr = await uploadRes.json().catch(() => ({}))
          throw new Error(uploadErr.error || "Gagal mengunggah logo")
        }
        const uploadData = await uploadRes.json()
        finalLogoUrl = uploadData.url
      }

      const res = await fetch(`/api/public/revisi-pengajuan/${application.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, logo: finalLogoUrl }),
      })

      if (res.ok) {
        setSubmitted(true)
      } else {
        const data = await res.json()
        toast({ title: "Gagal", description: data.error || "Terjadi kesalahan saat mengirim revisi.", variant: "destructive" })
      }
    } catch (error) {
      console.error(error)
      const errMsg = error instanceof Error ? error.message : "Terjadi kesalahan sistem."
      toast({ title: "Gagal", description: errMsg, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6 glass p-6 md:p-12 rounded-3xl animate-in fade-in zoom-in-95 duration-500">
        <div className="mx-auto w-16 h-16 md:w-20 md:h-20 bg-emerald-100 rounded-full flex items-center justify-center">
          <Send className="h-8 w-8 md:h-10 md:w-10 text-emerald-600" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Revisi Berhasil Dikirim! 🎉</h2>
        <p className="text-muted-foreground text-base md:text-lg max-w-md mx-auto">
          Data pengajuan Anda telah diperbarui dan sedang menunggu tinjauan dari tim verifikasi kami.
          Anda akan menerima notifikasi melalui WhatsApp ketika pengajuan Anda telah ditinjau.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 flex gap-3">
        <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
        <div>
          <h5 className="text-rose-800 font-bold">Pemberitahuan Revisi</h5>
          <div className="mt-1 text-sm text-rose-700">
            Pengajuan Anda belum dapat disetujui. Admin kami meninggalkan pesan berikut:
            <div className="mt-2 p-3 bg-white/60 rounded-xl font-medium text-rose-900 border border-rose-200">
              &quot;{application.adminMessage}&quot;
            </div>
            <p className="mt-2">Silakan perbaiki data di bawah ini dan kirim ulang pengajuan Anda.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informasi Bisnis */}
        <Card className="glass border-0 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-xl"><Globe className="h-5 w-5 text-primary" /></div>
              Informasi Bisnis
            </CardTitle>
            <CardDescription>Perbaiki profil bisnis Anda.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>Logo Bisnis <span className="text-red-500">*</span></Label>
              <div className="flex items-center gap-4">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="h-16 w-16 object-contain rounded-lg border bg-white" loading="lazy" decoding="async" />
                ) : (
                  <div className="h-16 w-16 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted/50">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <Input 
                    type="file" 
                    accept="image/png, image/jpeg, image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        if (file.size > 2 * 1024 * 1024) {
                          toast({ title: "File Terlalu Besar", description: "Maksimal ukuran logo adalah 2MB", variant: "destructive" })
                          return
                        }
                        setLogoFile(file)
                        setLogoPreview(URL.createObjectURL(file))
                      }
                    }}
                    className="rounded-xl h-11"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Maks 2MB. Format: JPG, PNG, WEBP.</p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label>Nama Bisnis <span className="text-red-500">*</span></Label>
                <Input required value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Subdomain / URL Sistem <span className="text-red-500">*</span></Label>
                <div className="flex rounded-xl overflow-hidden shadow-sm border focus-within:ring-2 focus-within:ring-primary/20">
                  <span className="flex items-center justify-center bg-muted/50 px-2 sm:px-3 border-r text-muted-foreground text-xs sm:text-sm font-medium shrink-0">https://</span>
                  <Input required value={form.businessSlug} onChange={(e) => setForm({ ...form, businessSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} className="border-0 rounded-none focus-visible:ring-0 shadow-none px-2 font-semibold text-primary min-w-0" />
                  <span className="flex items-center justify-center bg-muted/50 px-2 sm:px-3 border-l text-muted-foreground text-xs sm:text-sm font-medium shrink-0">.bisnispro.id</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tipe Bisnis</Label>
                <Input value={form.businessType} onChange={(e) => setForm({ ...form, businessType: e.target.value })} className="rounded-xl" placeholder="UMKM, Startup, Corporate..." />
              </div>
              <div className="space-y-2">
                <Label>Jumlah Karyawan <span className="text-red-500">*</span></Label>
                <Input 
                  required 
                  type="number"
                  min="1"
                  value={form.employeeCount || ""} 
                  onChange={(e) => setForm({...form, employeeCount: parseInt(e.target.value) || 1})}
                  placeholder="Contoh: 10" 
                  className="rounded-xl h-11"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lokasi Bisnis */}
        <Card className="glass border-0 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-emerald-500/10 rounded-xl"><MapPin className="h-5 w-5 text-emerald-500" /></div>
              Lokasi Bisnis
            </CardTitle>
            <CardDescription>Perbaiki wilayah dan alamat bisnis Anda.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <RegionSelector
              province={form.province}
              regency={form.regency}
              onProvinceChange={(v) => setForm({ ...form, province: v, regency: "" })}
              onRegencyChange={(v) => setForm({ ...form, regency: v })}
              required
            />
            <div className="space-y-2">
              <Label>Alamat Lengkap <span className="text-red-500">*</span></Label>
              <Textarea required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="rounded-xl min-h-[100px]" placeholder="Jl. Bisnis No. 123..." />
            </div>
          </CardContent>
        </Card>

        {/* Informasi Penanggung Jawab */}
        <Card className="glass border-0 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-blue-500/10 rounded-xl"><User className="h-5 w-5 text-blue-500" /></div>
              Data Penanggung Jawab
            </CardTitle>
            <CardDescription>Perbaiki data narahubung bisnis Anda.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label>Nama Lengkap Admin <span className="text-red-500">*</span></Label>
                <Input required value={form.adminName} onChange={(e) => setForm({ ...form, adminName: e.target.value })} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Nomor WhatsApp Aktif <span className="text-red-500">*</span></Label>
                <Input required value={form.adminPhone} onChange={(e) => setForm({ ...form, adminPhone: e.target.value.replace(/[^0-9]/g, "") })} className="rounded-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <Card className="glass border-0 shadow-lg bg-primary/5">
          <CardContent className="p-6 md:p-8 text-center space-y-6">
            <h3 className="text-xl font-bold tracking-tight">Kirim Ulang Pengajuan</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Pastikan semua data yang Anda perbaiki sudah benar sesuai dengan catatan admin sebelum menekan tombol di bawah.
            </p>
            <Button type="submit" size="lg" disabled={loading} className="w-full sm:w-auto btn-gradient text-white shadow-xl glow-primary rounded-xl h-14 px-10 text-lg font-semibold flex items-center justify-center">
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Send className="w-5 h-5 mr-2" />}
              {loading ? "Memproses..." : "Ajukan Kembali"}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
