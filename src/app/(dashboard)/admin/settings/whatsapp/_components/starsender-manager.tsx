"use client"

import { useState, useEffect } from"react"
import { useSession } from"next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { Input } from"@/components/ui/input"
import { Label } from"@/components/ui/label"
import { toast } from"@/hooks/use-toast"
import { MessageSquare, Save, Eye, EyeOff, Smartphone } from"lucide-react"

export function StarSenderManager() {
  const { data: session } = useSession()
  const [tenantId, setTenantId] = useState<string | null>(null)
  
  const [form, setForm] = useState({ waApiKey:"", waDeviceId:"", waDelayMin: 5, waDelayMax: 15 })
  const [showToken, setShowToken] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testPhone, setTestPhone] = useState("")

  useEffect(() => {
    const id = session?.user?.tenants?.[0]?.id
    if (id) { setTenantId(id); return }
    const match = typeof document !== 'undefined' ? document.cookie.match(/impersonate-tenant=([^;]+)/) : null
    const slug = match?.[1]
    if (slug) {
      fetch(`/api/tenant/by-slug?slug=${slug}`).then(r => r.json()).then(d => { if (d.id) setTenantId(d.id) })
    }
  }, [session?.user?.tenants])

  useEffect(() => {
    if (!tenantId) return
    fetch(`/api/tenant/settings?tenantId=${tenantId}`)
      .then(r => r.json())
      .then(d => {
        if (d.whatsapp) {
          setForm({
            waApiKey: d.whatsapp.waApiKey ||"",
            waDeviceId: d.whatsapp.waDeviceId ||"",
            waDelayMin: d.whatsapp.waDelayMin || 5,
            waDelayMax: d.whatsapp.waDelayMax || 15,
          })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [tenantId])

  const handleSave = async () => {
    if (!tenantId) return
    setSaving(true)
    const res = await fetch("/api/tenant/settings", {
      method:"PUT",
      headers: {"Content-Type":"application/json" },
      body: JSON.stringify({
        tenantId,
        settings: {
          whatsapp: {
            waApiUrl:"https://api.starsender.online/api",
            waApiKey: form.waApiKey,
            waDeviceId: form.waDeviceId,
            waDelayMin: form.waDelayMin,
            waDelayMax: form.waDelayMax,
          }
        }
      })
    })
    
    if (res.ok) {
      toast({ title:"Berhasil", description:"Pengaturan StarSender disimpan." })
    } else {
      toast({ title:"Gagal", description:"Terjadi kesalahan sistem", variant:"destructive" })
    }
    setSaving(false)
  }

  const handleTestWA = async () => {
    if (!testPhone) { toast({ title:"Isi nomor tujuan", variant:"destructive" }); return }
    if (!form.waApiKey) { toast({ title:"Isi API Key terlebih dahulu", variant:"destructive" }); return }
    setTesting(true)
    try {
      const res = await fetch("/api/tenant/settings/test", {
        method:"POST",
        headers: {"Content-Type":"application/json" },
        body: JSON.stringify({
          type:"whatsapp",
          waApiUrl:"https://api.starsender.online/api",
          waApiKey: form.waApiKey,
          waDeviceId: form.waDeviceId || undefined,
          waPhone: testPhone,
        }),
      })
      const data = await res.json()
      if (res.ok) toast({ title:"✅ Berhasil!", description: data.message })
      else throw new Error(data.error)
    } catch (e: any) {
      toast({ title:"❌ Gagal", description: e.message, variant:"destructive" })
    } finally {
      setTesting(false)
    }
  }

  if (loading) return <div className="skeleton h-64 w-full rounded-2xl" />

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="glass border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
              <MessageSquare className="h-4 w-4 text-emerald-500" />
            </div>
            <CardTitle className="text-lg">StarSender API</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>API Token / Key</Label>
            <div className="relative">
              <Input 
                type={showToken ?"text" :"password"} 
                value={form.waApiKey} 
                onChange={e => setForm({...form, waApiKey: e.target.value})} 
                placeholder="Token StarSender" 
                className="rounded-xl pr-10" 
              />
              <Button variant="ghost" size="icon" 
                type="button" 
                onClick={() => setShowToken(!showToken)} 
                className="absolute right-1 h-8 w-8 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Device ID (Opsional)</Label>
            <Input 
              value={form.waDeviceId} 
              onChange={e => setForm({...form, waDeviceId: e.target.value})} 
              placeholder="ID Perangkat" 
              className="rounded-xl" 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Delay Minimum (Detik)</Label>
              <Input 
                type="number" 
                value={form.waDelayMin} 
                onChange={e => setForm({...form, waDelayMin: Number(e.target.value)})} 
                className="rounded-xl" 
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Delay Maksimum (Detik)</Label>
              <Input 
                type="number" 
                value={form.waDelayMax} 
                onChange={e => setForm({...form, waDelayMax: Number(e.target.value)})} 
                className="rounded-xl" 
                min="0"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed mt-1">
            Penundaan waktu (jeda) acak sebelum pesan terkirim. Membantu menghindari blokir WhatsApp karena terdeteksi mengirim pesan terlalu cepat.
          </p>
          <button 
            className="w-full gap-2 btn-gradient text-white border-0 rounded-xl mt-2" 
            onClick={handleSave} 
            disabled={saving}
          >
            {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-4 w-4" />}
            Simpan Konfigurasi
          </button>
        </CardContent>
      </Card>

      <Card className="glass border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Smartphone className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-lg">Uji Coba (StarSender)</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Nomor Tujuan</Label>
            <Input 
              value={testPhone} 
              onChange={e => setTestPhone(e.target.value)} 
              placeholder="0812345678xx" 
              className="rounded-xl" 
            />
          </div>
          <Button 
            variant="outline" 
            className="w-full rounded-xl gap-2 border-primary/30 text-primary hover:bg-primary/5" 
            onClick={handleTestWA} 
            disabled={testing || !form.waApiKey}
          >
            {testing ?"Mengirim..." :"Kirim Pesan Tes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
