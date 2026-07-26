"use client"

import { useEffect, useState } from"react"
import { useSession } from"next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { Input } from"@/components/ui/input"
import { Label } from"@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from"@/hooks/use-toast"
import { EmptyState } from "@/components/ui/empty-state"
import { CreditCard, Save, Eye, EyeOff, Info, CheckCircle, ExternalLink, RefreshCw, Landmark, Plus, Trash2 } from"lucide-react"

interface TripayConfig {
  tripayApiKey: string
  tripayPrivateKey: string
  tripayMerchantCode: string
  tripayApiUrl: string
}

export default function PaymentSettingsPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [useCustom, setUseCustom] = useState(false)
  const [useSandbox, setUseSandbox] = useState(true)
  const [channels, setChannels] = useState<any[]>([])
  const [config, setConfig] = useState<TripayConfig>({
    tripayApiKey:"",
    tripayPrivateKey:"",
    tripayMerchantCode:"",
    tripayApiUrl:"https://tripay.co.id/api-sandbox",
  })
  
  // Manual Bank Accounts State
  const [manualBanks, setManualBanks] = useState<{bank: string, account: string, name: string}[]>([])

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
        if (data.tripay) {
          setConfig(data.tripay)
          setUseCustom(true)
          setUseSandbox(data.tripay.tripayApiUrl?.includes("sandbox") ?? true)
        }
        if (data.manualBanks) {
          setManualBanks(data.manualBanks)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [tenantId])

  const set = (field: keyof TripayConfig) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setConfig((prev) => ({
      ...prev,
      [field]: val,
      // Auto-update URL saat mode berubah
    }))
  }

  const toggleSandbox = (sandbox: boolean) => {
    setUseSandbox(sandbox)
    setConfig((prev) => ({
      ...prev,
      tripayApiUrl: sandbox
        ?"https://tripay.co.id/api-sandbox"
        :"https://tripay.co.id/api",
    }))
  }

  const handleSave = async () => {
    if (!tenantId) return
    setSaving(true)
    const res = await fetch("/api/tenant/settings", {
      method:"PUT",
      headers: {"Content-Type":"application/json" },
      body: JSON.stringify({
        tenantId,
        settings: { 
          tripay: useCustom ? config : null,
          manualBanks: manualBanks
        },
      }),
    })
    setSaving(false)
    if (res.ok) {
      toast({ title:"Disimpan", description:"Konfigurasi Tripay berhasil disimpan." })
    } else {
      toast({ title:"Gagal", description:"Terjadi kesalahan.", variant:"destructive" })
    }
  }

  const handleTestChannels = async () => {
    if (!config.tripayApiKey) {
      toast({ title:"API Key kosong", description:"Isi API Key terlebih dahulu.", variant:"destructive" })
      return
    }
    setTesting(true)
    try {
      const res = await fetch(`${config.tripayApiUrl}/merchant/payment-channel`, {
        headers: { Authorization: `Bearer ${config.tripayApiKey}` },
      })
      const data = await res.json()
      if (data.success && data.data?.length) {
        setChannels(data.data)
        toast({ title:"✅ Koneksi berhasil!", description: `${data.data.length} channel pembayaran tersedia.` })
      } else {
        toast({ title:"❌ Gagal", description: data.message ||"API Key tidak valid.", variant:"destructive" })
      }
    } catch (err: any) {
      toast({ title:"❌ Error", description: err.message, variant:"destructive" })
    }
    setTesting(false)
  }

  const addManualBank = () => {
    setManualBanks([...manualBanks, { bank:"", account:"", name:"" }])
  }

  const updateManualBank = (index: number, field: string, value: string) => {
    const newBanks = [...manualBanks]
    newBanks[index] = { ...newBanks[index], [field]: value }
    setManualBanks(newBanks)
  }

  const removeManualBank = (index: number) => {
    setManualBanks(manualBanks.filter((_, i) => i !== index))
  }

  if (loading) return <div className="space-y-4">{[1, 2].map(i => <div key={i} className="skeleton h-48 rounded-2xl" />)}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payment Gateway (Tripay)</h1>
          <p className="text-muted-foreground mt-1">Konfigurasi Tripay untuk menerima pembayaran di tenant Anda.</p>
        </div>
        <Button className="justify-center items-center flex gap-2 btn-gradient text-white border-0 rounded-xl h-10 px-4" onClick={handleSave} disabled={saving}>
          {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-4 w-4" />}
          Simpan
        </Button>
      </div>

      {/* Info */}
      <Card className="glass border-0">
        <CardContent className="flex items-start gap-3 p-4">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">Payment Gateway per-Tenant</p>
            <p className="text-muted-foreground mt-0.5">
              Jika tidak dikonfigurasi, sistem akan menggunakan akun Tripay default platform.
              Aktifkan konfigurasi kustom untuk menggunakan akun Tripay Anda sendiri dan menerima pembayaran langsung.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Toggle custom */}
      <Card className="glass border-0">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">Gunakan Akun Tripay Sendiri</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {useCustom ?"Menggunakan akun Tripay Anda sendiri" :"Menggunakan akun Tripay default platform"}
              </p>
            </div>
            <Switch
              checked={useCustom}
              onCheckedChange={setUseCustom}
            />
          </div>
        </CardContent>
      </Card>

      {/* Manual Bank Accounts Section */}
      <Card className="glass border-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <Landmark className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Transfer Manual (Rekening Perusahaan)</CardTitle>
                <CardDescription>Tambahkan nomor rekening perusahaan untuk pembayaran manual oleh orang tua.</CardDescription>
              </div>
            </div>
            <Button onClick={addManualBank} variant="outline" size="sm" className="gap-2 rounded-xl">
              <Plus className="h-4 w-4" /> Tambah Rekening
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {manualBanks.length === 0 ? (
            <div className="py-6">
              <EmptyState icon={Landmark} title="Belum Ada Data" description="Belum ada rekening manual." />
            </div>
          ) : (
            <div className="space-y-4">
              {manualBanks.map((bank, index) => (
                <div key={index} className="grid sm:grid-cols-12 gap-3 items-start bg-muted/30 p-3 rounded-xl border">
                  <div className="sm:col-span-3 space-y-1.5">
                    <Label className="text-xs">Nama Bank/Dompet</Label>
                    <Input 
                      placeholder="BCA / Mandiri / Dana" 
                      value={bank.bank} 
                      onChange={(e) => updateManualBank(index,"bank", e.target.value)}
                      className="rounded-lg h-9 text-sm bg-background"
                    />
                  </div>
                  <div className="sm:col-span-4 space-y-1.5">
                    <Label className="text-xs">No. Rekening</Label>
                    <Input 
                      placeholder="1234567890" 
                      value={bank.account} 
                      onChange={(e) => updateManualBank(index,"account", e.target.value)}
                      className="rounded-lg h-9 text-sm bg-background"
                    />
                  </div>
                  <div className="sm:col-span-4 space-y-1.5">
                    <Label className="text-xs">Atas Nama (A/N)</Label>
                    <Input 
                      placeholder="Yayasan Perusahaan / Budi" 
                      value={bank.name} 
                      onChange={(e) => updateManualBank(index,"name", e.target.value)}
                      className="rounded-lg h-9 text-sm bg-background"
                    />
                  </div>
                  <div className="sm:col-span-1 pt-6 text-right sm:text-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeManualBank(index)}
                      className="h-9 w-9 p-0 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {useCustom && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Konfigurasi API */}
          <Card className="glass border-0">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                  <CreditCard className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Kredensial API</CardTitle>
                  <CardDescription>API Key, Private Key, dan Merchant Code</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mode: Sandbox / Production */}
              <div className="space-y-2">
                <Label>Mode</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => toggleSandbox(true)}
                    className={`flex items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-sm font-semibold transition-all ${useSandbox ?"border-amber-500 bg-amber-500/10 text-amber-600" :"border-transparent bg-muted/50 text-muted-foreground hover:bg-muted"}`}
                  >
                    🧪 Sandbox
                  </Button>
                  <Button
                    onClick={() => toggleSandbox(false)}
                    className={`flex items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-sm font-semibold transition-all ${!useSandbox ?"border-emerald-500 bg-emerald-500/10 text-emerald-600" :"border-transparent bg-muted/50 text-muted-foreground hover:bg-muted"}`}
                  >
                    🚀 Production
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {useSandbox ?"Sandbox: untuk testing, tidak ada transaksi nyata." :"Production: transaksi nyata, gunakan kredensial production."}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Merchant Code</Label>
                <Input value={config.tripayMerchantCode} onChange={set("tripayMerchantCode")}
                  placeholder="T12345" className="rounded-xl" />
                <p className="text-xs text-muted-foreground">Kode merchant dari dashboard Tripay</p>
              </div>

              <div className="space-y-2">
                <Label>API Key</Label>
                <div className="relative">
                  <Input
                    type={showApiKey ?"text" :"password"}
                    value={config.tripayApiKey}
                    onChange={set("tripayApiKey")}
                    placeholder="API Key dari dashboard Tripay"
                    className="rounded-xl pr-10"
                  />
                  <Button variant="ghost" size="icon" type="button" onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-1 h-8 w-8 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Private Key</Label>
                <div className="relative">
                  <Input
                    type={showPrivateKey ?"text" :"password"}
                    value={config.tripayPrivateKey}
                    onChange={set("tripayPrivateKey")}
                    placeholder="Private Key dari dashboard Tripay"
                    className="rounded-xl pr-10"
                  />
                  <Button variant="ghost" size="icon" type="button" onClick={() => setShowPrivateKey(!showPrivateKey)}
                    className="absolute right-1 h-8 w-8 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPrivateKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Digunakan untuk membuat signature transaksi</p>
              </div>

              <div className="space-y-2">
                <Label>API URL</Label>
                <Input value={config.tripayApiUrl} onChange={set("tripayApiUrl")}
                  placeholder="https://tripay.co.id/api-sandbox" className="rounded-xl" disabled />
                <p className="text-xs text-muted-foreground">Otomatis berubah sesuai mode yang dipilih</p>
              </div>
            </CardContent>
          </Card>

          {/* Test + Channel */}
          <div className="space-y-6">
            {/* Test koneksi */}
            <Card className="glass border-0">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                    <RefreshCw className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Test Koneksi</CardTitle>
                    <CardDescription>Verifikasi API Key dan ambil channel pembayaran</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full rounded-xl gap-2"
                  onClick={handleTestChannels}
                  disabled={testing || !config.tripayApiKey}
                >
                  {testing ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {testing ?"Mengambil data..." :"Cek Channel Pembayaran"}
                </Button>

                {channels.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {channels.length} Channel Tersedia
                    </p>
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                      {channels.map((ch: any) => (
                        <div key={ch.code} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                          <div className="flex items-center gap-2">
                            {ch.icon_url && (
                              <img src={ch.icon_url} alt={ch.name} className="h-5 w-5 object-contain rounded" loading="lazy" decoding="async" />
                            )}
                            <span className="text-xs font-medium">{ch.name}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono">{ch.code}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status */}
            <Card className="glass border-0">
              <CardContent className="p-5 space-y-3">
                <p className="text-sm font-semibold">Status Konfigurasi</p>
                {[
                  { label:"Merchant Code", ok: !!config.tripayMerchantCode },
                  { label:"API Key", ok: !!config.tripayApiKey },
                  { label:"Private Key", ok: !!config.tripayPrivateKey },
                  { label:"Mode", ok: true, value: useSandbox ?"🧪 Sandbox" :"🚀 Production" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    {item.value ? (
                      <span className="font-medium text-xs">{item.value}</span>
                    ) : (
                      <span className={`text-xs font-semibold ${item.ok ?"text-emerald-600" :"text-destructive"}`}>
                        {item.ok ?"✓ Terisi" :"✗ Kosong"}
                      </span>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Panduan Tripay */}
      <Card className="border border-primary/20 bg-primary/5">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold mb-2">Panduan Tripay</p>
              <div className="space-y-1 text-muted-foreground">
                <p>1. Daftar di <a href="https://tripay.co.id" target="_blank" rel="noopener" className="text-primary hover:underline">tripay.co.id</a> dan verifikasi akun</p>
                <p>2. Masuk ke menu <strong>Merchant → Integrasi</strong></p>
                <p>3. Salin <strong>Kode Merchant</strong>, <strong>API Key</strong>, dan <strong>Private Key</strong></p>
                <p>4. Gunakan mode <strong>Sandbox</strong> untuk testing, <strong>Production</strong> untuk live</p>
                <p>5. Klik"Cek Channel Pembayaran" untuk verifikasi koneksi</p>
                <p className="mt-2 flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  <a href="https://tripay.co.id/developer" target="_blank" rel="noopener" className="text-primary hover:underline">
                    Dokumentasi API Tripay
                  </a>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
