"use client"

import { useState, useEffect, Suspense } from "react"
import { Card, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Mail, Send, CheckCircle2, Loader2 } from "lucide-react"
import { trackMetaEvent } from "@/components/shared/meta-pixel"
import { useSearchParams } from "next/navigation"

import { getTenantCount } from "./actions"
import { SchoolProfileSection } from "./_components/school-profile-section"
import { LocationSection } from "./_components/location-section"
import { AdminContactSection } from "./_components/admin-contact-section"
import { AdditionalInfoSection } from "./_components/additional-info-section"

function RegisterSchoolForm() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [tenantCount, setTenantCount] = useState<number | null>(null)

  useEffect(() => {
    getTenantCount().then(count => {
      setTenantCount(count > 0 ? count : null)
    })
  }, [])
  
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [affiliateName, setAffiliateName] = useState<string | null>(null)
  const [csPhone, setCsPhone] = useState<string | null>(null)
  
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const [captchaParams, setCaptchaParams] = useState({ a: 0, b: 0 })
  const [captchaAnswer, setCaptchaAnswer] = useState("")
  const [isReferralLocked, setIsReferralLocked] = useState(false)
  
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

    const ref = searchParams.get('ref') || searchParams.get('r')
    let activeRef = ref

    const utmSource = searchParams.get('utm_source') || ''
    const utmMedium = searchParams.get('utm_medium') || ''
    const utmCampaign = searchParams.get('utm_campaign') || ''
    const utmContent = searchParams.get('utm_content') || ''
    const utmTerm = searchParams.get('utm_term') || ''
    setForm(prev => ({ ...prev, utmSource, utmMedium, utmCampaign, utmContent, utmTerm }))

    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`
      const parts = value.split(`; ${name}=`)
      if (parts.length === 2) return parts.pop()?.split(';').shift()
      return null
    }

    if (ref) {
      setForm(prev => ({ ...prev, referralCode: ref }))
      localStorage.setItem('schoolpro_ref', ref)
      document.cookie = `schoolpro_ref=${ref}; path=/; max-age=${30 * 24 * 60 * 60}`
    } else {
      const storedRef = localStorage.getItem('schoolpro_ref') || getCookie('schoolpro_ref')
      if (storedRef) {
        activeRef = storedRef
        setForm(prev => ({ ...prev, referralCode: storedRef }))
      }
    }

    if (activeRef) {
      setIsReferralLocked(true)
      fetch(`/api/public/affiliate-info?ref=${activeRef}`)
        .then(res => res.json())
        .then(data => {
          if (data.name) setAffiliateName(data.name)
        })
        .catch(console.error)
    }
  }, [searchParams])

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
      toast({ title: "Email Tidak Valid", description: "Mohon gunakan email @gmail.com aktif.", variant: "destructive" })
      return
    }

    if (isAvailable === false) {
      toast({ title: "Gagal", description: "Subdomain sudah digunakan", variant: "destructive" })
      return
    }

    if (!window.confirm(`Pastikan email Anda (${form.adminEmail}) aktif.\n\nLanjutkan pendaftaran?`)) {
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
        
        if (!uploadRes.ok) {
          const errData = await uploadRes.json()
          throw new Error(errData?.error || "Gagal upload logo")
        }
        
        const uploadData = await uploadRes.json()
        uploadedLogoUrl = uploadData.url
      } catch (err: any) {
        setLoading(false)
        toast({ title: "Gagal Mengunggah Logo", description: err.message, variant: "destructive" })
        return
      }
    }

    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`
      const parts = value.split(`; ${name}=`)
      if (parts.length === 2) return parts.pop()?.split(';').shift()
      return null
    }

    const originalRef = typeof window !== "undefined" ? localStorage.getItem('schoolpro_ref') : null
    const cookieRef = getCookie('schoolpro_ref')
    const finalReferralCode = originalRef || cookieRef || form.referralCode

    const payload = { ...form, referralCode: finalReferralCode, logo: uploadedLogoUrl || null }
    try {
      const res = await fetch("/api/public/register-school", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      
      const data = await res.json()
      setLoading(false)

      if (res.ok) {
        if (data.csPhone) setCsPhone(data.csPhone)
        setSubmitted(true)
        trackMetaEvent('Lead')
        toast({ title: "Berhasil!", description: `Pendaftaran website sekolah berhasil dikirim.` })
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
            <CardTitle className="text-2xl font-bold">Pendaftaran Terkirim!</CardTitle>
            <CardDescription className="text-base">
              Pendaftaran website sekolah <strong>{form.schoolName}</strong> berhasil dikirim.
            </CardDescription>
            <Alert className="bg-primary/5 border-primary/20 text-left mt-4 mb-2">
              <Mail className="h-5 w-5 text-primary" />
              <AlertTitle className="text-primary font-bold">Cek Email Anda Sekarang!</AlertTitle>
              <AlertDescription className="text-muted-foreground text-sm mt-1">
                Kami telah mengirimkan tautan verifikasi ke <strong>{form.adminEmail}</strong>.
              </AlertDescription>
            </Alert>
          </div>
          {csPhone ? (
            <Button 
              className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white border-0" 
              onClick={() => {
                const text = encodeURIComponent(`halo admin saya sudah isi formulir pengajuan website untuk sekolah saya ${form.schoolName} dengan email ${form.adminEmail}`)
                const phoneStr = csPhone.startsWith('0') ? '62' + csPhone.substring(1) : csPhone
                window.open(`https://wa.me/${phoneStr}?text=${text}`, '_blank')
                window.location.href = "/"
              }}
            > 
              Chat Admin Sekarang 
            </Button>
          ) : (
            <Button className="w-full rounded-xl btn-gradient text-white border-0" onClick={() => window.location.href = "/"}> 
              Selesai 
            </Button>
          )}
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/30 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-0 px-3 py-1">Formulir Pendaftaran</Badge>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Daftarkan Sekolah Anda</h1>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto leading-relaxed">
            Bergabunglah dengan {tenantCount ? <span className="font-semibold text-primary">{tenantCount}</span> : "ratusan"} sekolah lainnya dalam transformasi digital manajemen sekolah.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <SchoolProfileSection 
            form={form} setForm={setForm}
            logoPreview={logoPreview} setLogoPreview={setLogoPreview} setLogoFile={setLogoFile}
            isAvailable={isAvailable} isChecking={isChecking} toast={toast}
          />
          <LocationSection form={form} setForm={setForm} />
          <AdditionalInfoSection 
            form={form} setForm={setForm} 
            isReferralLocked={isReferralLocked} setAffiliateName={setAffiliateName} 
          />
          <AdminContactSection form={form} setForm={setForm} />

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

export default function RegisterSchoolPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <RegisterSchoolForm />
    </Suspense>
  )
}
