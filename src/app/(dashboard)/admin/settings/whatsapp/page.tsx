"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { MessageCircle, Save, Send, Eye, EyeOff, Info, CheckCircle } from "lucide-react"

interface WaConfig {
  waApiUrl: string
  waApiKey: string
  waSenderName: string
}

export default function WhatsAppSettingsPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [testPhone, setTestPhone] = useState("")
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [useCustom, setUseCustom] = useState(false)
  const [config, setConfig] = useState<WaConfig>({
    waApiUrl: "https://api.starsender.online/api",
    waApiKey: "",
    waSenderName: "",
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
        if (data.whatsapp) {
          setConfig(data.whatsapp)
          setUseCustom(true)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [tenantId])

  const set = (field: keyof WaConfig) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setConfig({ ...config, [field]: e.target.value })

  const handleSave = async () => {
    if (!tenantId) return
    setSaving(true)
    const res = await fetch("/api/tenant/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId,
        settings: useCustom ? { whatsapp: config } : { whatsapp: null },
      }),
    })
    setSaving(false)
    if (res.ok) {
      toast({ title: "Disimpan", description: "Konfigurasi WhatsApp berhasil disimpan." })
    } else {
      toast({ title: "Gagal", description: "Terjadi kesalahan.", variant: "destructive" })
    }
  }

  const handleTest = async () => {
    if (!testPhone) {
      toast({ title: "Isi nomor tujuan", description: "Masukkan nomor WhatsApp untuk test.", variant: "destructive" })
      return
    }
    setTesting(true)
    const res = await fetch("/api/tenant/settings/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "whatsapp",
        waApiUrl: config.waApiUrl,
        waApiKey: config.waApiKey,
        waPhone: testPhone,
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
          <h1 className="text-2xl font-bold tracking-tight">WhatsApp Gateway</h1>
          <p className="text-muted-foreground mt-1">Konfigurasi StarSender untuk notifikasi WhatsApp tenant Anda.</p>
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
            <p className="font-medium">WhatsApp Gateway per-Tenant</p>
            <p className="text-muted-foreground mt-0.5">
              Jika tidak dikonfigurasi, sistem akan menggunakan StarSender default platform.
              Aktifkan konfigurasi kustom untuk menggunakan akun StarSender Anda sendiri.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Toggle custom */}
      <Card className="glass border-0">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">Gunakan StarSender Kustom</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {useCustom ? "Menggunakan akun StarSender Anda sendiri" : "Menggunakan StarSender default platform"}
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
          {/* Konfigurasi API */}
          <Card className="glass border-0">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
                  <MessageCircle className="h-4 w-4 text-emerald-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Konfigurasi API</CardTitle>
                  <CardDescription>URL endpoint dan API Key StarSender</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>API URL</Label>
                <Input value={config.waApiUrl} onChange={set("waApiUrl")}
                  placeholder="https://api.starsender.online/api" className="rounded-xl" />
                <p className="text-xs text-muted-foreground">URL endpoint StarSender (biasanya tidak perlu diubah)</p>
              </div>
              <div className="space-y-2">
                <Label>API Key</Label>
                <div className="relative">
                  <Input
                    type={showKey ? "text" : "password"}
                    value={config.waApiKey}
                    onChange={set("waApiKey")}
                    placeholder="API Key dari dashboard StarSender"
                    className="rounded-xl pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Dapatkan API Key dari dashboard StarSender Anda</p>
              </div>
              <div className="space-y-2">
                <Label>Nama Pengirim (opsional)</Label>
                <Input value={config.waSenderName} onChange={set("waSenderName")}
                  placeholder="Nama Organisasi" className="rounded-xl" />
              </div>
            </CardContent>
          </Card>

          {/* Test Koneksi */}
          <div className="space-y-6">
            <Card className="glass border-0">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
                    <Send className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Test Koneksi</CardTitle>
                    <CardDescription>Kirim pesan test ke nomor WhatsApp</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label>Nomor WhatsApp Tujuan</Label>
                  <Input
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="6281234567890"
                    className="rounded-xl"
                  />
                  <p className="text-xs text-muted-foreground">Format internasional tanpa + (contoh: 6281234567890)</p>
                </div>
                <Button
                  variant="outline"
                  className="w-full rounded-xl gap-2 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/5"
                  onClick={handleTest}
                  disabled={testing || !config.waApiKey}
                >
                  {testing ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {testing ? "Mengirim..." : "Kirim Pesan Test"}
                </Button>
              </CardContent>
            </Card>

            {/* Status device */}
            <Card className="glass border-0">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                    <MessageCircle className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Status Perangkat</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {config.waApiKey ? "API Key terkonfigurasi" : "Belum dikonfigurasi"}
                    </p>
                  </div>
                  <span className={`ml-auto text-[11px] font-semibold rounded-full px-2.5 py-1 ${config.waApiKey ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                    {config.waApiKey ? "Siap" : "Belum"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Panduan StarSender */}
      <Card className="border border-emerald-500/20 bg-emerald-500/5">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold mb-2">Panduan StarSender</p>
              <div className="space-y-1 text-muted-foreground">
                <p>1. Daftar di <a href="https://starsender.online" target="_blank" rel="noopener" className="text-emerald-600 hover:underline">starsender.online</a></p>
                <p>2. Hubungkan perangkat WhatsApp Anda di dashboard StarSender</p>
                <p>3. Salin API Key dari menu Settings → API</p>
                <p>4. Tempel API Key di kolom di atas dan klik Simpan</p>
                <p>5. Test koneksi dengan mengirim pesan ke nomor Anda</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
