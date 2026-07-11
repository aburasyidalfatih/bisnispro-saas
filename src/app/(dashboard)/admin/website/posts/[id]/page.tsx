"use client"

import { useEffect, useState } from"react"
import { useRouter, useParams, useSearchParams } from"next/navigation"
import { useTenantBranding } from"@/components/providers/tenant-branding-provider"
import { useForm } from"react-hook-form"
import { zodResolver } from"@hookform/resolvers/zod"
import { postSchema } from"@/features/post/schemas/post.schema"
import * as z from"zod"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { Input } from"@/components/ui/input"
import { Label } from"@/components/ui/label"
import { Textarea } from"@/components/ui/textarea"
import { Switch } from"@/components/ui/switch"
import { toast } from"@/hooks/use-toast"
import { ArrowLeft, Save, Loader2, Search, Sparkles, Wand2 } from"lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from"@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from"@/components/ui/select"
import Link from"next/link"
import { LazyRichTextEditor as RichTextEditor } from"@/components/ui/lazy-rich-text-editor"
import { ImageUploadDirect } from"@/components/ui/image-upload-direct"
import { normalizeImageUrl } from"@/lib/utils"

type FormData = z.infer<typeof postSchema>

export default function PostFormPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const typeQuery = searchParams.get("type")
  const { branding, isLoadingTenant } = useTenantBranding()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [isGeneratingSEO, setIsGeneratingSEO] = useState(false)

  const isEditing = params.id !== "new"


  const handleGenerateSEO = async () => {
    const title = watch("title")
    if (!title) {
      toast({ title: "Validasi", description: "Isi judul artikel terlebih dahulu.", variant: "destructive" })
      return
    }
    try {
      setIsGeneratingSEO(true)
      const res = await fetch("/api/ai/seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal generate SEO")
      
      setValue("seoTitle", data.metaTitle, { shouldValidate: true })
      setValue("seoDesc", data.metaDescription, { shouldValidate: true })
      toast({ title: "Berhasil", description: "Meta SEO berhasil dibuat oleh AI." })
    } catch (err: any) {
      toast({ title: "Error AI", description: err.message, variant: "destructive" })
    } finally {
      setIsGeneratingSEO(false)
    }
  }

  // AI State
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [aiTopic, setAiTopic] = useState("")
  const [aiTone, setAiTone] = useState("formal")
  const [aiLoading, setAiLoading] = useState(false)

  const tenantId = branding.id
  const isNew = params.id ==="new"

  const [categories, setCategories] = useState<{id: string, name: string}[]>([])

  useEffect(() => {
    if (!tenantId) return
    fetch(`/api/tenant/categories?tenantId=${tenantId}`)
      .then(r => r.json())
      .then(d => setCategories(Array.isArray(d) ? d : []))
  }, [tenantId])

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      type: (typeQuery && ["BLOG_GURU","EDITORIAL","PENGUMUMAN"].includes(typeQuery) ? typeQuery :"BLOG_GURU") as any,
      status:"PUBLISHED",
      featuredImage:"",
      imageAlt:"",
      categoryId:"",
      content:"",
      seoTitle:"",
      seoDesc:"",
      autoShare: true
    }
  })

  // Auto generate slug from title
  const titleValue = watch("title")
  useEffect(() => {
    if (isNew && titleValue) {
      const generatedSlug = titleValue
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
      setValue("slug", generatedSlug)
    }
  }, [titleValue, isNew, setValue])

  useEffect(() => {
    if (isLoadingTenant) return
    if (!tenantId) return
    if (isNew) {
      setInitialLoading(false)
      return
    }

    fetch(`/api/tenant/posts/${params.id}?tenantId=${tenantId}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) {
          toast({ title:"Gagal memuat artikel", description: d.error, variant:"destructive" })
          router.push(typeQuery ? `/admin/website/posts?type=${typeQuery}` :"/admin/website/posts")
          return
        }
        setValue("title", d.title)
        setValue("slug", d.slug)
        setValue("content", d.content)
        setValue("type", d.type)
        setValue("status", d.status)
        setValue("featuredImage", normalizeImageUrl(d.featuredImage) ||"")
        setValue("imageAlt", d.imageAlt ||"")
        setValue("categoryId", d.categoryId ||"")
        setValue("seoTitle", d.seoTitle ||"")
        setValue("seoDesc", d.seoDesc ||"")
        if (d.publishedAt) {
          const date = new Date(d.publishedAt)
          // Format as YYYY-MM-DDThh:mm for datetime-local input
          const offset = date.getTimezoneOffset()
          const localDate = new Date(date.getTime() - (offset*60*1000))
          setValue("publishedAt", localDate.toISOString().slice(0, 16) as any)
        }
        setInitialLoading(false)
      })
      .catch(() => {
        toast({ title:"Gagal memuat artikel", variant:"destructive" })
        setInitialLoading(false)
      })
  }, [tenantId, isNew, params.id, setValue, router])

  const onSubmit = async (data: FormData) => {
    if (!tenantId) return
    
    // Validasi manual konten kosong (karena RichTextEditor mengembalikan"<p></p>" saat kosong)
    const isEmptyContent = !data.content || data.content ==="<p></p>" || data.content.trim() ===""
    if (isEmptyContent) {
      toast({ title:"Konten kosong", description:"Isi artikel tidak boleh kosong", variant:"destructive" })
      return
    }

    setLoading(true)

    const url = isNew ? `/api/tenant/posts` : `/api/tenant/posts/${params.id}`
    const method = isNew ?"POST" :"PUT"

    try {
      const res = await fetch(url, {
        method,
        headers: {"Content-Type":"application/json" },
        body: JSON.stringify({ ...data, tenantId })
      })

      const d = await res.json()
      if (res.ok) {
        toast({ title:"Berhasil", description: d.message })
        router.push(typeQuery ? `/admin/website/posts?type=${typeQuery}` :"/admin/website/posts")
        router.refresh()
      } else {
        toast({ title:"Gagal menyimpan", description: d.error, variant:"destructive" })
      }
    } catch {
      toast({ title:"Gagal menyimpan artikel", variant:"destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateAI = async () => {
    if (!aiTopic.trim()) {
      toast({ title:"Topik kosong", description:"Silakan masukkan poin-poin cerita terlebih dahulu.", variant:"destructive" })
      return
    }

    setAiLoading(true)
    try {
      const res = await fetch("/api/tenant/ai/generate-post", {
        method:"POST",
        headers: {"Content-Type":"application/json" },
        body: JSON.stringify({ tenantId, topic: aiTopic, tone: aiTone })
      })
      const d = await res.json()
      if (res.ok && d.success && d.data) {
        setValue("title", d.data.title, { shouldValidate: true })
        setValue("content", d.data.content, { shouldValidate: true })
        setValue("seoTitle", d.data.seoTitle, { shouldValidate: true })
        setValue("seoDesc", d.data.seoDesc, { shouldValidate: true })
        setAiModalOpen(false)
        setAiTopic("")
        toast({ title:"Artikel Berhasil Dibuat", description:"Silakan review dan edit hasil tulisan AI sebelum menyimpan." })
      } else {
        toast({ title:"Gagal membuat artikel", description: d.error ||"Terjadi kesalahan", variant:"destructive" })
      }
    } catch (err) {
      toast({ title:"Error", description:"Gagal menghubungi server AI", variant:"destructive" })
    } finally {
      setAiLoading(false)
    }
  }

  if (initialLoading) return <div className="skeleton h-[600px] rounded-2xl" />

  const contentValue = watch("content")
  const featuredImageValue = watch("featuredImage") ||""

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-10 max-w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-full">
            <Link href={typeQuery ? `/admin/website/posts?type=${typeQuery}` :"/admin/website/posts"}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{isNew ?"Tulis Artikel Baru" :"Edit Artikel"}</h1>
            <p className="text-muted-foreground mt-1 text-sm">Gunakan editor di bawah untuk membuat konten menarik.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Kolom Kiri: Konten Utama */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass border-0 overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/30 pb-4 border-b border-border/50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Konten Utama</CardTitle>
                <CardDescription className="text-xs">Tulis judul dan isi artikel dengan lengkap.</CardDescription>
              </div>
              <Button 
                onClick={(e) => { e.preventDefault(); setAiModalOpen(true); }}
                className="gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white shadow-md border-0 rounded-xl text-xs h-8 px-3"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Tulis dengan AI
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-6 pt-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">Judul Artikel <span className="text-red-500">*</span></Label>
                <Input 
                  id="title" 
                  {...register("title")} 
                  className="rounded-xl text-lg px-4 py-6 font-medium border-muted-foreground/20 focus-visible:ring-primary/20" 
                  placeholder="Ketik judul artikel di sini..." 
                />
                {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="content" className="text-sm font-medium">Isi Artikel <span className="text-red-500">*</span></Label>
                <RichTextEditor 
                  value={contentValue} 
                  onChange={(val) => setValue("content", val, { shouldValidate: true })} 
                  placeholder="Mulai menulis cerita Anda..."
                />
                {errors.content && <p className="text-xs text-red-500">{errors.content.message}</p>}
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass border-0 overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/30 pb-4 border-b border-border/50 flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Search className="h-4 w-4" /> Pengaturan SEO (Opsional)
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Tingkatkan peringkat artikel Anda di Google dengan mengisi meta informasi di bawah ini.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateSEO}
                disabled={isGeneratingSEO}
                className="gap-2 text-xs h-8 border-primary/20 hover:bg-primary/5 hover:text-primary"
              >
                {isGeneratingSEO ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3 text-primary" />}
                Generate AI
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="seoTitle" className="text-sm font-medium">Meta Title (Judul SEO)</Label>
                  <span className={`text-[10px] font-medium ${(watch("seoTitle") ??"").length > 60 ?"text-red-500" :"text-muted-foreground"}`}>
                    {(watch("seoTitle") ??"").length} / 60
                  </span>
                </div>
                <Input 
                  id="seoTitle" 
                  {...register("seoTitle")} 
                  className="rounded-xl" 
                  placeholder="Judul yang akan muncul di hasil pencarian Google" 
                />
                {errors.seoTitle && <p className="text-xs text-red-500">{errors.seoTitle.message}</p>}
                <p className="text-[11px] text-muted-foreground">Jika dikosongkan, judul artikel akan digunakan sebagai Meta Title.</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="seoDesc" className="text-sm font-medium">Meta Description</Label>
                  <span className={`text-[10px] font-medium ${(watch("seoDesc") ??"").length > 160 ?"text-red-500" :"text-muted-foreground"}`}>
                    {(watch("seoDesc") ??"").length} / 160
                  </span>
                </div>
                <Textarea 
                  id="seoDesc" 
                  {...register("seoDesc")} 
                  className="rounded-xl min-h-[100px] resize-none" 
                  placeholder="Tuliskan rangkuman singkat artikel ini (1-2 kalimat)..." 
                />
                {errors.seoDesc && <p className="text-xs text-red-500">{errors.seoDesc.message}</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kolom Kanan: Pengaturan */}
        <div className="space-y-6 sticky top-6">
          <Card className="glass border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Pengaturan Publikasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={watch("status")} onValueChange={v => setValue("status", v as any, { shouldValidate: true })}>
                  <SelectTrigger className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-shadow hover:border-primary/50">
                    <SelectValue placeholder="Pilih Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLISHED">🟢 Publikasikan Langsung</SelectItem>
                    <SelectItem value="PENDING">🔵 Menunggu Review (Draf Guru)</SelectItem>
                    <SelectItem value="REJECTED">🔴 Tolak / Perlu Revisi</SelectItem>
                    <SelectItem value="DRAFT">🟡 Simpan sebagai Draft</SelectItem>
                    <SelectItem value="SCHEDULED" disabled={branding.plan === "free"}>
                      📅 Jadwalkan Tayang {branding.plan === "free" ? "(Khusus Lite/Pro)" : ""}
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && <p className="text-xs text-red-500">{errors.status.message}</p>}
              </div>

              {watch("status") === "SCHEDULED" && (
                <div className="space-y-2">
                  <Label htmlFor="publishedAt">Tanggal & Waktu Tayang</Label>
                  <Input 
                    type="datetime-local" 
                    id="publishedAt" 
                    {...register("publishedAt")} 
                    className="w-full"
                  />
                  {errors.publishedAt && <p className="text-xs text-red-500">{errors.publishedAt.message}</p>}
                </div>
              )}

              {watch("status") === "PUBLISHED" && (
                <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm bg-background">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Auto Share Sosmed</Label>
                    <p className="text-xs text-muted-foreground">Bagikan ke Facebook, Twitter, dll otomatis (Paket Lite/Pro).</p>
                  </div>
                  <Switch
                    checked={watch("autoShare")}
                    onCheckedChange={(c) => setValue("autoShare", c)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="type">Jenis / Layout</Label>
                <Select value={watch("type")} onValueChange={v => setValue("type", v as any, { shouldValidate: true })}>
                  <SelectTrigger className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-shadow hover:border-primary/50">
                    <SelectValue placeholder="Pilih Jenis" />
                  </SelectTrigger>
                  <SelectContent>
                    {(typeQuery ==="PENGUMUMAN" || watch("type") ==="PENGUMUMAN") ? (
                      <SelectItem value="PENGUMUMAN">Pengumuman Publik (Web)</SelectItem>
                    ) : (
                      <>
                        <SelectItem value="BLOG_GURU">Standar (Blog Guru)</SelectItem>
                        <SelectItem value="EDITORIAL">Editorial Khusus</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-xs text-red-500">{errors.type.message}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="categoryId">Kategori Artikel</Label>
                  <Link href="/admin/website/categories" className="text-[10px] text-primary hover:underline font-medium">Kelola</Link>
                </div>
                <Select value={watch("categoryId") ?? undefined} onValueChange={v => setValue("categoryId", v, { shouldValidate: true })}>
                  <SelectTrigger className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-shadow hover:border-primary/50">
                    <SelectValue placeholder="-- Pilih Kategori --" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">Kategori dinamis yang akan tampil di web publik.</p>
                {errors.categoryId && <p className="text-xs text-red-500">{errors.categoryId.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Tautan URL (Slug)</Label>
                <Input 
                  id="slug" 
                  {...register("slug")} 
                  className="rounded-xl bg-muted/50 text-muted-foreground text-sm" 
                  placeholder="kegiatan-porseni-2026" 
                />
                <p className="text-[10px] text-muted-foreground">Otomatis dibuat dari judul. Hanya ubah jika perlu.</p>
                {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Gambar Utama</CardTitle>
              <CardDescription className="text-xs">
                Gambar ini akan menjadi sampul artikel Anda.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUploadDirect 
                tenantId={tenantId ??""}
                value={featuredImageValue}
                onChange={(url) => setValue("featuredImage", url ??"", { shouldValidate: true })}
                hint="Rekomendasi rasio 16:9 (misal: 1280x720px)"
              />
              <Input type="hidden" {...register("featuredImage")} />
              <div className="mt-4 space-y-2">
                <Label htmlFor="imageAlt" className="text-sm font-medium">Alt Text Gambar (SEO)</Label>
                <Input 
                  id="imageAlt" 
                  {...register("imageAlt")} 
                  className="rounded-xl" 
                  placeholder="Deskripsikan gambar ini untuk Google..." 
                />
                <p className="text-[10px] text-muted-foreground">Penting untuk aksesibilitas dan pencarian gambar Google (Google Images).</p>
                {errors.imageAlt && <p className="text-xs text-red-500">{errors.imageAlt.message}</p>}
              </div>
              {errors.featuredImage && <p className="text-xs text-red-500 mt-2">{errors.featuredImage.message}</p>}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3">
            <Button type="submit" disabled={loading} className="w-full gap-2 btn-gradient text-white border-0 rounded-xl py-6 shadow-md hover:shadow-lg transition-all flex items-center justify-center">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              <span className="text-base font-semibold">{isNew ?"Simpan & Publikasikan" :"Perbarui Artikel"}</span>
            </Button>
            <Button asChild variant="ghost" className="w-full rounded-xl" disabled={loading}>
              <Link href={typeQuery ? `/admin/website/posts?type=${typeQuery}` :"/admin/website/posts"}>Batal</Link>
            </Button>
          </div>
        </div>
      </form>

      {/* AI Generate Modal */}
      <Dialog open={aiModalOpen} onOpenChange={setAiModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl max-w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" />
              AI Article Writer
            </DialogTitle>
            <DialogDescription>
              Ubah poin-poin singkat menjadi artikel utuh yang profesional.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Poin Singkat Cerita / Berita <span className="text-red-500">*</span></Label>
              <Textarea 
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="Misal: Hari ini Senin upacara bendera. Pembina Pak Budi menyampaikan pesan tentang kebersihan lingkungan kelas. Upacara berjalan tertib dan hikmat."
                className="min-h-[120px] rounded-xl resize-none"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Gaya Bahasa</Label>
              <Select value={aiTone} onValueChange={setAiTone}>
                <SelectTrigger className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm">
                  <SelectValue placeholder="Pilih Gaya Bahasa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="formal">Formal & Jurnalistik (Berita Resmi)</SelectItem>
                  <SelectItem value="santai">Santai & Inspiratif (Bercerita / Storytelling)</SelectItem>
                  <SelectItem value="pengumuman">Surat Edaran / Pengumuman Resmi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="rounded-xl bg-violet-500/10 p-3 flex gap-2 items-start mt-2 border border-violet-500/20">
              <Wand2 className="h-4 w-4 text-violet-600 mt-0.5 shrink-0" />
              <p className="text-[11px] text-violet-700 leading-relaxed">
                Pembuatan artikel memotong saldo AI Token (50 token). Pastikan poin berita cukup detail agar hasil maksimal.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="ghost" className="rounded-xl" onClick={() => setAiModalOpen(false)} disabled={aiLoading}>
              Batal
            </Button>
            <Button 
              onClick={handleGenerateAI} 
              disabled={aiLoading || !aiTopic.trim()}
              className="rounded-xl gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white border-0"
            >
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {aiLoading ?"Menulis Artikel..." :"Mulai Generate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
