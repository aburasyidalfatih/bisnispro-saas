"use client"

import { useEffect, useState } from "react"
import { toast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Megaphone, Save, RefreshCw } from "lucide-react"

export default function RetentionPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [form, setForm] = useState({
    RETENTION_30_EMAIL_SUBJECT: "",
    RETENTION_30_EMAIL_BODY: "",
    RETENTION_30_WA: "",
    RETENTION_60_EMAIL_SUBJECT: "",
    RETENTION_60_EMAIL_BODY: "",
    RETENTION_60_WA: "",
    RETENTION_90_EMAIL_SUBJECT: "",
    RETENTION_90_EMAIL_BODY: "",
    RETENTION_90_WA: "",
  })

  useEffect(() => {
    fetch("/api/super-admin/settings")
      .then((r) => r.json())
      .then((data) => {
        const sanitizedData = { ...data }
        Object.keys(sanitizedData).forEach(key => {
          if (sanitizedData[key] === "undefined" || sanitizedData[key] === null) {
            sanitizedData[key] = ""
          }
        })
        setForm((prev) => ({ ...prev, ...sanitizedData }))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const res = await fetch("/api/super-admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      toast({ title: "Berhasil", description: "Pengaturan retensi tenant telah diperbarui." })
    } else {
      toast({ title: "Gagal menyimpan", variant: "destructive" })
    }
    setSaving(false)
  }

  if (loading) {
    return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}</div>
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Retensi Tenant</h1>
          <p className="text-muted-foreground mt-1">Kelola template pesan otomatis untuk mengaktifkan kembali tenant yang pasif.</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Simpan Perubahan
        </Button>
      </div>

      <div className="grid gap-6">
        <Card className="glass border-0 shadow-sm overflow-hidden">
          <CardHeader className="border-b bg-white/50">
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              Pesan Retensi - 30 Hari (Peringatan)
            </CardTitle>
            <CardDescription>Pesan peringatan ketika tenant tidak login selama 30 hari.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid gap-2">
              <Label>Subjek Email</Label>
              <Input value={form.RETENTION_30_EMAIL_SUBJECT || ""} onChange={e => setForm({...form, RETENTION_30_EMAIL_SUBJECT: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label>Isi Email (HTML)</Label>
              <Textarea rows={4} value={form.RETENTION_30_EMAIL_BODY || ""} onChange={e => setForm({...form, RETENTION_30_EMAIL_BODY: e.target.value})} className="font-mono text-sm" />
              <p className="text-xs text-muted-foreground">Gunakan <code>{"{nama_sekolah}"}</code> untuk variabel dinamis.</p>
            </div>
            <div className="grid gap-2">
              <Label>Pesan WhatsApp</Label>
              <Textarea rows={3} value={form.RETENTION_30_WA || ""} onChange={e => setForm({...form, RETENTION_30_WA: e.target.value})} />
              <p className="text-xs text-muted-foreground">Gunakan <code>{"{nama_sekolah}"}</code> untuk variabel dinamis.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-0 shadow-sm overflow-hidden">
          <CardHeader className="border-b bg-white/50">
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-amber-500" />
              Pesan Retensi - 60 Hari (Suspend)
            </CardTitle>
            <CardDescription>Pesan suspend otomatis ketika tenant tidak login selama 60 hari.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid gap-2">
              <Label>Subjek Email</Label>
              <Input value={form.RETENTION_60_EMAIL_SUBJECT || ""} onChange={e => setForm({...form, RETENTION_60_EMAIL_SUBJECT: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label>Isi Email (HTML)</Label>
              <Textarea rows={4} value={form.RETENTION_60_EMAIL_BODY || ""} onChange={e => setForm({...form, RETENTION_60_EMAIL_BODY: e.target.value})} className="font-mono text-sm" />
              <p className="text-xs text-muted-foreground">Gunakan <code>{"{nama_sekolah}"}</code> untuk variabel dinamis.</p>
            </div>
            <div className="grid gap-2">
              <Label>Pesan WhatsApp</Label>
              <Textarea rows={3} value={form.RETENTION_60_WA || ""} onChange={e => setForm({...form, RETENTION_60_WA: e.target.value})} />
              <p className="text-xs text-muted-foreground">Gunakan <code>{"{nama_sekolah}"}</code> untuk variabel dinamis.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-0 shadow-sm overflow-hidden">
          <CardHeader className="border-b bg-white/50">
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-red-500" />
              Pesan Retensi - 90 Hari (Penghapusan)
            </CardTitle>
            <CardDescription>Pesan pemberitahuan penghapusan data tenant karena tidak login selama 90 hari.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid gap-2">
              <Label>Subjek Email</Label>
              <Input value={form.RETENTION_90_EMAIL_SUBJECT || ""} onChange={e => setForm({...form, RETENTION_90_EMAIL_SUBJECT: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label>Isi Email (HTML)</Label>
              <Textarea rows={4} value={form.RETENTION_90_EMAIL_BODY || ""} onChange={e => setForm({...form, RETENTION_90_EMAIL_BODY: e.target.value})} className="font-mono text-sm" />
              <p className="text-xs text-muted-foreground">Gunakan <code>{"{nama_sekolah}"}</code> untuk variabel dinamis.</p>
            </div>
            <div className="grid gap-2">
              <Label>Pesan WhatsApp</Label>
              <Textarea rows={3} value={form.RETENTION_90_WA || ""} onChange={e => setForm({...form, RETENTION_90_WA: e.target.value})} />
              <p className="text-xs text-muted-foreground">Gunakan <code>{"{nama_sekolah}"}</code> untuk variabel dinamis.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
