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
  Globe, Hash, Landmark, Loader2, AlertCircle
} from "lucide-react"

export function RevisionForm({ application }: { application: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const [form, setForm] = useState({
    schoolName: application.schoolName,
    schoolSlug: application.schoolSlug,
    npsn: application.npsn || "",
    schoolStatus: application.schoolStatus || "SWASTA",
    province: application.province || "",
    regency: application.regency || "",
    adminName: application.adminName,
    adminPhone: application.adminPhone,
    address: application.address || "",
    logo: application.logo || null,
    studentCount: application.studentCount || 0,
  })

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(application.logo)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!logoFile && !form.logo) {
        toast({ title: "Gagal", description: "Logo sekolah wajib diunggah", variant: "destructive" })
        setLoading(false)
        return
      }

      let finalLogoUrl = form.logo

      if (logoFile) {
        const formData = new FormData()
        formData.append("file", logoFile)
        formData.append("type", "school-logo")

        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData })
        if (!uploadRes.ok) throw new Error("Gagal mengunggah logo")
        const uploadData = await uploadRes.json()
        finalLogoUrl = uploadData.url
      }

      const res = await fetch(`/api/public/revisi-pengajuan/${application.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, logo: finalLogoUrl }),
      })

      if (res.ok) {
        toast({ title: "Berhasil!", description: "Revisi berhasil dikirim dan menunggu tinjauan admin." })
        router.refresh()
      } else {
        const data = await res.json()
        toast({ title: "Gagal", description: data.error, variant: "destructive" })
      }
    } catch (error) {
      console.error(error)
      toast({ title: "Gagal", description: "Terjadi kesalahan sistem.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
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
        {/* Informasi Sekolah */}
        <Card className="glass border-0 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-xl"><School className="h-5 w-5 text-primary" /></div>
              Informasi Sekolah
            </CardTitle>
            <CardDescription>Perbaiki profil lembaga pendidikan Anda.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label>Nama Sekolah <span className="text-red-500">*</span></Label>
                <Input required value={form.schoolName} onChange={(e) => setForm({ ...form, schoolName: e.target.value })} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Subdomain / URL Sistem <span className="text-red-500">*</span></Label>
                <div className="flex rounded-xl overflow-hidden shadow-sm border focus-within:ring-2 focus-within:ring-primary/20">
                  <span className="flex items-center justify-center bg-muted/50 px-3 border-r text-muted-foreground text-sm font-medium">https://</span>
                  <Input required value={form.schoolSlug} onChange={(e) => setForm({ ...form, schoolSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} className="border-0 rounded-none focus-visible:ring-0 shadow-none px-2 font-semibold text-primary" />
                  <span className="flex items-center justify-center bg-muted/50 px-3 border-l text-muted-foreground text-sm font-medium">.schoolpro.id</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>NPSN <span className="text-red-500">*</span></Label>
                <Input required minLength={8} maxLength={8} value={form.npsn} onChange={(e) => setForm({ ...form, npsn: e.target.value.replace(/[^0-9]/g, "") })} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Status Lembaga</Label>
                <div className="flex gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="status" value="SWASTA" checked={form.schoolStatus === "SWASTA"} onChange={(e) => setForm({ ...form, schoolStatus: e.target.value })} className="accent-primary w-4 h-4" />
                    <span className="text-sm font-medium">Swasta</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="status" value="NEGERI" checked={form.schoolStatus === "NEGERI"} onChange={(e) => setForm({ ...form, schoolStatus: e.target.value })} className="accent-primary w-4 h-4" />
                    <span className="text-sm font-medium">Negeri</span>
                  </label>
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Jumlah Siswa Saat Ini <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Input 
                    required 
                    type="number"
                    min="1"
                    value={form.studentCount || ""} 
                    onChange={(e) => setForm({...form, studentCount: parseInt(e.target.value) || 0})}
                    placeholder="Contoh: 500" 
                    className="rounded-xl h-11"
                  />
                </div>
              </div>
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
            <CardDescription>Perbaiki data narahubung sekolah Anda.</CardDescription>
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
              <div className="space-y-2 md:col-span-2">
                <Label>Alamat Lengkap <span className="text-red-500">*</span></Label>
                <Textarea required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="rounded-xl min-h-[100px]" />
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
            <Button type="submit" size="lg" disabled={loading} className="w-full sm:w-auto btn-gradient text-white shadow-xl glow-primary rounded-xl h-14 px-10 text-lg font-semibold">
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Send className="w-5 h-5 mr-2" />}
              {loading ? "Memproses..." : "Ajukan Kembali"}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
