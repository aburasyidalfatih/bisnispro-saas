"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Mail, Save, Send, Eye, EyeOff, Info, CheckCircle } from "lucide-react"

interface SmtpConfig {
  smtpHost: string
  smtpPort: string
  smtpUser: string
  smtpPass: string
  smtpFrom: string
  smtpFromName: string
}

export default function EmailSettingsPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [testEmail, setTestEmail] = useState("")
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [useCustom, setUseCustom] = useState(false)
  const [config, setConfig] = useState<SmtpConfig>({
    smtpHost: "",
    smtpPort: "587",
    smtpUser: "",
    smtpPass: "",
    smtpFrom: "",
    smtpFromName: "",
  })

  useEffect(() => {
    const id = session?.user?.tenants?.[0]?.id
    if (!id) {
      const match = document.cookie.match(/impersonate-tenant=([^;]+)/)
      const slug = match?.[1]
      if (slug) {
        fetch(`/api/tenant/by-slug?slug=${slug}`)
          .then((r) => r.json())
          .then((data) => { if (data.id) setTenantId(data.id) })
      }
      return
    }
    setTenantId(id)
  }, [session?.user?.tenants])

  useEffect(() => {
    if (!tenantId) return
    fetch(`/api/tenant/settings?tenantId=${tenantId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.smtp) {
          setConfig(data.smtp)
          setUseCustom(true)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [tenantId])

  const set = (field: keyof SmtpConfig) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setConfig({ ...config, [field]: e.target.value })

  const handleSave = async () => {
    if (!tenantId) return
    setSaving(true)
    const res = await fetch("/api/tenant/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId,
        settings: useCustom ? { smtp: config } : { smtp: null },
      }),
    })
    setSaving(false)
    if (res.ok) {
      toast({ title: "Disimpan", description: "Konfigurasi SMTP berhasil disimpan." })
    } else {
      toast({ title: "Gagal", description: "Terjadi kesalahan.", variant: "destructive" })
    }
  }

  const handleTest = async () => {
    if (!testEmail) {
      toast({ title: "Isi email tujuan", description: "Masukkan email untuk menerima test.", variant: "destructive" })
      return
    }
    setTesting(true)
    const res = await fetch("/api/tenant/settings/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "smtp",
        smtpHost: config.smtpHost,
        smtpPort: Number(config.smtpPort),
        smtpUser: config.smtpUser,
        smtpPass: config.smtpPass,
        smtpFrom: config.smtpFrom || config.smtpUser,
        smtpTo: testEmail,
      }),
    })
    const data = await res.json()
    setTesting(false)
    if (res.ok) {
      toast({ title: "✅ Berhasil!", description: data.message })
    } else {
      toast({ title: "❌ Gagal", description: data.error, variant: "destructive" })
    }
  }

  if (loading) return <div className="space-y-4">{[1,2].map(i => <div key={i} className="skeleton h-48 rounded-2xl" />)}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pengaturan Email (SMTP)</h1>
          <p className="text-muted-foreground mt-1">Konfigurasi server email untuk notifikasi tenant Anda.</p>
        </div>
        <Button className="gap-2 btn-gradient text-white border-0 rounded-xl" onClick={handleSave} disabled={saving}>
          {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-4 w-4" />}
          Simpan
        </Button>
      </div>

      {/* Info */}
      <Card className="glass border-0">
        <CardContent className="flex items-start gap-3 p-4">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">Konfigurasi SMTP per-Tenant</p>
            <p className="text-muted-foreground mt-0.5">
              Jika tidak dikonfigurasi, sistem akan menggunakan SMTP default platform (Mailketing).
              Aktifkan konfigurasi kustom untuk menggunakan server email Anda sendiri.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Toggle custom */}
      <Card className="glass border-0">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">Gunakan SMTP Kustom</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {useCustom ? "Menggunakan konfigurasi SMTP Anda sendiri" : "Menggunakan SMTP default platform (Mailketing)"}
              </p>
            </div>
            <button
              onClick={() => setUseCustom(!useCustom)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${useCustom ? "bg-primary" : "bg-muted"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${useCustom ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
        </CardContent>
      </Card>

      {useCustom && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Konfigurasi Server */}
          <Card className="glass border-0">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Konfigurasi Server</CardTitle>
                  <CardDescription>Host, port, dan kredensial SMTP</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-2">
                  <Label>SMTP Host</Label>
                  <Input value={config.smtpHost} onChange={set("smtpHost")}
                    placeholder="smtp.mailketing.co.id" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Port</Label>
                  <Input value={config.smtpPort} onChange={set("smtpPort")}
                    placeholder="587" className="rounded-xl" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Username / Email</Label>
                <Input value={config.smtpUser} onChange={set("smtpUser")}
                  placeholder="user@domain.com" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <div className="relative">
                  <Input
                    type={showPass ? "text" : "password"}
                    value={config.smtpPass}
                    onChange={set("smtpPass")}
                    placeholder="••••••••"
                    className="rounded-xl pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pengirim & Test */}
          <div className="space-y-6">
            <Card className="glass border-0">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Identitas Pengirim</CardTitle>
                    <CardDescription>Nama dan alamat email pengirim</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nama Pengirim</Label>
                  <Input value={config.smtpFromName} onChange={set("smtpFromName")}
                    placeholder="Nama Organisasi Anda" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Email Pengirim (From)</Label>
                  <Input value={config.smtpFrom} onChange={set("smtpFrom")}
                    placeholder="noreply@domain.com" className="rounded-xl" />
                  <p className="text-xs text-muted-foreground">Kosongkan untuk menggunakan username</p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-0">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
                    <Send className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Test Koneksi</CardTitle>
                    <CardDescription>Kirim email test untuk verifikasi</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label>Kirim ke Email</Label>
                  <Input value={testEmail} onChange={(e) => setTestEmail(e.target.value)}
                    type="email" placeholder="email@contoh.com" className="rounded-xl" />
                </div>
                <Button
                  variant="outline"
                  className="w-full rounded-xl gap-2 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/5"
                  onClick={handleTest}
                  disabled={testing || !config.smtpHost || !config.smtpUser}
                >
                  {testing ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {testing ? "Mengirim..." : "Kirim Email Test"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Panduan Mailketing */}
      <Card className="border border-primary/20 bg-primary/5">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold mb-2">Panduan Mailketing SMTP</p>
              <div className="space-y-1 text-muted-foreground">
                <p>• <strong>Host:</strong> smtp.mailketing.co.id</p>
                <p>• <strong>Port:</strong> 587 (TLS) atau 465 (SSL)</p>
                <p>• <strong>Username:</strong> Email akun Mailketing Anda</p>
                <p>• <strong>Password:</strong> Password akun Mailketing Anda</p>
                <p className="mt-2">Daftar di <a href="https://mailketing.co.id" target="_blank" rel="noopener" className="text-primary hover:underline">mailketing.co.id</a> untuk mendapatkan akun SMTP.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
