"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/hooks/use-toast"
import { BrainCircuit, Key, Save, Loader2, Sparkles, Coins } from "lucide-react"

export default function AiSettingsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tenantId, setTenantId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    useCustomApiKey: false,
    customOpenAiKey: "",
    aiTokens: 0,
  })

  // Resolve tenantId
  useEffect(() => {
    const id = session?.user?.tenants?.[0]?.id
    if (id) { setTenantId(id); return }
    const match = document.cookie.match(/impersonate-tenant=([^;]+)/)
    const slug = match?.[1]
    if (slug) {
      fetch(`/api/tenant/by-slug?slug=${slug}`).then(r => r.json()).then(d => { if (d.id) setTenantId(d.id) })
    }
  }, [session?.user?.tenants])

  useEffect(() => {
    if (!tenantId) return
    fetch(`/api/tenant/ai-settings?tenantId=${tenantId}`)
      .then(res => res.json())
      .then(data => {
        setFormData({
          useCustomApiKey: data.useCustomApiKey || false,
          customOpenAiKey: data.customOpenAiKey || "",
          aiTokens: data.aiTokens || 0,
        })
        setLoading(false)
      })
      .catch(() => {
        toast({ title: "Error", description: "Gagal memuat pengaturan AI", variant: "destructive" })
        setLoading(false)
      })
  }, [tenantId])

  const handleSave = async () => {
    if (!tenantId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/tenant/ai-settings?tenantId=${tenantId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          useCustomApiKey: formData.useCustomApiKey,
          customOpenAiKey: formData.customOpenAiKey,
        }),
      })

      if (!res.ok) throw new Error("Gagal menyimpan pengaturan")
      
      toast({ title: "Tersimpan", description: "Pengaturan AI berhasil diperbarui" })
    } catch (error) {
      toast({ title: "Error", description: "Terjadi kesalahan saat menyimpan pengaturan", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex h-40 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan Kecerdasan Buatan (AI)</h1>
        <p className="text-muted-foreground mt-1">Kelola penggunaan AI dan API Key untuk fitur otomatisasi sekolah.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Coins className="h-5 w-5 text-primary" />
              Sisa Kuota Token AI
            </CardTitle>
            <CardDescription>Digunakan untuk membuat soal CBT dan asisten RPP.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">{formData.aiTokens.toLocaleString("id-ID")}</div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full bg-background" onClick={() => router.push("/admin/settings/payment")}>
              Beli Kuota Add-on
            </Button>
          </CardFooter>
        </Card>

        <Card className="glass">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BrainCircuit className="h-5 w-5 text-muted-foreground" />
              Fitur AI Aktif
            </CardTitle>
            <CardDescription>Modul SchoolPro yang menggunakan AI.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-xl bg-background/50">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium">Pembuat Soal CBT Otomatis</span>
              </div>
              <span className="text-xs bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-full font-semibold">Tersedia</span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-xl bg-background/50">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium">Pembuat RPP (Kurikulum Merdeka)</span>
              </div>
              <span className="text-xs bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-full font-semibold">Tersedia</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass border-orange-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-orange-500" />
            Bring Your Own Key (BYOK)
          </CardTitle>
          <CardDescription>
            Gunakan API Key OpenAI milik sekolah Anda sendiri untuk mendapatkan penggunaan *unlimited* tanpa memotong saldo Kuota Token SchoolPro.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-xl border p-4 bg-background">
            <div className="space-y-0.5">
              <Label className="text-base">Gunakan API Key Sendiri</Label>
              <p className="text-sm text-muted-foreground">Aktifkan untuk menggunakan mode Lanjutan.</p>
            </div>
            <Switch
              checked={formData.useCustomApiKey}
              onCheckedChange={(checked) => setFormData({ ...formData, useCustomApiKey: checked })}
            />
          </div>

          {formData.useCustomApiKey && (
            <div className="space-y-3 p-4 rounded-xl bg-orange-500/5 border border-orange-500/20 animate-in fade-in slide-in-from-top-2">
              <div className="space-y-1">
                <Label htmlFor="apiKey">OpenAI API Key (sk-...)</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx"
                  value={formData.customOpenAiKey}
                  onChange={(e) => setFormData({ ...formData, customOpenAiKey: e.target.value })}
                  className="bg-background"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Kunci ini akan dienkripsi dan disimpan dengan aman. Anda bertanggung jawab penuh atas tagihan API di akun OpenAI Anda.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="bg-muted/30 pt-6">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Menyimpan..." : "Simpan Pengaturan"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
