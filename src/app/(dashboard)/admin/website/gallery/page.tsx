"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { toast } from "@/hooks/use-toast"
import { Save, ImageIcon, Plus, Trash2, ExternalLink, Upload, GripVertical, X, Link as LinkIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface GalleryItem {
  url: string
  caption: string
}

export default function WebsiteGalleryPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [slug, setSlug] = useState<string | null>(null)
  const [gallery, setGallery] = useState<GalleryItem[]>([])
  const [urlInput, setUrlInput] = useState("")
  const [addMode, setAddMode] = useState<"upload" | "url">("upload")
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Resolve tenantId
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
        // Support both old format (string[]) and new format ({url, caption}[])
        const raw = d.gallery
        if (Array.isArray(raw)) {
          setGallery(raw.map((item: any) =>
            typeof item === "string" ? { url: item, caption: "" } : item
          ))
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [tenantId])

  const handleUpload = async (files: FileList | null) => {
    if (!files || !tenantId) return
    setUploading(true)
    const uploaded: GalleryItem[] = []
    for (const file of Array.from(files)) {
      try {
        const fd = new FormData()
        fd.append("file", file)
        fd.append("tenantId", tenantId)
        fd.append("subDir", "gallery")
        const res = await fetch("/api/upload", { method: "POST", body: fd })
        const d = await res.json()
        if (res.ok && d.url) {
          uploaded.push({ url: d.url, caption: "" })
        } else {
          toast({ title: `Gagal upload ${file.name}`, description: d.error, variant: "destructive" })
        }
      } catch {
        toast({ title: `Gagal upload ${file.name}`, variant: "destructive" })
      }
    }
    if (uploaded.length > 0) {
      setGallery(prev => [...prev, ...uploaded])
      toast({ title: `${uploaded.length} foto berhasil diunggah`, description: "Klik Simpan untuk menyimpan perubahan." })
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const addByUrl = () => {
    if (!urlInput.trim()) return
    if (!urlInput.startsWith("http")) {
      toast({ title: "URL tidak valid", description: "Masukkan URL yang dimulai dengan https://", variant: "destructive" })
      return
    }
    setGallery(prev => [...prev, { url: urlInput.trim(), caption: "" }])
    setUrlInput("")
  }

  const updateCaption = (i: number, caption: string) => {
    setGallery(prev => prev.map((item, idx) => idx === i ? { ...item, caption } : item))
  }

  const removeItem = (i: number) => {
    setGallery(prev => prev.filter((_, idx) => idx !== i))
  }

  // Drag-and-drop reorder
  const handleDragStart = (i: number) => setDragIndex(i)
  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault()
    setDragOver(i)
  }
  const handleDrop = (e: React.DragEvent, i: number) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === i) { setDragIndex(null); setDragOver(null); return }
    const newGallery = [...gallery]
    const [moved] = newGallery.splice(dragIndex, 1)
    newGallery.splice(i, 0, moved)
    setGallery(newGallery)
    setDragIndex(null)
    setDragOver(null)
  }

  const handleSave = async () => {
    if (!tenantId) return
    setSaving(true)
    const res = await fetch("/api/tenant/website", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, gallery }),
    })
    setSaving(false)
    if (res.ok) {
      toast({ title: "Galeri disimpan", description: `${gallery.length} foto berhasil diperbarui.` })
    } else {
      toast({ title: "Gagal", description: "Terjadi kesalahan.", variant: "destructive" })
    }
  }

  if (loading) return <div className="skeleton h-64 rounded-2xl" />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kelola Galeri</h1>
          <p className="text-muted-foreground mt-1">Upload foto, tambah caption, dan atur urutan tampilan.</p>
        </div>
        <div className="flex items-center gap-2">
          {slug && (
            <a href={`/site/${slug}/gallery`} target="_blank" rel="noopener"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
              <ExternalLink className="h-3.5 w-3.5" /> Lihat Galeri
            </a>
          )}
          <Button className="gap-2 btn-gradient text-white border-0 rounded-xl" onClick={handleSave} disabled={saving || gallery.length === 0}>
            {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-4 w-4" />}
            Simpan ({gallery.length})
          </Button>
        </div>
      </div>

      {/* Add photo */}
      <Card className="glass border-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Plus className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-base">Tambah Foto</CardTitle>
            </div>
            <div className="flex rounded-lg border overflow-hidden text-xs">
              <button onClick={() => setAddMode("upload")}
                className={cn("px-3 py-1.5 transition-colors", addMode === "upload" ? "bg-primary text-white" : "hover:bg-muted")}>
                Upload File
              </button>
              <button onClick={() => setAddMode("url")}
                className={cn("px-3 py-1.5 transition-colors", addMode === "url" ? "bg-primary text-white" : "hover:bg-muted")}>
                URL
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {addMode === "upload" ? (
            <div>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
                multiple className="hidden" onChange={e => handleUpload(e.target.files)} />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border py-10 transition-colors hover:border-primary/50 hover:bg-primary/5 disabled:opacity-50">
                {uploading
                  ? <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  : <Upload className="h-8 w-8 text-muted-foreground/50" />}
                <div className="text-center">
                  <p className="text-sm font-medium">{uploading ? "Mengunggah..." : "Klik atau drag foto ke sini"}</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WebP, GIF · Maks 5MB per file · Bisa pilih banyak</p>
                </div>
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={urlInput} onChange={e => setUrlInput(e.target.value)}
                  placeholder="https://contoh.com/foto.jpg"
                  className="rounded-xl pl-9"
                  onKeyDown={e => e.key === "Enter" && addByUrl()} />
              </div>
              <Button className="rounded-xl btn-gradient text-white border-0 shrink-0" onClick={addByUrl}>
                <Plus className="h-4 w-4 mr-1" /> Tambah
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gallery grid */}
      {gallery.length === 0 ? (
        <Card className="glass border-0">
          <CardContent className="p-12 text-center">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="font-semibold mb-1">Galeri masih kosong</p>
            <p className="text-sm text-muted-foreground">Upload foto atau tambahkan URL gambar di atas.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {gallery.length} foto · Drag untuk mengubah urutan · Klik caption untuk mengedit
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {gallery.map((item, i) => (
              <div key={i}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={e => handleDragOver(e, i)}
                onDrop={e => handleDrop(e, i)}
                onDragEnd={() => { setDragIndex(null); setDragOver(null) }}
                className={cn(
                  "group relative rounded-2xl overflow-hidden border bg-muted/20 transition-all",
                  dragOver === i && "ring-2 ring-primary scale-[1.02]",
                  dragIndex === i && "opacity-50"
                )}>
                {/* Image */}
                <div className="aspect-square relative">
                  <img src={item.url} alt={item.caption || `Foto ${i + 1}`}
                    className="w-full h-full object-cover" />
                  {/* Overlay controls */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                  <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/60 cursor-grab">
                      <GripVertical className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ConfirmDialog
                      trigger={
                        <button className="flex h-7 w-7 items-center justify-center rounded-lg bg-destructive text-white hover:bg-destructive/90">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      }
                      title="Hapus foto ini?"
                      description="Foto akan dihapus dari galeri website."
                      confirmText="Ya, hapus"
                      onConfirm={() => removeItem(i)}
                    />
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] rounded px-1.5 py-0.5">
                    {i + 1}
                  </div>
                </div>
                {/* Caption */}
                <div className="p-2">
                  <input
                    value={item.caption}
                    onChange={e => updateCaption(i, e.target.value)}
                    placeholder="Tambah caption..."
                    maxLength={100}
                    className="w-full text-xs bg-transparent border-0 outline-none placeholder:text-muted-foreground/50 text-foreground"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Button className="gap-2 btn-gradient text-white border-0 rounded-xl" onClick={handleSave} disabled={saving}>
              {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-4 w-4" />}
              Simpan Galeri
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
