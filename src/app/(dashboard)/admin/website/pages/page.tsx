"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Plus, Edit2, Trash2, Globe, FileText, ArrowLeft, Loader2, Save } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { LazyRichTextEditor as RichTextEditor } from "@/components/ui/lazy-rich-text-editor"

export default function CustomPagesPage() {
  const [pages, setPages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [form, setForm] = useState({ title: "", slug: "", content: "", isPublished: true })
  const [saving, setSaving] = useState(false)

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
      setForm({ title: page.title, slug: page.slug, content: page.content || "", isPublished: page.isPublished })
    } else {
      setEditingId(null)
      setForm({ title: "", slug: "", content: "", isPublished: true })
    }
    setIsFormOpen(true)
  }

  const generateSlug = (title: string) => {
    if (!editingId && !form.slug) {
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")
      setForm(prev => ({ ...prev, title, slug }))
    } else {
      setForm(prev => ({ ...prev, title }))
    }
  }

  if (isFormOpen) {
    return (
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

        <Card className="glass border-0">
          <CardContent className="p-6 space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Judul Halaman</Label>
                <Input value={form.title} onChange={e => generateSlug(e.target.value)} placeholder="Contoh: Tata Tertib Siswa" className="rounded-xl h-10" />
              </div>
              <div className="space-y-2">
                <Label>URL Slug</Label>
                <div className="flex items-center">
                  <span className="bg-muted px-3 border border-r-0 border-input rounded-l-xl h-10 flex items-center text-sm text-muted-foreground">
                    /pages/
                  </span>
                  <Input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))} placeholder="tata-tertib" className="rounded-l-none rounded-r-xl h-10" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Konten Halaman</Label>
              <RichTextEditor 
                value={form.content}
                onChange={val => setForm(p => ({ ...p, content: val }))}
                placeholder="Tuliskan konten halaman di sini..."
              />
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="published" 
                  checked={form.isPublished} 
                  onCheckedChange={c => setForm(p => ({ ...p, isPublished: c }))} 
                />
                <Label htmlFor="published">Publikasikan halaman ini</Label>
              </div>
              <Button onClick={handleSave} disabled={saving} className="rounded-xl gap-2 font-bold min-w-[120px]">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Simpan
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
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
                        <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> /pages/{page.slug}</span>
                        <span className={page.isPublished ? "text-emerald-500 font-medium" : "text-amber-500 font-medium"}>
                          {page.isPublished ? "Publik" : "Draft"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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
