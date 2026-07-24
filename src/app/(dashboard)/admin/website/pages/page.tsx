"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Plus, Edit2, Trash2, Globe, FileText, ArrowLeft, Loader2, Save, Sparkles, Bot, Eye } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { LazyRichTextEditor as RichTextEditor } from "@/components/ui/lazy-rich-text-editor"
import { ImageUploadDirect } from "@/components/ui/image-upload-direct"
import { useSession } from "next-auth/react"
import { useTenantBranding } from "@/components/providers/tenant-branding-provider"
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function CustomPagesPage() {
  const [pages, setPages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [form, setForm] = useState({ title: "", slug: "", content: "", featuredImage: "", isPublished: true })
  const [saving, setSaving] = useState(false)

  const { data: session } = useSession()
  const tenantId = (session?.user as any)?.tenants?.[0]?.id
  const { branding } = useTenantBranding()
  const domainString = branding?.slug ? `${branding.slug}.bisnispro.id` : "domain.bisnispro.id"

  // AI State
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [aiTopic, setAiTopic] = useState("")
  const [aiTone, setAiTone] = useState("pengumuman")
  const [aiLoading, setAiLoading] = useState(false)

  // Fix radix UI body lock bug
  useEffect(() => {
    if (!aiModalOpen) {
      setTimeout(() => {
        document.body.style.pointerEvents = ""
      }, 100)
    }
  }, [aiModalOpen])

  const fetchPages = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/website/pages")
      if (res.ok) {
        setPages(await res.json())
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPages()
  }, [])

  const handleSave = async () => {
    if (!form.title || !form.slug) {
      toast({ title: "Gagal", description: "Judul dan URL Slug wajib diisi", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      const url = editingId ? `/api/admin/website/pages/${editingId}` : "/api/admin/website/pages"
      const method = editingId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Gagal menyimpan halaman")
      }

      toast({ title: "Berhasil", description: "Halaman kustom berhasil disimpan" })
      setIsFormOpen(false)
      fetchPages()
    } catch (e: any) {
      toast({ title: "Gagal", description: e.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/website/pages/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Gagal menghapus")
      toast({ title: "Berhasil", description: "Halaman dihapus" })
      fetchPages()
    } catch (e) {
      toast({ title: "Gagal", description: "Terjadi kesalahan", variant: "destructive" })
    }
  }

  const openForm = (page?: any) => {
    if (page) {
      setEditingId(page.id)
      setForm({ title: page.title, slug: page.slug, content: page.content || "", featuredImage: page.featuredImage || "", isPublished: page.isPublished })
    } else {
      setEditingId(null)
      setForm({ title: "", slug: "", content: "", featuredImage: "", isPublished: true })
    }
    setIsFormOpen(true)
  }

  const generateSlug = (title: string) => {
    setForm(prev => {
      // Jika sedang edit halaman (bukan buat baru), jangan overwrite slug saat judul diubah, 
      // kecuali slug-nya memang kosong.
      if (editingId && prev.slug.trim() !== "") {
        return { ...prev, title }
      }
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")
      return { ...prev, title, slug }
    })
  }

  const handleGenerateAI = async () => {
    if (!aiTopic.trim()) {
      toast({ title: "Topik kosong", description: "Silakan masukkan poin-poin halaman terlebih dahulu.", variant: "destructive" })
      return
    }

    setAiLoading(true)
    try {
      const res = await fetch("/api/tenant/ai/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, topic: aiTopic, tone: aiTone, type: "page" })
      })
      const d = await res.json()
      if (res.ok && d.success && d.data) {
        setForm(prev => ({ 
          ...prev, 
          title: d.data.title || prev.title, 
          content: d.data.content || prev.content,
          slug: prev.slug || (d.data.title ? d.data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") : prev.slug)
        }))
        setAiModalOpen(false)
        setAiTopic("")
        toast({ title: "Berhasil Dibuat", description: "Silakan review dan edit hasil tulisan AI sebelum menyimpan." })
      } else {
        toast({ title: "Gagal", description: d.error || "Terjadi kesalahan", variant: "destructive" })
      }
    } catch (err) {
      toast({ title: "Error", description: "Gagal menghubungi server AI", variant: "destructive" })
    } finally {
      setAiLoading(false)
    }
  }

  if (isFormOpen) {
    return (
      <>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setIsFormOpen(false)} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{editingId ? "Edit Halaman" : "Tambah Halaman Baru"}</h1>
            <p className="text-muted-foreground mt-1">Desain halaman statis kustom Anda.</p>
          </div>
        </div>

      <div className="grid gap-6 lg:grid-cols-3 items-start max-w-[1200px] mx-auto max-w-full">
        {/* Kolom Kiri: Konten Utama */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass border-0 overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/30 pb-4 border-b border-border/50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Konten Utama</CardTitle>
                <CardDescription className="text-xs">Tulis judul dan isi halaman kustom Anda.</CardDescription>
              </div>
              <Button 
                type="button" 
                onClick={(e) => { e.preventDefault(); setAiModalOpen(true); }}
                className="gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white shadow-md border-0 rounded-xl text-xs h-8 px-3"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Buat dengan AI
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-6 pt-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Judul Halaman <span className="text-red-500">*</span></Label>
                <Input value={form.title} onChange={e => generateSlug(e.target.value)} placeholder="Contoh: Tata Tertib Klien" className="rounded-xl h-10 font-medium" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Isi Halaman</Label>
                <RichTextEditor 
                  value={form.content}
                  onChange={val => setForm(p => ({ ...p, content: val }))}
                  placeholder="Tuliskan konten halaman di sini..."
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kolom Kanan: Pengaturan */}
        <div className="space-y-6">
          <Card className="glass border-0 overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/30 pb-4 border-b border-border/50">
              <CardTitle className="text-base">Pengaturan Halaman</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6 pt-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">URL Slug <span className="text-red-500">*</span></Label>
                <div className="flex items-center">
                  <span className="bg-muted px-3 border border-r-0 border-input rounded-l-xl h-10 flex items-center text-sm text-muted-foreground">
                    /
                  </span>
                  <Input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))} placeholder="tata-tertib" className="rounded-l-none rounded-r-xl h-10" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Gambar Unggulan (Opsional)</Label>
                <ImageUploadDirect 
                  value={form.featuredImage}
                  onChange={(url) => setForm(p => ({ ...p, featuredImage: url }))}
                  tenantId={branding?.id as string}
                />
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">Gunakan gambar resolusi 1200x630px untuk hasil terbaik saat dibagikan ke sosmed.</p>
              </div>

              <div className="pt-2 border-t border-border/50">
                <div className="flex flex-col space-y-3 pt-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="published" className="cursor-pointer font-medium">Status Publikasi</Label>
                    <Switch 
                      id="published" 
                      checked={form.isPublished} 
                      onCheckedChange={c => setForm(p => ({ ...p, isPublished: c }))} 
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">Jika dimatikan, halaman ini hanya akan tersimpan sebagai draft dan tidak bisa diakses publik.</p>
                </div>
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl gap-2 font-bold h-10">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Simpan Halaman
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>

      {/* AI Generate Modal */}
      <Dialog open={aiModalOpen} onOpenChange={setAiModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-0 shadow-2xl rounded-2xl glass">
          <div className="bg-gradient-to-br from-primary to-indigo-600 p-6 text-primary-foreground">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <DialogTitle className="text-2xl font-bold text-white">AI Page Generator</DialogTitle>
            </div>
            <DialogDescription className="text-primary-foreground/80">
              Buat halaman kustom (Tata Tertib, Sejarah, Profil) dalam hitungan detik.
            </DialogDescription>
          </div>

          <div className="p-6 space-y-6 bg-card">
            <div className="space-y-3">
              <Label className="font-semibold text-foreground/80">Topik atau Poin-poin Utama</Label>
              <Textarea 
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="Misal: Buatkan Standar Operasional Prosedur (SOP) karyawan. Jam kerja 08.00 - 17.00. Wajib berpakaian rapi dan profesional."
                className="h-32 rounded-xl resize-none focus-visible:ring-primary/50"
              />
            </div>

            <div className="space-y-3">
              <Label className="font-semibold text-foreground/80">Gaya Bahasa</Label>
              <Select value={aiTone} onValueChange={setAiTone}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Pilih gaya bahasa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pengumuman">Instruksional & Tegas (Aturan / Tata Tertib)</SelectItem>
                  <SelectItem value="formal">Formal & Profesional (Sejarah / Profil)</SelectItem>
                  <SelectItem value="santai">Santai & Ramah</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Pembuatan halaman memotong saldo AI Token (50 token). Pastikan poin-poin cukup detail agar hasil maksimal.
              </p>
            </div>
          </div>

          <DialogFooter className="p-6 pt-0 bg-card sm:justify-between">
            <Button variant="ghost" className="rounded-xl" onClick={() => setAiModalOpen(false)} disabled={aiLoading}>
              Batal
            </Button>
            <Button 
              className="rounded-xl gap-2 font-bold bg-primary hover:bg-primary/90 text-white"
              onClick={handleGenerateAI} 
              disabled={aiLoading || !aiTopic.trim()}
            >
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {aiLoading ? "Membuat Halaman..." : "Generate Halaman"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Halaman Kustom</h1>
          <p className="text-muted-foreground mt-1">Buat halaman statis seperti Tata Tertib, Sejarah, dll.</p>
        </div>
        <Button onClick={() => openForm()} className="rounded-xl gap-2">
          <Plus className="h-4 w-4" /> Tambah Halaman
        </Button>
      </div>

      <Card className="glass border-0">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
              Memuat data...
            </div>
          ) : pages.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-muted/50 mb-4">
                <FileText className="h-8 w-8 opacity-50" />
              </div>
              <p>Belum ada halaman kustom.</p>
              <Button variant="outline" className="mt-4 rounded-xl" onClick={() => openForm()}>Buat Sekarang</Button>
            </div>
          ) : (
            <div className="divide-y">
              {pages.map((page) => (
                <div key={page.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base">{page.title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> {domainString}/{page.slug}</span>
                        <span className={page.isPublished ? "text-emerald-500 font-medium" : "text-amber-500 font-medium"}>
                          {page.isPublished ? "Publik" : "Draft"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {page.isPublished && (
                      <Button asChild variant="ghost" size="icon" className="rounded-lg h-9 w-9 text-muted-foreground hover:bg-primary/10 hover:text-blue-600" title="Lihat di website">
                        <a href={`https://${domainString}/${page.slug}`} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => openForm(page)} className="rounded-lg h-9">
                      <Edit2 className="h-4 w-4 mr-1.5" /> Edit
                    </Button>
                    <ConfirmDialog
                      title="Hapus Halaman?"
                      description={`Yakin ingin menghapus halaman "${page.title}"?`}
                      onConfirm={() => handleDelete(page.id)}
                      trigger={
                        <Button variant="destructive" size="icon" className="rounded-lg h-9 w-9">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
