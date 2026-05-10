"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Server, Shield, Eye, EyeOff, Mail, MessageSquare, 
  CreditCard, Globe, Settings2, Save, ExternalLink,
  Send, Smartphone, ShieldCheck, Database, HardDrive, Cloud
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WhatsappManager } from "@/app/(dashboard)/admin/settings/whatsapp/_components/whatsapp-manager"

export default function SuperAdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  
  // States for visibility
  const [showPass, setShowPass] = useState(false)
  const [showWAToken, setShowWAToken] = useState(false)
  const [showTripayKey, setShowTripayKey] = useState(false)
  const [showS3Secret, setShowS3Secret] = useState(false)
  
  // Form State
  const [form, setForm] = useState({
    // General
    app_logo: "",
    platform_name: "SchoolPro",
    platform_tagline: "Solusi Manajemen Sekolah Digital",
    allow_impersonate_user: "true",
    enable_billing_upgrade: "false",
    enable_custom_domain: "false",
    contact_email: "support@schoolpro.id",
    
    // Email
    SMTP_HOST: "",
    SMTP_PORT: "587",
    SMTP_USER: "",
    SMTP_PASS: "",
    SMTP_FROM: "",
    
    // WhatsApp
    WA_ACTIVE_PROVIDER: "internal",
    META_WA_PHONE_NUMBER_ID: "",
    META_WA_BUSINESS_ACCOUNT_ID: "",
    META_WA_ACCESS_TOKEN: "",
    STARSENDER_API_KEY: "",
    STARSENDER_DEVICE_ID: "",
    STARSENDER_DELAY_MIN: "5",
    STARSENDER_DELAY_MAX: "15",
    WA_SUBJECT_PENDING: "",
    WA_TEMPLATE_PENDING: `Halo {{adminName}},\n\nSelamat! Formulir pendaftaran sekolah {{schoolName}} telah kami terima dan saat ini sudah masuk ke dalam antrean peninjauan tim kami.\n\nKami akan segera menghubungi Anda kembali setelah proses verifikasi selesai.\n\nTerima kasih.`,
    WA_SUBJECT_APPROVED: "",
    WA_TEMPLATE_APPROVED: `Halo {{adminName}},\n\nPendaftaran sekolah {{schoolName}} telah disetujui. Anda sekarang dapat mengakses dashboard sekolah menggunakan kredensial berikut:\n\nURL Login: {{loginUrl}}\nEmail: {{adminEmail}}\nPassword Sementara: {{tempPwd}}\n\n⚠️ PENTING: Harap segera mengganti password Anda setelah berhasil login pertama kali demi keamanan akun Anda.\n\nTerima kasih.`,
    WA_SUBJECT_REVISION: "",
    WA_TEMPLATE_REVISION: `Halo {{adminName}},\n\nTerima kasih telah mendaftar. Namun, ada beberapa data yang perlu diperbaiki:\n\n"{{adminMessage}}"\n\nSilakan hubungi kami untuk melakukan perbaikan data.`,
    WA_SUBJECT_REJECTED: "",
    WA_TEMPLATE_REJECTED: `Halo {{adminName}},\n\nMohon maaf, pendaftaran sekolah {{schoolName}} belum dapat kami setujui saat ini.\n\nAlasan: {{adminMessage}}\n\nTerima kasih atas minat Anda.`,
    WA_TEMPLATE_ALERT_SUPERADMIN: `*PENDAFTARAN SEKOLAH BARU*\n\nSekolah: {{schoolName}}\nAdmin: {{adminName}}\nWA: {{adminPhone}}\nSubdomain: {{schoolSlug}}.schoolpro.id\n\nSilakan cek di Panel Super Admin untuk meninjau pengajuan ini.`,
    WA_TEMPLATE_ALERT_AFFILIATE: `*LEAD SEKOLAH BARU! 🎉*\n\nHalo {{affiliateName}},\nKabar baik! Pendaftaran sekolah baru telah masuk menggunakan kode referral Anda ({{referralCode}}).\n\nSekolah: {{schoolName}}\nStatus: PENDING (Menunggu Review)\n\nSilakan pantau perkembangan lead Anda di Dashboard Mitra Afiliasi.`,
    
    // Payment
    TRIPAY_API_KEY: "",
    TRIPAY_PRIVATE_KEY: "",
    TRIPAY_MERCHANT_CODE: "",
    TRIPAY_MODE: "sandbox",
    MANUAL_PAYMENT_BANK: "Bank BCA",
    MANUAL_PAYMENT_NUMBER: "1234 5678 90",
    MANUAL_PAYMENT_NAME: "PT SchoolPro Indonesia",

    // Google OAuth
    GOOGLE_CLIENT_ID: "",
    GOOGLE_CLIENT_SECRET: "",

    // Cloudflare Turnstile
    TURNSTILE_ENABLED: "false",
    TURNSTILE_SITE_KEY: "",
    TURNSTILE_SECRET_KEY: "",

    // Kendali Akses Free Plan
    FREE_PLAN_ACCESS: JSON.stringify({
      enable_ppdb: false,
      enable_finance: false,
      enable_whatsapp: false,
      enable_custom_domain: false,
      enable_analytics: false,
      enable_parent_portal: false
    }),

    // Penyimpanan (Storage)
    STORAGE_PROVIDER: "local",
    S3_ENDPOINT: "https://<account_id>.r2.cloudflarestorage.com",
    S3_REGION: "auto",
    S3_ACCESS_KEY: "",
    S3_SECRET_KEY: "",
    S3_BUCKET: "",
    S3_PUBLIC_URL: "https://pub-<id>.r2.dev",
  })

  const [testEmail, setTestEmail] = useState("")
  const [testWANumber, setTestWANumber] = useState("")
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setUploadingLogo(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("subDir", "platform")
    
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      })
      const data = await res.json()
      if (res.ok) {
        setForm(prev => ({ ...prev, app_logo: data.url }))
        handleSaveBatch(['app_logo'], { app_logo: data.url })
      } else {
        toast({ title: "Upload gagal", description: data.error, variant: "destructive" })
      }
    } catch (err) {
      toast({ title: "Error", description: "Terjadi kesalahan sistem", variant: "destructive" })
    } finally {
      setUploadingLogo(false)
    }
  }

  useEffect(() => {
    fetch("/api/super-admin/settings")
      .then((r) => r.json())
      .then((data) => {
        setForm((prev) => ({ ...prev, ...data }))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSaveBatch = async (fields: string[], overrides?: Record<string, string>) => {
    setSaving(true)
    const dataToSave: Record<string, string> = {}
    fields.forEach(f => {
      // Gunakan override jika ada (untuk menghindari React stale state)
      dataToSave[f] = overrides?.[f] !== undefined ? overrides[f] : String((form as any)[f])
    })

    const res = await fetch("/api/super-admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dataToSave),
    })

    if (res.ok) {
      toast({ title: "Berhasil", description: "Pengaturan telah diperbarui." })
    }
    setSaving(false)
  }

  const handleTestEmail = async () => {
    if (!testEmail) { toast({ title: "Isi email tujuan", variant: "destructive" }); return }
    setTesting(true)
    try {
      const res = await fetch("/api/tenant/settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "smtp",
          smtpHost: form.SMTP_HOST, 
          smtpPort: Number(form.SMTP_PORT),
          smtpUser: form.SMTP_USER, 
          smtpPass: form.SMTP_PASS,
          smtpFrom: form.SMTP_FROM || form.SMTP_USER, 
          smtpTo: testEmail,
        }),
      })
      const data = await res.json()
      if (res.ok) toast({ title: "✅ Berhasil!", description: data.message })
      else throw new Error(data.error)
    } catch (e: any) {
      toast({ title: "❌ Gagal", description: e.message, variant: "destructive" })
    } finally {
      setTesting(false)
    }
  }

  const handleTestWA = async () => {
    if (!testWANumber) { toast({ title: "Isi nomor tujuan", variant: "destructive" }); return }
    
    // Test Meta WA
    if (form.WA_ACTIVE_PROVIDER === "meta") {
      if (!form.META_WA_PHONE_NUMBER_ID || !form.META_WA_ACCESS_TOKEN) {
        toast({ title: "Isi Phone ID dan Access Token Meta API", variant: "destructive" }); return
      }
      setTesting(true)
      try {
        const res = await fetch("/api/tenant/settings/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "meta_wa",
            metaPhoneId: form.META_WA_PHONE_NUMBER_ID,
            metaToken: form.META_WA_ACCESS_TOKEN,
            waPhone: testWANumber,
          }),
        })
        const data = await res.json()
        if (res.ok) toast({ title: "✅ Berhasil!", description: data.message })
        else throw new Error(data.error)
      } catch (e: any) {
        toast({ title: "❌ Gagal", description: e.message, variant: "destructive" })
      } finally {
        setTesting(false)
      }
      return
    }

    // Test StarSender / Internal
    if (!form.STARSENDER_API_KEY) { toast({ title: "Isi API Key terlebih dahulu", variant: "destructive" }); return }
    setTesting(true)
    try {
      const res = await fetch("/api/tenant/settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "whatsapp",
          waApiUrl: "https://api.starsender.online/api",
          waApiKey: form.STARSENDER_API_KEY,
          waDeviceId: form.STARSENDER_DEVICE_ID || undefined,
          waDelayMin: parseInt(form.STARSENDER_DELAY_MIN) || 5,
          waDelayMax: parseInt(form.STARSENDER_DELAY_MAX) || 15,
          waPhone: testWANumber,
        }),
      })
      const data = await res.json()
      if (res.ok) toast({ title: "✅ Berhasil!", description: data.message })
      else throw new Error(data.error)
    } catch (e: any) {
      toast({ title: "❌ Gagal", description: e.message, variant: "destructive" })
    } finally {
      setTesting(false)
    }
  }

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}</div>

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan Platform</h1>
        <p className="text-muted-foreground mt-1">Kelola identitas dan integrasi utama seluruh platform dalam satu tempat.</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <div className="flex justify-between items-center bg-white/50 p-1 rounded-2xl border backdrop-blur-sm sticky top-0 z-10">
          <TabsList className="bg-transparent border-0 h-11 flex overflow-x-auto w-full justify-start no-scrollbar">
            <TabsTrigger value="general" className="rounded-xl px-6 data-[state=active]:bg-primary data-[state=active]:text-white transition-all whitespace-nowrap">Umum</TabsTrigger>
            <TabsTrigger value="email" className="rounded-xl px-6 data-[state=active]:bg-primary data-[state=active]:text-white transition-all whitespace-nowrap">Email & SMTP</TabsTrigger>
            <TabsTrigger value="whatsapp" className="rounded-xl px-6 data-[state=active]:bg-primary data-[state=active]:text-white transition-all whitespace-nowrap">WhatsApp</TabsTrigger>
            <TabsTrigger value="payment" className="rounded-xl px-6 data-[state=active]:bg-primary data-[state=active]:text-white transition-all whitespace-nowrap">Pembayaran</TabsTrigger>
            <TabsTrigger value="storage" className="rounded-xl px-6 data-[state=active]:bg-primary data-[state=active]:text-white transition-all whitespace-nowrap">Penyimpanan</TabsTrigger>
            <TabsTrigger value="google" className="rounded-xl px-6 data-[state=active]:bg-primary data-[state=active]:text-white transition-all whitespace-nowrap">Google Login</TabsTrigger>
            <TabsTrigger value="plan_access" className="rounded-xl px-6 data-[state=active]:bg-primary data-[state=active]:text-white transition-all whitespace-nowrap">Kendali Fitur</TabsTrigger>
          </TabsList>
        </div>

        {/* --- TAB: UMUM --- */}
        <TabsContent value="general" className="grid gap-6 lg:grid-cols-2 outline-none">
          <Card className="glass border-0">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10"><Globe className="h-4 w-4 text-primary" /></div>
                <CardTitle className="text-lg">Identitas Platform</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Logo Platform (SaaS)</Label>
                <div className="flex items-center gap-4">
                  {form.app_logo ? (
                    <img src={form.app_logo} alt="Logo" className="h-16 w-auto object-contain rounded-lg border bg-white p-1" />
                  ) : (
                    <div className="h-16 w-16 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted/50">
                      <Globe className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <Input 
                      type="file" 
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                      className="rounded-xl h-11"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {uploadingLogo ? "Mengunggah..." : "Maks 2MB. Format: JPG, PNG, WEBP."}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nama Platform</Label>
                <Input value={form.platform_name} onChange={e => setForm({...form, platform_name: e.target.value})} placeholder="SchoolPro" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Tagline Platform</Label>
                <Input value={form.platform_tagline} onChange={e => setForm({...form, platform_tagline: e.target.value})} placeholder="Solusi Manajemen Digital" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Email Kontak</Label>
                <Input value={form.contact_email} onChange={e => setForm({...form, contact_email: e.target.value})} placeholder="support@schoolpro.id" className="rounded-xl" />
              </div>

              <Button 
                className="w-full gap-2 btn-gradient text-white border-0 rounded-xl"
                onClick={() => handleSaveBatch(['platform_name', 'platform_tagline', 'contact_email'])}
                disabled={saving || uploadingLogo}
              >
                {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-4 w-4" />}
                Simpan Identitas Platform
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="glass border-0">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10"><Shield className="h-4 w-4 text-primary" /></div>
                  <CardTitle className="text-lg">Keamanan & Fitur</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <button
                  onClick={() => {
                    const newVal = form.allow_impersonate_user === "true" ? "false" : "true"
                    setForm({...form, allow_impersonate_user: newVal})
                    handleSaveBatch(['allow_impersonate_user'], { allow_impersonate_user: newVal })
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl border-2 p-4 transition-all duration-200 text-left",
                    form.allow_impersonate_user === "true" ? "border-primary bg-primary/5" : "border-transparent bg-muted/50 hover:bg-muted"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", form.allow_impersonate_user === "true" ? "bg-primary/10" : "bg-muted")}>
                      {form.allow_impersonate_user === "true" ? <Eye className="h-5 w-5 text-primary" /> : <EyeOff className="h-5 w-5 text-muted-foreground" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">Login Sebagai User</p>
                      <p className="text-xs text-muted-foreground">Izinkan Super Admin login ke tenant dashboard</p>
                    </div>
                  </div>
                  <div className={cn("h-2.5 w-2.5 rounded-full", form.allow_impersonate_user === "true" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-muted-foreground/30")} />
                </button>

                <button
                  onClick={() => {
                    const newVal = form.enable_billing_upgrade === "true" ? "false" : "true"
                    setForm({...form, enable_billing_upgrade: newVal})
                    handleSaveBatch(['enable_billing_upgrade'], { enable_billing_upgrade: newVal })
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl border-2 p-4 transition-all duration-200 text-left",
                    form.enable_billing_upgrade === "true" ? "border-primary bg-primary/5" : "border-transparent bg-muted/50 hover:bg-muted"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", form.enable_billing_upgrade === "true" ? "bg-primary/10" : "bg-muted")}>
                      <CreditCard className={cn("h-5 w-5", form.enable_billing_upgrade === "true" ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Fitur Upgrade Paket</p>
                      <p className="text-xs text-muted-foreground">Izinkan pengguna melakukan upgrade paket ke PRO</p>
                    </div>
                  </div>
                  <div className={cn("h-2.5 w-2.5 rounded-full", form.enable_billing_upgrade === "true" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-muted-foreground/30")} />
                </button>

                <button
                  onClick={() => {
                    const newVal = form.enable_custom_domain === "true" ? "false" : "true"
                    setForm({...form, enable_custom_domain: newVal})
                    handleSaveBatch(['enable_custom_domain'], { enable_custom_domain: newVal })
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl border-2 p-4 transition-all duration-200 text-left",
                    form.enable_custom_domain === "true" ? "border-primary bg-primary/5" : "border-transparent bg-muted/50 hover:bg-muted"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", form.enable_custom_domain === "true" ? "bg-primary/10" : "bg-muted")}>
                      <Globe className={cn("h-5 w-5", form.enable_custom_domain === "true" ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Fitur Custom Domain</p>
                      <p className="text-xs text-muted-foreground">Izinkan tenant mengatur domain khusus (Custom Domain)</p>
                    </div>
                  </div>
                  <div className={cn("h-2.5 w-2.5 rounded-full", form.enable_custom_domain === "true" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-muted-foreground/30")} />
                </button>
              </CardContent>
            </Card>

            <Card className="glass border-0">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10"><Server className="h-4 w-4 text-primary" /></div>
                  <CardTitle className="text-lg">Informasi Sistem</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: "Status Redis", value: "Tersambung (Optimized)", color: "text-emerald-600" },
                  { label: "Mode Output", value: "Next.js Standalone", color: "text-primary" },
                  { label: "Versi Core", value: "15.1.7 (Stable)", color: "" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-xs px-1">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className={cn("font-medium", item.color)}>{item.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* --- TAB: EMAIL & SMTP --- */}
        <TabsContent value="email" className="grid gap-6 lg:grid-cols-2 outline-none">
          <Card className="glass border-0">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10"><Mail className="h-4 w-4 text-blue-500" /></div>
                <CardTitle className="text-lg">Konfigurasi SMTP</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-2">
                  <Label>SMTP Host</Label>
                  <Input value={form.SMTP_HOST} onChange={e => setForm({...form, SMTP_HOST: e.target.value})} placeholder="smtp.mailketing.co.id" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Port</Label>
                  <Input value={form.SMTP_PORT} onChange={e => setForm({...form, SMTP_PORT: e.target.value})} placeholder="587" className="rounded-xl" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Username</Label>
                <Input value={form.SMTP_USER} onChange={e => setForm({...form, SMTP_USER: e.target.value})} placeholder="user@domain.com" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Password / API Key</Label>
                <div className="relative">
                  <Input type={showPass ? "text" : "password"} value={form.SMTP_PASS} onChange={e => setForm({...form, SMTP_PASS: e.target.value})} placeholder="••••••••" className="rounded-xl pr-10" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email Pengirim (From)</Label>
                <Input value={form.SMTP_FROM} onChange={e => setForm({...form, SMTP_FROM: e.target.value})} placeholder="noreply@schoolpro.id" className="rounded-xl" />
              </div>
              <Button className="w-full gap-2 btn-gradient text-white border-0 rounded-xl mt-2" onClick={() => handleSaveBatch(['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'])} disabled={saving}>
                <Save className="h-4 w-4" /> Simpan SMTP
              </Button>
            </CardContent>
          </Card>

          <Card className="glass border-0">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10"><Send className="h-4 w-4 text-emerald-500" /></div>
                <CardTitle className="text-lg">Uji Coba Pengiriman</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Email Tujuan</Label>
                <Input value={testEmail} onChange={e => setTestEmail(e.target.value)} type="email" placeholder="tujuan@gmail.com" className="rounded-xl" />
              </div>
              <Button variant="outline" className="w-full rounded-xl gap-2 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/5" onClick={handleTestEmail} disabled={testing || !form.SMTP_HOST}>
                {testing ? "Mengirim..." : "Kirim Email Test"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- TAB: WHATSAPP --- */}
        <TabsContent value="whatsapp" className="space-y-6 outline-none">
          <Tabs defaultValue="internal" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-1">
                <h3 className="text-lg font-medium leading-none">Provider WhatsApp</h3>
                <p className="text-sm text-muted-foreground">Pilih provider yang akan digunakan untuk mengirim pesan platform.</p>
              </div>
              <TabsList className="bg-muted/50 rounded-xl p-1 border flex-wrap h-auto">
                <TabsTrigger value="internal" className="rounded-lg">Internal Gateway</TabsTrigger>
                <TabsTrigger value="starsender" className="rounded-lg">StarSender API</TabsTrigger>
                <TabsTrigger value="meta" className="rounded-lg">Meta Official API</TabsTrigger>
              </TabsList>
            </div>
            
            <div className="mb-6 rounded-xl border bg-card p-4">
               <Label className="mb-2 block">Aktifkan Provider Pengiriman Utama</Label>
               <select 
                 value={form.WA_ACTIVE_PROVIDER} 
                 onChange={e => {
                   setForm({...form, WA_ACTIVE_PROVIDER: e.target.value});
                   handleSaveBatch(['WA_ACTIVE_PROVIDER'], { WA_ACTIVE_PROVIDER: e.target.value });
                 }} 
                 className="flex h-10 w-full md:w-1/3 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
               >
                 <option value="internal">Internal Gateway</option>
                 <option value="starsender">StarSender API</option>
                 <option value="meta">Meta Official API</option>
               </select>
               <p className="text-xs text-muted-foreground mt-2">Pilih gateway mana yang aktif untuk notifikasi otomatis platform (seperti alert pendaftaran baru).</p>
            </div>

            <TabsContent value="internal" className="mt-0 outline-none">
              <Card className="glass border-0">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10"><MessageSquare className="h-4 w-4 text-emerald-500" /></div>
                    <CardTitle className="text-lg">Internal WhatsApp Gateway (Platform)</CardTitle>
                  </div>
                  <CardDescription>Hubungkan WhatsApp utama platform untuk mengirim notifikasi pendaftaran, revisi, dan alert sistem.</CardDescription>
                </CardHeader>
                <CardContent>
                  <WhatsappManager tenantId="platform" />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="starsender" className="mt-0 outline-none grid gap-6 lg:grid-cols-2">
              <Card className="glass border-0">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10"><MessageSquare className="h-4 w-4 text-emerald-500" /></div>
                    <CardTitle className="text-lg">StarSender API</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>API Token / Key</Label>
                    <div className="relative">
                      <Input type={showWAToken ? "text" : "password"} value={form.STARSENDER_API_KEY} onChange={e => setForm({...form, STARSENDER_API_KEY: e.target.value})} placeholder="Token StarSender" className="rounded-xl pr-10" />
                      <button type="button" onClick={() => setShowWAToken(!showWAToken)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showWAToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Device ID (Opsional)</Label>
                    <Input value={form.STARSENDER_DEVICE_ID} onChange={e => setForm({...form, STARSENDER_DEVICE_ID: e.target.value})} placeholder="ID Perangkat" className="rounded-xl" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Delay Minimum (Detik)</Label>
                      <Input 
                        type="number" 
                        value={form.STARSENDER_DELAY_MIN} 
                        onChange={e => setForm({...form, STARSENDER_DELAY_MIN: e.target.value})} 
                        className="rounded-xl" 
                        min="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Delay Maksimum (Detik)</Label>
                      <Input 
                        type="number" 
                        value={form.STARSENDER_DELAY_MAX} 
                        onChange={e => setForm({...form, STARSENDER_DELAY_MAX: e.target.value})} 
                        className="rounded-xl" 
                        min="0"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Penundaan waktu (jeda) acak sebelum pesan terkirim. Membantu menghindari blokir WhatsApp karena terdeteksi mengirim pesan terlalu cepat.
                  </p>

                  <Button className="w-full gap-2 btn-gradient text-white border-0 rounded-xl mt-2" onClick={() => handleSaveBatch(['STARSENDER_API_KEY', 'STARSENDER_DEVICE_ID', 'STARSENDER_DELAY_MIN', 'STARSENDER_DELAY_MAX'])} disabled={saving}>
                    <Save className="h-4 w-4" /> Simpan WhatsApp
                  </Button>
                </CardContent>
              </Card>

              <Card className="glass border-0">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10"><Smartphone className="h-4 w-4 text-primary" /></div>
                    <CardTitle className="text-lg">Test WhatsApp (StarSender)</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label>Nomor Tujuan</Label>
                    <Input value={testWANumber} onChange={e => setTestWANumber(e.target.value)} placeholder="0812345678xx" className="rounded-xl" />
                  </div>
                  <Button variant="outline" className="w-full rounded-xl gap-2 border-primary/30 text-primary hover:bg-primary/5" onClick={handleTestWA} disabled={testing || !form.STARSENDER_API_KEY}>
                    {testing ? "Mengirim..." : "Kirim Pesan Tes"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB: META OFFICIAL API */}
            <TabsContent value="meta" className="mt-0 outline-none grid gap-6 lg:grid-cols-2">
              <Card className="glass border-0">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10"><MessageSquare className="h-4 w-4 text-blue-500" /></div>
                    <CardTitle className="text-lg">Meta Official API</CardTitle>
                  </div>
                  <CardDescription>Gunakan API Resmi WhatsApp untuk pengiriman stabil dan aman.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Phone Number ID</Label>
                    <Input value={form.META_WA_PHONE_NUMBER_ID} onChange={e => setForm({...form, META_WA_PHONE_NUMBER_ID: e.target.value})} placeholder="Misal: 102345678901234" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Business Account ID</Label>
                    <Input value={form.META_WA_BUSINESS_ACCOUNT_ID} onChange={e => setForm({...form, META_WA_BUSINESS_ACCOUNT_ID: e.target.value})} placeholder="Misal: 104567890123456" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Permanent Access Token</Label>
                    <div className="relative">
                      <Input type={showWAToken ? "text" : "password"} value={form.META_WA_ACCESS_TOKEN} onChange={e => setForm({...form, META_WA_ACCESS_TOKEN: e.target.value})} placeholder="EAAxxxx..." className="rounded-xl pr-10" />
                      <button type="button" onClick={() => setShowWAToken(!showWAToken)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showWAToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                    </div>
                  </div>
                  <Button className="w-full gap-2 btn-gradient text-white border-0 rounded-xl mt-2" onClick={() => handleSaveBatch(['META_WA_PHONE_NUMBER_ID', 'META_WA_BUSINESS_ACCOUNT_ID', 'META_WA_ACCESS_TOKEN'])} disabled={saving}>
                    <Save className="h-4 w-4" /> Simpan Kredensial Meta
                  </Button>
                </CardContent>
              </Card>

              <Card className="glass border-0">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10"><Smartphone className="h-4 w-4 text-primary" /></div>
                    <CardTitle className="text-lg">Test WhatsApp (Meta API)</CardTitle>
                  </div>
                  <CardDescription>Pesan pertama mungkin membutuhkan Message Template jika nomor belum pernah membalas Anda (24-hour window).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label>Nomor Tujuan</Label>
                    <Input value={testWANumber} onChange={e => setTestWANumber(e.target.value)} placeholder="0812345678xx" className="rounded-xl" />
                  </div>
                  <Button variant="outline" className="w-full rounded-xl gap-2 border-primary/30 text-primary hover:bg-primary/5" onClick={() => { setForm({...form, WA_ACTIVE_PROVIDER: 'meta'}); setTimeout(handleTestWA, 100); }} disabled={testing || !form.META_WA_PHONE_NUMBER_ID || !form.META_WA_ACCESS_TOKEN}>
                    {testing ? "Mengirim..." : "Kirim Pesan Tes (Meta)"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="glass border-0">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10"><ShieldCheck className="h-4 w-4 text-blue-500" /></div>
                    <CardTitle className="text-lg">Konfigurasi Webhook & Meta App</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="text-sm space-y-4 text-muted-foreground">
                  <p>Gunakan informasi berikut untuk setup App di <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">Meta for Developers</a>:</p>
                  <div className="rounded-xl bg-muted/50 p-4 space-y-3">
                    <div>
                      <p className="font-semibold text-foreground mb-1">URL Kebijakan Privasi:</p>
                      <code className="block bg-background border p-2 rounded-lg text-xs break-all">https://schoolpro.id/privacy-policy</code>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground mb-1">Webhook Callback URL:</p>
                      <code className="block bg-background border p-2 rounded-lg text-xs break-all">https://schoolpro.id/api/webhook/meta-wa</code>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground mb-1">Webhook Verify Token:</p>
                      <code className="block bg-background border p-2 rounded-lg text-xs break-all">schoolpro_meta_verify_token_123</code>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card className="glass border-0 lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10"><Settings2 className="h-4 w-4 text-blue-500" /></div>
                <CardTitle className="text-lg">Template Pesan WhatsApp</CardTitle>
              </div>
              <CardDescription>Gunakan variabel dinamis seperti {'{{adminName}}, {{schoolName}}, {{adminEmail}}, {{tempPwd}}, {{schoolSlug}}, {{adminMessage}}, {{adminPhone}}, {{affiliateName}}, {{referralCode}}'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-emerald-600 font-bold">1. Pendaftaran Diterima (PENDING)</Label>
                  <Textarea value={form.WA_TEMPLATE_PENDING} onChange={e => setForm({...form, WA_TEMPLATE_PENDING: e.target.value})} placeholder={`Halo {{adminName}},\nSelamat! Pendaftaran {{schoolName}} diterima.`} className="min-h-[100px] text-xs font-mono" />
                </div>
                <div className="space-y-2">
                  <Label className="text-blue-600 font-bold">2. Pendaftaran Disetujui (APPROVED)</Label>
                  <Textarea value={form.WA_TEMPLATE_APPROVED} onChange={e => setForm({...form, WA_TEMPLATE_APPROVED: e.target.value})} placeholder={`Halo {{adminName}},\nPendaftaran {{schoolName}} disetujui. URL: {{loginUrl}}`} className="min-h-[100px] text-xs font-mono" />
                </div>
                <div className="space-y-2">
                  <Label className="text-amber-600 font-bold">3. Revisi Data (REVISION)</Label>
                  <Textarea value={form.WA_TEMPLATE_REVISION} onChange={e => setForm({...form, WA_TEMPLATE_REVISION: e.target.value})} placeholder={`Halo {{adminName}},\nRevisi: {{adminMessage}}`} className="min-h-[100px] text-xs font-mono" />
                </div>
                <div className="space-y-2">
                  <Label className="text-red-600 font-bold">4. Pendaftaran Ditolak (REJECTED)</Label>
                  <Textarea value={form.WA_TEMPLATE_REJECTED} onChange={e => setForm({...form, WA_TEMPLATE_REJECTED: e.target.value})} placeholder={`Halo {{adminName}},\nDitolak: {{adminMessage}}`} className="min-h-[100px] text-xs font-mono" />
                </div>
                <div className="space-y-2">
                  <Label className="text-purple-600 font-bold">5. Alert ke Super Admin</Label>
                  <Textarea value={form.WA_TEMPLATE_ALERT_SUPERADMIN} onChange={e => setForm({...form, WA_TEMPLATE_ALERT_SUPERADMIN: e.target.value})} placeholder={`Sekolah Baru: {{schoolName}}\nWA: {{adminPhone}}`} className="min-h-[100px] text-xs font-mono" />
                </div>
                <div className="space-y-2">
                  <Label className="text-orange-600 font-bold">6. Alert ke Marketer (Afiliasi)</Label>
                  <Textarea value={form.WA_TEMPLATE_ALERT_AFFILIATE} onChange={e => setForm({...form, WA_TEMPLATE_ALERT_AFFILIATE: e.target.value})} placeholder={`Halo {{affiliateName}},\nLead baru: {{schoolName}}`} className="min-h-[100px] text-xs font-mono" />
                </div>
              </div>
              <Button 
                className="w-full gap-2 btn-gradient text-white border-0 rounded-xl" 
                onClick={() => handleSaveBatch(['WA_TEMPLATE_PENDING', 'WA_TEMPLATE_APPROVED', 'WA_TEMPLATE_REVISION', 'WA_TEMPLATE_REJECTED', 'WA_TEMPLATE_ALERT_SUPERADMIN', 'WA_TEMPLATE_ALERT_AFFILIATE'])} 
                disabled={saving}
              >
                <Save className="h-4 w-4" /> Simpan Semua Template Pesan
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- TAB: PEMBAYARAN --- */}
        <TabsContent value="payment" className="grid gap-6 lg:grid-cols-2 outline-none">
          <Card className="glass border-0">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10"><CreditCard className="h-4 w-4 text-purple-500" /></div>
                <CardTitle className="text-lg">Konfigurasi Tripay</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tripay Mode</Label>
                <select value={form.TRIPAY_MODE} onChange={e => setForm({...form, TRIPAY_MODE: e.target.value})} className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="sandbox">Sandbox (Testing)</option>
                  <option value="live">Live (Produksi)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Merchant Code</Label>
                <Input value={form.TRIPAY_MERCHANT_CODE} onChange={e => setForm({...form, TRIPAY_MERCHANT_CODE: e.target.value})} placeholder="TXXXX" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>API Key</Label>
                <div className="relative">
                  <Input type={showTripayKey ? "text" : "password"} value={form.TRIPAY_API_KEY} onChange={e => setForm({...form, TRIPAY_API_KEY: e.target.value})} placeholder="API Key" className="rounded-xl pr-10" />
                  <button type="button" onClick={() => setShowTripayKey(!showTripayKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showTripayKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Private Key</Label>
                <Input type="password" value={form.TRIPAY_PRIVATE_KEY} onChange={e => setForm({...form, TRIPAY_PRIVATE_KEY: e.target.value})} placeholder="Private Key" className="rounded-xl" />
              </div>
              <Button className="w-full gap-2 btn-gradient text-white border-0 rounded-xl mt-2" onClick={() => handleSaveBatch(['TRIPAY_MODE', 'TRIPAY_MERCHANT_CODE', 'TRIPAY_API_KEY', 'TRIPAY_PRIVATE_KEY'])} disabled={saving}>
                <Save className="h-4 w-4" /> Simpan Pembayaran
              </Button>
            </CardContent>
          </Card>

          <Card className="glass border-0">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10"><ShieldCheck className="h-4 w-4 text-blue-500" /></div>
                <CardTitle className="text-lg">Informasi Integrasi</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm space-y-4 text-muted-foreground">
              <p>API platform digunakan untuk tagihan otomatis upgrade paket langganan tenant.</p>
              <div className="rounded-xl bg-muted/50 p-4 space-y-2">
                <p className="font-semibold text-foreground">URL Callback / IPN:</p>
                <code className="block bg-muted p-2 rounded-lg text-xs break-all">https://schoolpro.id/api/payment/callback</code>
                <p className="text-[10px]">Daftarkan URL ini di dashboard Tripay Anda.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-0 lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-500/10"><CreditCard className="h-4 w-4 text-green-500" /></div>
                <CardTitle className="text-lg">Rekening Pembayaran Manual</CardTitle>
              </div>
              <CardDescription>Rekening ini akan ditampilkan kepada tenant untuk keperluan transfer manual jika Tripay belum dikonfigurasi.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Nama Bank</Label>
                  <Input value={form.MANUAL_PAYMENT_BANK} onChange={e => setForm({...form, MANUAL_PAYMENT_BANK: e.target.value})} placeholder="Bank BCA" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Nomor Rekening</Label>
                  <Input value={form.MANUAL_PAYMENT_NUMBER} onChange={e => setForm({...form, MANUAL_PAYMENT_NUMBER: e.target.value})} placeholder="1234 5678 90" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Atas Nama (Pemilik)</Label>
                  <Input value={form.MANUAL_PAYMENT_NAME} onChange={e => setForm({...form, MANUAL_PAYMENT_NAME: e.target.value})} placeholder="PT SchoolPro Indonesia" className="rounded-xl" />
                </div>
              </div>
              <Button className="w-full gap-2 btn-gradient text-white border-0 rounded-xl mt-2" onClick={() => handleSaveBatch(['MANUAL_PAYMENT_BANK', 'MANUAL_PAYMENT_NUMBER', 'MANUAL_PAYMENT_NAME'])} disabled={saving}>
                <Save className="h-4 w-4" /> Simpan Rekening Manual
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- TAB: PENYIMPANAN (STORAGE) --- */}
        <TabsContent value="storage" className="grid gap-6 lg:grid-cols-2 outline-none">
          <Card className="glass border-0">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10"><HardDrive className="h-4 w-4 text-orange-500" /></div>
                <CardTitle className="text-lg">Tipe Penyimpanan</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Pilih Provider Storage</Label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      setForm({...form, STORAGE_PROVIDER: "local"})
                      handleSaveBatch(['STORAGE_PROVIDER'], { STORAGE_PROVIDER: "local" })
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-xl border-2 p-4 transition-all duration-200 gap-2",
                      form.STORAGE_PROVIDER === "local" ? "border-orange-500 bg-orange-500/10 text-orange-600" : "border-border hover:bg-muted text-muted-foreground"
                    )}
                  >
                    <HardDrive className="h-6 w-6" />
                    <span className="font-semibold text-sm">Lokal (VPS Disk)</span>
                  </button>
                  <button
                    onClick={() => {
                      setForm({...form, STORAGE_PROVIDER: "s3"})
                      handleSaveBatch(['STORAGE_PROVIDER'], { STORAGE_PROVIDER: "s3" })
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-xl border-2 p-4 transition-all duration-200 gap-2",
                      form.STORAGE_PROVIDER === "s3" ? "border-orange-500 bg-orange-500/10 text-orange-600" : "border-border hover:bg-muted text-muted-foreground"
                    )}
                  >
                    <Cloud className="h-6 w-6" />
                    <span className="font-semibold text-sm">S3 / Cloudflare R2</span>
                  </button>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                  Mengubah penyimpanan ke S3/R2 akan membuat semua <strong>unggahan baru</strong> masuk ke Cloud. File lama akan tetap dibaca dari Lokal.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className={cn("glass border-0 transition-opacity", form.STORAGE_PROVIDER === "local" && "opacity-50 pointer-events-none")}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10"><Cloud className="h-4 w-4 text-orange-500" /></div>
                <CardTitle className="text-lg">Kredensial S3 API</CardTitle>
              </div>
              <CardDescription>Gunakan endpoint kompatibel S3 (seperti AWS, DigitalOcean Spaces, atau Cloudflare R2).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>S3 Endpoint</Label>
                <Input value={form.S3_ENDPOINT} onChange={e => setForm({...form, S3_ENDPOINT: e.target.value})} placeholder="https://<account_id>.r2.cloudflarestorage.com" className="rounded-xl font-mono text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Region</Label>
                  <Input value={form.S3_REGION} onChange={e => setForm({...form, S3_REGION: e.target.value})} placeholder="auto" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Bucket Name</Label>
                  <Input value={form.S3_BUCKET} onChange={e => setForm({...form, S3_BUCKET: e.target.value})} placeholder="schoolpro-assets" className="rounded-xl" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Access Key ID</Label>
                <Input value={form.S3_ACCESS_KEY} onChange={e => setForm({...form, S3_ACCESS_KEY: e.target.value})} placeholder="Access Key" className="rounded-xl font-mono text-xs" />
              </div>
              <div className="space-y-2">
                <Label>Secret Access Key</Label>
                <div className="relative">
                  <Input type={showS3Secret ? "text" : "password"} value={form.S3_SECRET_KEY} onChange={e => setForm({...form, S3_SECRET_KEY: e.target.value})} placeholder="Secret Key" className="rounded-xl font-mono text-xs pr-10" />
                  <button type="button" onClick={() => setShowS3Secret(!showS3Secret)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showS3Secret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Public URL / Custom Domain</Label>
                <Input value={form.S3_PUBLIC_URL} onChange={e => setForm({...form, S3_PUBLIC_URL: e.target.value})} placeholder="https://pub-<id>.r2.dev" className="rounded-xl font-mono text-xs" />
                <p className="text-[10px] text-muted-foreground">URL dasar untuk mengakses file dari publik. Jangan akhiri dengan slash (/).</p>
              </div>
              <Button className="w-full gap-2 bg-orange-500 hover:bg-orange-600 text-white border-0 rounded-xl mt-2" onClick={() => handleSaveBatch(['S3_ENDPOINT', 'S3_REGION', 'S3_ACCESS_KEY', 'S3_SECRET_KEY', 'S3_BUCKET', 'S3_PUBLIC_URL'])} disabled={saving}>
                <Save className="h-4 w-4" /> Simpan Konfigurasi S3
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- TAB: GOOGLE OAUTH --- */}
        <TabsContent value="google" className="grid gap-6 lg:grid-cols-2 outline-none">
          <Card className="glass border-0">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-red-500" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                </div>
                <CardTitle className="text-lg">Google Login (OAuth 2.0)</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Kredensial ini digunakan untuk login Super Admin dan pendaftaran Mitra Afiliasi secara otomatis di domain utama.</p>
              
              <div className="space-y-2">
                <Label>Client ID</Label>
                <Input value={form.GOOGLE_CLIENT_ID} onChange={e => setForm({...form, GOOGLE_CLIENT_ID: e.target.value})} placeholder="Masukkan Google Client ID" className="rounded-xl font-mono text-xs" />
              </div>
              <div className="space-y-2">
                <Label>Client Secret</Label>
                <Input type="password" value={form.GOOGLE_CLIENT_SECRET} onChange={e => setForm({...form, GOOGLE_CLIENT_SECRET: e.target.value})} placeholder="Masukkan Google Client Secret" className="rounded-xl font-mono text-xs" />
              </div>
              <Button className="w-full gap-2 btn-gradient text-white border-0 rounded-xl mt-2" onClick={() => handleSaveBatch(['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'])} disabled={saving}>
                <Save className="h-4 w-4" /> Simpan Kredensial
              </Button>
            </CardContent>
          </Card>

          <Card className="glass border-0">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10">
                  <ShieldCheck className="h-4 w-4 text-orange-500" />
                </div>
                <CardTitle className="text-lg">Keamanan Cloudflare Turnstile</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Konfigurasi Cloudflare Turnstile untuk mencegah serangan bot dan spam pada halaman Login Super Admin.</p>
              
              <button
                onClick={() => {
                  const newVal = form.TURNSTILE_ENABLED === "true" ? "false" : "true"
                  setForm({...form, TURNSTILE_ENABLED: newVal})
                  handleSaveBatch(['TURNSTILE_ENABLED'], { TURNSTILE_ENABLED: newVal })
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl border-2 p-4 transition-all duration-200 text-left mb-4 mt-4",
                  form.TURNSTILE_ENABLED === "true" ? "border-primary bg-primary/5" : "border-transparent bg-muted/50 hover:bg-muted"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", form.TURNSTILE_ENABLED === "true" ? "bg-primary/10" : "bg-muted")}>
                    <ShieldCheck className={cn("h-5 w-5", form.TURNSTILE_ENABLED === "true" ? "text-primary" : "text-muted-foreground")} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Aktifkan Turnstile</p>
                    <p className="text-xs text-muted-foreground">Wajibkan CAPTCHA pada halaman login</p>
                  </div>
                </div>
                <div className={cn("h-2.5 w-2.5 rounded-full", form.TURNSTILE_ENABLED === "true" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-muted-foreground/30")} />
              </button>

              <div className="space-y-2">
                <Label>Site Key</Label>
                <Input value={form.TURNSTILE_SITE_KEY} onChange={e => setForm({...form, TURNSTILE_SITE_KEY: e.target.value})} placeholder="Masukkan Site Key" className="rounded-xl font-mono text-xs" />
              </div>
              <div className="space-y-2">
                <Label>Secret Key</Label>
                <Input type="password" value={form.TURNSTILE_SECRET_KEY} onChange={e => setForm({...form, TURNSTILE_SECRET_KEY: e.target.value})} placeholder="Masukkan Secret Key" className="rounded-xl font-mono text-xs" />
              </div>
              <Button className="w-full gap-2 btn-gradient text-white border-0 rounded-xl mt-2" onClick={() => handleSaveBatch(['TURNSTILE_SITE_KEY', 'TURNSTILE_SECRET_KEY'])} disabled={saving}>
                <Save className="h-4 w-4" /> Simpan Kredensial
              </Button>
            </CardContent>
          </Card>


          <Card className="glass border-0">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10"><ExternalLink className="h-4 w-4 text-primary" /></div>
                <CardTitle className="text-lg">Panduan Singkat</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm space-y-4 text-muted-foreground">
              <p>Untuk mendapatkan Client ID dan Secret:</p>
              <ol className="list-decimal pl-4 space-y-2">
                <li>Buka <a href="https://console.cloud.google.com" target="_blank" className="text-primary hover:underline font-medium">Google Cloud Console</a>.</li>
                <li>Pilih atau buat project baru.</li>
                <li>Masuk ke menu <strong>APIs & Services &gt; Credentials</strong>.</li>
                <li>Klik <strong>Create Credentials &gt; OAuth client ID</strong>.</li>
                <li>Pilih <strong>Web application</strong>.</li>
                <li>Pada <strong>Authorized redirect URIs</strong>, tambahkan URL berikut:
                  <code className="block mt-1 bg-muted p-2 rounded-lg text-xs break-all text-foreground font-semibold">https://schoolpro.my.id/api/auth/callback/google</code>
                  <code className="block mt-1 bg-muted p-2 rounded-lg text-xs break-all text-foreground font-semibold">https://schoolpro.id/api/auth/callback/google</code>
                </li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>
        {/* --- TAB: KENDALI FITUR --- */}
        <TabsContent value="plan_access" className="grid gap-6 outline-none">
          <Card className="glass border-0">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10"><Settings2 className="h-4 w-4 text-primary" /></div>
                <CardTitle className="text-lg">Kendali Akses Paket Free</CardTitle>
              </div>
              <CardDescription>Aktifkan atau matikan modul mana saja yang dapat diakses oleh sekolah dengan paket gratis (Free Plan).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                let access: Record<string, boolean> = {};
                try { access = JSON.parse(form.FREE_PLAN_ACCESS || "{}"); } catch (e) {}
                
                const toggleFeature = (key: string) => {
                  const newAccess = { ...access, [key]: !access[key] };
                  const newVal = JSON.stringify(newAccess);
                  setForm({ ...form, FREE_PLAN_ACCESS: newVal });
                  handleSaveBatch(['FREE_PLAN_ACCESS'], { FREE_PLAN_ACCESS: newVal });
                };

                const features = [
                  { key: "enable_ppdb", title: "Modul PPDB Online", desc: "Izinkan penerimaan siswa baru online." },
                  { key: "enable_finance", title: "Modul Keuangan (Tagihan)", desc: "Izinkan pencatatan tagihan dan integrasi SPP." },
                  { key: "enable_whatsapp", title: "WhatsApp Gateway", desc: "Izinkan pengiriman pesan dan notifikasi otomatis." },
                  { key: "enable_custom_domain", title: "Custom Domain", desc: "Izinkan pengaturan domain mandiri (.sch.id dll)." },
                  { key: "enable_analytics", title: "Dashboard Analytics", desc: "Izinkan akses ke grafik analitik di halaman utama." },
                  { key: "enable_parent_portal", title: "Portal Orang Tua", desc: "Izinkan akses portal mandiri bagi orang tua wali." }
                ];

                return features.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => toggleFeature(f.key)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl border-2 p-4 transition-all duration-200 text-left",
                      access[f.key] ? "border-primary bg-primary/5" : "border-transparent bg-muted/50 hover:bg-muted"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", access[f.key] ? "bg-primary/10" : "bg-muted")}>
                        {access[f.key] ? <Eye className="h-5 w-5 text-primary" /> : <EyeOff className="h-5 w-5 text-muted-foreground" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{f.title}</p>
                        <p className="text-xs text-muted-foreground">{f.desc}</p>
                      </div>
                    </div>
                    <div className={cn("h-2.5 w-2.5 rounded-full", access[f.key] ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-muted-foreground/30")} />
                  </button>
                ))
              })()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
