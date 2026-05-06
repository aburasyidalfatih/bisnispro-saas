"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { toast } from "@/hooks/use-toast"
import { Save, Briefcase, Plus, Trash2, GripVertical, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

interface Service {
  title: string
  description: string
  icon: string
}

const EMOJI_OPTIONS = [
  "🌐","📱","💡","☁️","🔒","📊","🎯","⚡","🚀","🛠️",
  "📚","🤝","🏆","💎","🔬","🎨","📋","🌟","💼","🔧",
  "🏥","🎓","🏗️","🌿","🎵","📸","✈️","🍽️","🏋️","💻",
]

export default function WebsiteServicesPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [slug, setSlug] = useState<string | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)
  const [emojiPickerOpen, setEmojiPickerOpen] = useState<number | null>(null)

  useEffect(() => {
    const id = session?.user?.tenants?.[0]?.id
    const s = session?.user?.tenants?.[0]?.slug
    if (id) { setTenantId(id); setSlug(s || null); return }
    const match = document.cookie.match(/impersonate-tenant=([^;]+)/)
    const impSlug = match?.[1]
    if (impSlug) {
      setSlug(impSlug)
      fetch(`/api/tenant/by-slug?slug=${impSlug}`).then(r => r.json()).then(d => { if (d.id) setTenantId(d.id) })
    }
  }, [session?.user?.tenants])

  useEffect(() => {
    if (!tenantId) return
    fetch(`/api/tenant/website?tenantId=${tenantId}`)
      .then(r => r.json())
      .then(d => {
        setServices(Array.isArray(d.services) ? d.services : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [tenantId])

  const addService = () => {
    setServices(prev => [...prev, { title: "", description: "", icon: "⚡" }])
  }

  const update = (i: number, field: keyof Service, value: string) => {
    setServices(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s))
  }

  const remove = (i: number) => {
    setServices(prev => prev.filter((_, idx) => idx !== i))
  }

  // Drag-and-drop
  const handleDragStart = (i: number) => setDragIndex(i)
  const handleDragOver = (e: React.DragEvent, i: number) => { e.preventDefault(); setDragOver(i) }
  const handleDrop = (e: React.DragEvent, i: number) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === i) { setDragIndex(null); setDragOver(null); return }
    const arr = [...services]
    const [moved] = arr.splice(dragIndex, 1)
    arr.splice(i, 0, moved)
    setServices(arr)
    setDragIndex(null)
    setDragOver(null)
  }

  const handleSave = async () => {
    if (!tenantId) return
    const invalid = services.some(s => !s.title.trim())
    if (invalid) {
      toast({ title: "Validasi gagal", description: "Semua layanan harus memiliki judul.", variant: "destructive" })
      return
    }
    setSaving(true)
    const res = await fetch("/api/tenant/website", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, services }),
    })
    setSaving(false)
    if (res.ok) {
      toast({ title: "Disimpan", description: `${services.length} layanan berhasil diperbarui.` })
    } else {
      toast({ title: "Gagal", description: "Terjadi kesalahan.", variant: "destructive" })
    }
  }

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}</div>

  return (
    <div className="space-y-6" onClick={() => setEmojiPickerOpen(null)}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kelola Layanan</h1>
          <p className="text-muted-foreground mt-1">Tambah, edit, dan atur urutan layanan. Drag untuk mengubah posisi.</p>
        </div>
        <div className="flex items-center gap-2">
          {slug && (
            <a href={`/site/${slug}/services`} target="_blank" rel="noopener"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
              <ExternalLink className="h-3.5 w-3.5" /> Lihat Halaman
            </a>
          )}
          <Button variant="outline" className="gap-2 rounded-xl" onClick={addService}>
            <Plus className="h-4 w-4" /> Tambah
          </Button>
          <Button className="gap-2 btn-gradient text-white border-0 rounded-xl" onClick={handleSave} disabled={saving}>
            {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-4 w-4" />}
            Simpan
          </Button>
        </div>
      </div>

      {services.length === 0 ? (
        <Card className="glass border-0">
          <div className="p-12 text-center">
            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="font-semibold mb-1">Belum ada layanan</p>
            <p className="text-sm text-muted-foreground mb-4">Tambahkan layanan yang ingin ditampilkan di website Anda.</p>
            <Button className="gap-2 btn-gradient text-white border-0 rounded-xl" onClick={addService}>
              <Plus className="h-4 w-4" /> Tambah Layanan Pertama
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {services.map((svc, i) => (
            <div key={i}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={e => handleDragOver(e, i)}
              onDrop={e => handleDrop(e, i)}
              onDragEnd={() => { setDragIndex(null); setDragOver(null) }}
              className={cn(
                "glass rounded-2xl border-0 transition-all",
                dragOver === i && "ring-2 ring-primary scale-[1.01]",
                dragIndex === i && "opacity-50"
              )}>
              <div className="p-4 flex items-start gap-3">
                {/* Drag handle */}
                <div className="flex items-center gap-2 shrink-0 mt-1">
                  <GripVertical className="h-5 w-5 text-muted-foreground/40 cursor-grab active:cursor-grabbing" />

                  {/* Emoji picker */}
                  <div className="relative" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => setEmojiPickerOpen(emojiPickerOpen === i ? null : i)}
                      className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-2xl hover:bg-primary/20 transition-colors">
                      {svc.icon || "⚡"}
                    </button>
                    {emojiPickerOpen === i && (
                      <div className="absolute top-full left-0 mt-1 z-20 grid grid-cols-6 gap-1 p-2 bg-background border rounded-xl shadow-xl w-52">
                        {EMOJI_OPTIONS.map(emoji => (
                          <button key={emoji}
                            onClick={() => { update(i, "icon", emoji); setEmojiPickerOpen(null) }}
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted text-lg transition-colors",
                              svc.icon === emoji && "bg-primary/10"
                            )}>
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Fields */}
                <div className="flex-1 grid gap-2 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Judul Layanan *</Label>
                    <Input value={svc.title} onChange={e => update(i, "title", e.target.value)}
                      placeholder="Nama layanan" className="rounded-xl h-9 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Ikon (klik kotak di kiri untuk pilih)</Label>
                    <Input value={svc.icon} onChange={e => update(i, "icon", e.target.value)}
                      placeholder="⚡" className="rounded-xl h-9 text-sm" maxLength={4} />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs">Deskripsi</Label>
                    <textarea value={svc.description} onChange={e => update(i, "description", e.target.value)}
                      placeholder="Deskripsi singkat layanan ini..." rows={2}
                      className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none" />
                  </div>
                </div>

                {/* Delete */}
                <ConfirmDialog
                  trigger={
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive hover:text-destructive shrink-0 mt-1">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  }
                  title="Hapus layanan ini?"
                  description={`"${svc.title || "Layanan ini"}" akan dihapus dari website.`}
                  confirmText="Ya, hapus"
                  onConfirm={() => remove(i)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {services.length > 0 && (
        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground">{services.length} layanan · Drag untuk mengubah urutan</p>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 rounded-xl" onClick={addService}>
              <Plus className="h-4 w-4" /> Tambah
            </Button>
            <Button className="gap-2 btn-gradient text-white border-0 rounded-xl" onClick={handleSave} disabled={saving}>
              {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-4 w-4" />}
              Simpan Semua
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
