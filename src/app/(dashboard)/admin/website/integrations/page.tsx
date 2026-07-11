"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Save, Code, Info } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function IntegrationsPage() {
  const { data: session } = useSession()
  const tenantId = (session?.user as any)?.tenants?.[0]?.id

  const [settings, setSettings] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!tenantId) return
    const fetchWebsiteData = async () => {
      try {
        const res = await fetch(`/api/tenant/website?tenantId=${tenantId}`)
        if (res.ok) {
          const data = await res.json()
          setSettings(data.settings || {})
        }
      } finally {
        setLoading(false)
      }
    }
    fetchWebsiteData()
  }, [tenantId])

  const handleSave = async () => {
    if (!tenantId) return
    setSaving(true)
    try {
      const payload = {
        tenantId,
        settings
      }

      const res = await fetch("/api/tenant/website", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error("Gagal menyimpan integrasi")
      toast({ title: "Berhasil", description: "Pengaturan integrasi script berhasil disimpan" })
    } catch (e: any) {
      toast({ title: "Gagal", description: e.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Integrasi & Script</h1>
          <p className="text-muted-foreground mt-1">Tambahkan script pelacakan (Google Analytics, Meta Pixel) atau Live Chat.</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="rounded-xl gap-2 min-w-[120px]">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Simpan Script
        </Button>
      </div>

      <div className="grid gap-6">
        <Card className="glass border-0">
          <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 shrink-0">
                <Code className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Header Script (Head)</CardTitle>
                <CardDescription>Script yang disisipkan di dalam tag &lt;head&gt; website publik.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="bg-blue-500/5 border border-blue-500/20 text-blue-700 dark:text-blue-400 p-4 rounded-xl text-sm mb-4 flex gap-3">
              <Info className="h-5 w-5 shrink-0" />
              <p>Cocok untuk Google Analytics, Meta Pixel, Google Tag Manager, atau Meta Tags tambahan.</p>
            </div>
            <Textarea 
              value={settings.headScript || ""} 
              onChange={e => setSettings({ ...settings, headScript: e.target.value })}
              placeholder="<!-- Masukkan script di sini -->&#10;<script>&#10;  // Google Analytics Code&#10;</script>"
              className="font-mono text-xs p-4 h-[250px] bg-slate-950 text-slate-200 border-slate-800 rounded-xl"
              spellCheck={false}
            />
          </CardContent>
        </Card>

        <Card className="glass border-0">
          <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 shrink-0">
                <Code className="h-4 w-4 text-orange-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Footer Script (Body)</CardTitle>
                <CardDescription>Script yang disisipkan tepat sebelum penutup tag &lt;/body&gt;.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="bg-orange-500/5 border border-orange-500/20 text-orange-700 dark:text-orange-400 p-4 rounded-xl text-sm mb-4 flex gap-3">
              <Info className="h-5 w-5 shrink-0" />
              <p>Cocok untuk Live Chat widget (seperti Tawk.to, WhatsApp floating button) atau script eksternal yang tidak ingin memblokir render halaman.</p>
            </div>
            <Textarea 
              value={settings.bodyScript || ""} 
              onChange={e => setSettings({ ...settings, bodyScript: e.target.value })}
              placeholder="<!-- Masukkan script di sini -->&#10;<script>&#10;  // Tawk.to Live Chat Code&#10;</script>"
              className="font-mono text-xs p-4 h-[250px] bg-slate-950 text-slate-200 border-slate-800 rounded-xl"
              spellCheck={false}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
