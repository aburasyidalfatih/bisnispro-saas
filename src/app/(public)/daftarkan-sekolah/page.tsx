"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { 
  School, User, Mail, Phone, MapPin, Send, 
  CheckCircle2, Globe, Hash, Landmark, Loader2, Check, X 
} from "lucide-react"
import { cn } from "@/lib/utils"
import { RegionSelector } from "@/components/ui/region-selector"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { trackMetaEvent } from "@/components/shared/meta-pixel"

export default function RegisterSchoolPage() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [affiliateName, setAffiliateName] = useState<string | null>(null)
  const [csPhone, setCsPhone] = useState<string | null>(null)
  
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const [captchaParams, setCaptchaParams] = useState({ a: 0, b: 0 })
  const [captchaAnswer, setCaptchaAnswer] = useState("")
  
  const [form, setForm] = useState({
    schoolName: "",
    schoolSlug: "",
    npsn: "",
    schoolStatus: "SWASTA",
    province: "",
    regency: "",
    adminName: "",
    adminPosition: "",
    adminEmail: "",
    adminPhone: "",
    password: "",
    confirmPassword: "",
    address: "",
    referralCode: "",
    studentCount: 0,
    utmSource: "",
    utmMedium: "",
    utmCampaign: "",
    utmContent: "",
    utmTerm: "",
  })

  useEffect(() => {
    setCaptchaParams({
      a: Math.floor(Math.random() * 10) + 1,
      b: Math.floor(Math.random() * 10) + 1,
    })

    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      const ref = urlParams.get('ref')
      let activeRef = ref

      // Capture UTM parameters
      const utmSource = urlParams.get('utm_source') || ''
      const utmMedium = urlParams.get('utm_medium') || ''
      const utmCampaign = urlParams.get('utm_campaign') || ''
      const utmContent = urlParams.get('utm_content') || ''
      const utmTerm = urlParams.get('utm_term') || ''
      setForm(prev => ({ ...prev, utmSource, utmMedium, utmCampaign, utmContent, utmTerm }))

      if (ref) {
        setForm(prev => ({ ...prev, referralCode: ref }))
        localStorage.setItem('schoolpro_ref', ref)
      } else {
        const storedRef = localStorage.getItem('schoolpro_ref')
        if (storedRef) {
          activeRef = storedRef
          setForm(prev => ({ ...prev, referralCode: storedRef }))
        }
      }

      if (activeRef) {
        fetch(`/api/public/affiliate-info?ref=${activeRef}`)
          .then(res => res.json())
          .then(data => {
            if (data.name) setAffiliateName(data.name)
          })
          .catch(console.error)
      }
    }
  }, [])

  // Debounced Subdomain Checker
  useEffect(() => {
    if (form.schoolSlug.length < 3) {
      setIsAvailable(null)
      return
    }

    const timer = setTimeout(async () => {
      setIsChecking(true)
      try {
        const res = await fetch(`/api/public/check-subdomain?slug=${form.schoolSlug}`)
        const data = await res.json()
        setIsAvailable(data.available)
      } catch (err) {
        console.error(err)
      } finally {
        setIsChecking(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [form.schoolSlug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.adminPosition) {
      toast({ title: "Gagal", description: "Silakan pilih Jabatan di Sekolah.", variant: "destructive" })
      return
    }

    const correctAnswer = captchaParams.a + captchaParams.b
    if (parseInt(captchaAnswer) !== correctAnswer) {
      toast({ title: "Verifikasi Gagal", description: "Hasil perhitungan matematika tidak tepat.", variant: "destructive" })
      return
    }

    if (form.password.length < 8) {
      toast({ title: "Password Terlalu Pendek", description: "Password minimal harus 8 karakter.", variant: "destructive" })
      return
    }

    if (form.password !== form.confirmPassword) {
      toast({ title: "Password Tidak Cocok", description: "Konfirmasi password tidak sama dengan password.", variant: "destructive" })
      return
    }

    if (!form.adminEmail.toLowerCase().endsWith("@gmail.com")) {
      toast({ title: "Email Tidak Valid", description: "Mohon gunakan email @gmail.com aktif untuk memastikan Anda menerima informasi penting dari kami.", variant: "destructive" })
      return
    }

    if (isAvailable === false) {
      toast({ title: "Gagal", description: "Subdomain sudah digunakan", variant: "destructive" })
      return
    }

    setLoading(true)

    if (!logoFile) {
      setLoading(false)
      toast({ title: "Gagal", description: "Logo sekolah wajib diunggah", variant: "destructive" })
      return
    }

    let uploadedLogoUrl = ""
    if (logoFile) {
      const formData = new FormData()
      formData.append("file", logoFile)
      
      try {
        const uploadRes = await fetch("/api/public/upload", {
          method: "POST",
          body: formData,
        })
        
        let errData: any = null
        try {
          if (!uploadRes.ok) {
            errData = await uploadRes.json()
          }
        } catch (e) {
          errData = { error: "Terjadi kesalahan pada server saat mengunggah (kemungkinan file terlalu besar)." }
        }

        if (!uploadRes.ok) {
          throw new Error(errData?.error || "Gagal upload logo")
        }
        
        const uploadData = await uploadRes.json()
        uploadedLogoUrl = uploadData.url
      } catch (err: any) {
        setLoading(false)
        let errMsg = err.message
        if (errMsg === "Failed to fetch" || errMsg === "Network Error") {
           errMsg = "Koneksi terputus saat mengunggah logo. Pastikan internet stabil atau coba gunakan file logo dengan ukuran lebih kecil (maks 2MB)."
        }
        toast({ title: "Gagal Mengunggah Logo", description: errMsg, variant: "destructive" })
        return
      }
    }

    const payload = { ...form, logo: uploadedLogoUrl || null }

    let data: any = null
    try {
      const res = await fetch("/api/public/register-school", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      
      try {
        data = await res.json()
      } catch (e) {
        data = { error: "Server mengalami gangguan (502/503). Silakan coba beberapa saat lagi." }
      }

      setLoading(false)

      if (res.ok) {
        if (data.csPhone) setCsPhone(data.csPhone)
        setSubmitted(true)
        trackMetaEvent('Lead')
        toast({ title: "Berhasil!", description: "Pengajuan sekolah telah kami terima." })
      } else {
        toast({ title: "Gagal", description: data.error || "Terjadi kesalahan server", variant: "destructive" })
      }
    } catch (error: any) {
      setLoading(false)
      toast({ title: "Koneksi Gagal", description: "Tidak dapat terhubung ke server", variant: "destructive" })
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="max-w-md w-full glass border-0 text-center p-8 space-y-6">
          <div className="mx-auto w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold">Pengajuan Terkirim!</CardTitle>
            <CardDescription className="text-base">
              Pendaftaran <strong>{form.schoolName}</strong> sedang kami tinjau. 
              Silakan periksa kotak masuk <strong>Email</strong> Anda ({form.adminEmail}) secara berkala untuk menerima tautan akses setelah permohonan disetujui oleh admin SchoolPro.
            </CardDescription>
          </div>
          {csPhone ? (
            <Button 
              className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white border-0" 
              onClick={() => {
                const text = encodeURIComponent(`halo admin saya sudah isi formulir pengajuan website untuk sekolah saya ${form.schoolName}`)
                const phoneStr = csPhone.startsWith('0') ? '62' + csPhone.substring(1) : csPhone
                window.open(`https://wa.me/${phoneStr}?text=${text}`, '_blank')
                window.location.href = "/"
              }}
            > 
              Chat Admin Sekarang 
            </Button>
          ) : (
            <Button className="w-full rounded-xl btn-gradient text-white border-0 flex items-center justify-center h-10 px-4" onClick={() => window.location.href = "/"}> 
              Selesai 
            </Button>
          )}
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-0 px-3 py-1">Formulir Pendaftaran</Badge>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Daftarkan Sekolah Anda</h1>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto leading-relaxed">
            Bergabunglah dengan ratusan sekolah lainnya dalam transformasi digital manajemen sekolah.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Profil Sekolah */}
          <Card className="glass border-0 shadow-xl shadow-primary/5 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-primary to-blue-500" />
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10"><School className="h-5 w-5 text-primary" /></div>
                <div>
                  <CardTitle>Profil Sekolah</CardTitle>
                  <CardDescription>Identitas resmi sekolah Anda</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Logo Sekolah (Opsional)</Label>
                <div className="flex items-center gap-4">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="h-16 w-16 object-contain rounded-lg border bg-white" loading="lazy" decoding="async" />
                  ) : (
                    <div className="h-16 w-16 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted/50">
                      <School className="h-6 w-6 text-muted-foreground" />
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

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nama Sekolah</Label>
                  <Input 
                    required 
                    value={form.schoolName} 
                    onChange={(e) => setForm({...form, schoolName: e.target.value})}
                    placeholder="Contoh: SMA Negeri 1 Jakarta" 
                    className="rounded-xl h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nomor NPSN</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      required 
                      value={form.npsn} 
                      onChange={(e) => setForm({...form, npsn: e.target.value})}
                      placeholder="Masukkan 8 digit NPSN" 
                      className="rounded-xl h-11 pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status Sekolah</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {["NEGERI", "SWASTA"].map((s) => (
                      <button
                        key={s} type="button"
                        onClick={() => setForm({...form, schoolStatus: s})}
                        className={cn(
                          "h-11 rounded-xl border-2 text-sm font-medium transition-all",
                          form.schoolStatus === s 
                            ? "border-primary bg-primary/5 text-primary" 
                            : "border-muted bg-transparent text-muted-foreground hover:bg-muted/50"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Subdomain Website</Label>
                  <div className="relative flex items-center">
                    <Input 
                      required 
                      value={form.schoolSlug} 
                      onChange={(e) => setForm({...form, schoolSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                      placeholder="namasekolah" 
                      className={cn(
                        "rounded-xl h-11 pr-32",
                        isAvailable === true && "border-emerald-500 focus-visible:ring-emerald-500",
                        isAvailable === false && "border-rose-500 focus-visible:ring-rose-500"
                      )}
                    />
                    <div className="absolute right-3 flex items-center gap-2">
                      {isChecking && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                      {!isChecking && isAvailable === true && <Check className="h-4 w-4 text-emerald-500" />}
                      {!isChecking && isAvailable === false && <X className="h-4 w-4 text-rose-500" />}
                      <span className="text-xs font-medium text-muted-foreground">.schoolpro.id</span>
                    </div>
                  </div>

                </div>
              </div>

              <div className="space-y-2">
                <Label>Jumlah Siswa Saat Ini</Label>
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
            </CardContent>
          </Card>

          {/* Section 2: Lokasi */}
          <Card className="glass border-0">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10"><MapPin className="h-5 w-5 text-blue-500" /></div>
                <div>
                  <CardTitle>Lokasi Sekolah</CardTitle>
                  <CardDescription>Wilayah operasional sekolah</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <RegionSelector
                province={form.province}
                regency={form.regency}
                onProvinceChange={(v) => setForm({...form, province: v, regency: ""})}
                onRegencyChange={(v) => setForm({...form, regency: v})}
                required
              />
              <div className="space-y-2">
                <Label>Alamat Lengkap</Label>
                <Textarea 
                  required
                  value={form.address} 
                  onChange={(e) => setForm({...form, address: e.target.value})}
                  placeholder="Jl. Pendidikan No. 123..." 
                  className="rounded-xl min-h-[80px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Admin */}
          <Card className="glass border-0">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10"><User className="h-5 w-5 text-emerald-500" /></div>
                <div>
                  <CardTitle>Kontak Penanggung Jawab</CardTitle>
                  <CardDescription>Informasi admin utama sekolah</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nama Lengkap</Label>
                  <Input 
                    required 
                    value={form.adminName} 
                    onChange={(e) => setForm({...form, adminName: e.target.value})}
                    placeholder="Nama lengkap tanpa gelar" 
                    className="rounded-xl h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Jabatan di Sekolah</Label>
                  <Select
                    value={form.adminPosition}
                    onValueChange={(v) => setForm({...form, adminPosition: v})}
                  >
                    <SelectTrigger className="rounded-xl h-11">
                      <SelectValue placeholder="Pilih jabatan..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Operator">Operator</SelectItem>
                      <SelectItem value="Kepala Sekolah">Kepala Sekolah</SelectItem>
                      <SelectItem value="Wakil Kepala Sekolah">Wakil Kepala Sekolah</SelectItem>
                      <SelectItem value="Yayasan">Yayasan</SelectItem>
                      <SelectItem value="Pimpinan Lembaga">Pimpinan Lembaga</SelectItem>
                      <SelectItem value="Guru Mapel">Guru Mapel</SelectItem>
                      <SelectItem value="Tata Usaha">Tata Usaha</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email Penanggung Jawab</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      required type="email"
                      value={form.adminEmail} 
                      onChange={(e) => setForm({...form, adminEmail: e.target.value})}
                      placeholder="emailanda@gmail.com" 
                      className={cn(
                        "rounded-xl h-11 pl-10",
                        form.adminEmail && !form.adminEmail.toLowerCase().endsWith("@gmail.com") && "border-rose-500 focus-visible:ring-rose-500"
                      )}
                    />
                  </div>
                  {form.adminEmail && !form.adminEmail.toLowerCase().endsWith("@gmail.com") ? (
                    <p className="text-[10px] text-rose-500 mt-1 font-medium">Harus menggunakan email @gmail.com yang aktif.</p>
                  ) : (
                    <p className="text-[10px] text-primary/80 mt-1 font-medium">Wajib menggunakan @gmail.com aktif, karena informasi penting akan dikirim ke email ini.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Nomor WhatsApp (Aktif)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      required 
                      value={form.adminPhone} 
                      onChange={(e) => setForm({...form, adminPhone: e.target.value})}
                      placeholder="0812345678xx" 
                      className="rounded-xl h-11 pl-10"
                    />
                  </div>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Password Akses</Label>
                  <Input 
                    required 
                    type="password"
                    value={form.password} 
                    onChange={(e) => setForm({...form, password: e.target.value})}
                    placeholder="Minimal 8 karakter" 
                    className="rounded-xl h-11"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1 font-medium">Buat password untuk login sebagai admin sekolah.</p>
                </div>
                <div className="space-y-2">
                  <Label>Konfirmasi Password</Label>
                  <Input 
                    required 
                    type="password"
                    value={form.confirmPassword} 
                    onChange={(e) => setForm({...form, confirmPassword: e.target.value})}
                    placeholder="Ulangi password Anda" 
                    className={cn(
                      "rounded-xl h-11",
                      form.confirmPassword && form.password !== form.confirmPassword && "border-rose-500 focus-visible:ring-rose-500"
                    )}
                  />
                  {form.confirmPassword && form.password !== form.confirmPassword && (
                    <p className="text-[10px] text-rose-500 mt-1 font-medium">Password tidak cocok.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Verifikasi Keamanan */}
          <Card className="glass border-0">
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label>Verifikasi Anti-Spam: Berapa hasil dari {captchaParams.a} + {captchaParams.b}?</Label>
                <Input 
                  required 
                  type="number"
                  value={captchaAnswer} 
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  placeholder="Masukkan hasil perhitungan" 
                  className="rounded-xl h-11 text-lg font-semibold"
                />
              </div>
            </CardContent>
          </Card>

          <Button 
            type="submit" 
            className="w-full btn-gradient text-white border-0 rounded-2xl h-14 text-lg font-bold gap-3 shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] flex items-center justify-center" 
            disabled={loading || isAvailable === false || isChecking}
          >
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Send className="h-6 w-6" />}
            {loading ? "Sedang Memproses..." : "Daftarkan Sekarang"}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Dengan mendaftar, Anda menyetujui <a href="#" className="underline">Syarat & Ketentuan</a> Platform SchoolPro.
          </p>

          {affiliateName && (
            <p className="text-center text-[11px] text-muted-foreground/60">
              Direkomendasikan oleh {affiliateName}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
