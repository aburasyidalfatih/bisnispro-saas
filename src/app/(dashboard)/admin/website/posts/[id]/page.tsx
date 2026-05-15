"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { useTenantBranding } from "@/components/providers/tenant-branding-provider"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { postSchema } from "@/lib/validations/post"
import * as z from "zod"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { ArrowLeft, Save, Loader2, Search } from "lucide-react"
import Link from "next/link"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { ImageUploadDirect } from "@/components/ui/image-upload-direct"

type FormData = z.infer<typeof postSchema>

export default function PostFormPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const typeQuery = searchParams.get("type")
  const { branding, isLoadingTenant } = useTenantBranding()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  const tenantId = branding.id
  const isNew = params.id === "new"

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
      type: (typeQuery && ["BLOG_GURU", "EDITORIAL", "PENGUMUMAN"].includes(typeQuery) ? typeQuery : "BLOG_GURU") as any,
      status: "PUBLISHED",
      featuredImage: "",
      categoryId: "",
      content: "",
      seoTitle: "",
      seoDesc: ""
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
          toast({ title: "Gagal memuat artikel", description: d.error, variant: "destructive" })
          router.push(typeQuery ? `/admin/website/posts?type=${typeQuery}` : "/admin/website/posts")
          return
        }
        setValue("title", d.title)
        setValue("slug", d.slug)
        setValue("content", d.content)
        setValue("type", d.type)
        setValue("status", d.status)
        setValue("featuredImage", d.featuredImage || "")
        setValue("categoryId", d.categoryId || "")
        setValue("seoTitle", d.seoTitle || "")
        setValue("seoDesc", d.seoDesc || "")
        setInitialLoading(false)
      })
      .catch(() => {
        toast({ title: "Gagal memuat artikel", variant: "destructive" })
        setInitialLoading(false)
      })
  }, [tenantId, isNew, params.id, setValue, router])

  const onSubmit = async (data: FormData) => {
    if (!tenantId) return
    
    // Validasi manual konten kosong (karena RichTextEditor mengembalikan "<p></p>" saat kosong)
    const isEmptyContent = !data.content || data.content === "<p></p>" || data.content.trim() === ""
    if (isEmptyContent) {
      toast({ title: "Konten kosong", description: "Isi artikel tidak boleh kosong", variant: "destructive" })
      return
    }

    setLoading(true)

    const url = isNew ? `/api/tenant/posts` : `/api/tenant/posts/${params.id}`
    const method = isNew ? "POST" : "PUT"

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, tenantId })
      })

      const d = await res.json()
      if (res.ok) {
        toast({ title: "Berhasil", description: d.message })
        router.push(typeQuery ? `/admin/website/posts?type=${typeQuery}` : "/admin/website/posts")
        router.refresh()
      } else {
        toast({ title: "Gagal menyimpan", description: d.error, variant: "destructive" })
      }
    } catch {
      toast({ title: "Gagal menyimpan artikel", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) return <div className="skeleton h-[600px] rounded-2xl" />

  const contentValue = watch("content")
  const featuredImageValue = watch("featuredImage") || ""

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-full">
            <Link href={typeQuery ? `/admin/website/posts?type=${typeQuery}` : "/admin/website/posts"}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{isNew ? "Tulis Artikel Baru" : "Edit Artikel"}</h1>
            <p className="text-muted-foreground mt-1 text-sm">Gunakan editor di bawah untuk membuat konten menarik.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Kolom Kiri: Konten Utama */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass border-0 overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/30 pb-4 border-b border-border/50">
              <CardTitle className="text-base">Konten Utama</CardTitle>
              <CardDescription className="text-xs">Tulis judul dan isi artikel dengan lengkap.</CardDescription>
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
            <CardHeader className="bg-muted/30 pb-4 border-b border-border/50">
              <CardTitle className="text-base flex items-center gap-2">
                <Search className="h-4 w-4" /> Pengaturan SEO (Opsional)
              </CardTitle>
              <CardDescription className="text-xs">
                Tingkatkan peringkat artikel Anda di Google dengan mengisi meta informasi di bawah ini.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="seoTitle" className="text-sm font-medium">Meta Title (Judul SEO)</Label>
                  <span className={`text-[10px] font-medium ${(watch("seoTitle") ?? "").length > 60 ? "text-red-500" : "text-muted-foreground"}`}>
                    {(watch("seoTitle") ?? "").length} / 60
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
                  <span className={`text-[10px] font-medium ${(watch("seoDesc") ?? "").length > 160 ? "text-red-500" : "text-muted-foreground"}`}>
                    {(watch("seoDesc") ?? "").length} / 160
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
                <select 
                  id="status" 
                  {...register("status")} 
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-shadow hover:border-primary/50"
                >
                  <option value="PUBLISHED">🟢 Publikasikan Langsung</option>
                  <option value="PENDING">🔵 Menunggu Review (Draf Guru)</option>
                  <option value="REJECTED">🔴 Tolak / Perlu Revisi</option>
                  <option value="DRAFT">🟡 Simpan sebagai Draft</option>
                </select>
                {errors.status && <p className="text-xs text-red-500">{errors.status.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Jenis / Layout</Label>
                <select 
                  id="type" 
                  {...register("type")} 
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-shadow hover:border-primary/50"
                >
                  {(typeQuery === "PENGUMUMAN" || watch("type") === "PENGUMUMAN") ? (
                    <option value="PENGUMUMAN">Pengumuman Publik (Web)</option>
                  ) : (
                    <>
                      <option value="BLOG_GURU">Standar (Blog Guru)</option>
                      <option value="EDITORIAL">Editorial Khusus</option>
                    </>
                  )}
                </select>
                {errors.type && <p className="text-xs text-red-500">{errors.type.message}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="categoryId">Kategori Artikel</Label>
                  <Link href="/admin/website/categories" className="text-[10px] text-primary hover:underline font-medium">Kelola</Link>
                </div>
                <select 
                  id="categoryId" 
                  {...register("categoryId")} 
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-shadow hover:border-primary/50"
                >
                  <option value="">-- Pilih Kategori --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
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
                tenantId={tenantId ?? ""}
                value={featuredImageValue}
                onChange={(url) => setValue("featuredImage", url ?? "", { shouldValidate: true })}
              />
              <input type="hidden" {...register("featuredImage")} />
              {errors.featuredImage && <p className="text-xs text-red-500 mt-2">{errors.featuredImage.message}</p>}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3">
            <Button type="submit" disabled={loading} className="w-full gap-2 btn-gradient text-white border-0 rounded-xl py-6 shadow-md hover:shadow-lg transition-all">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              <span className="text-base font-semibold">{isNew ? "Simpan & Publikasikan" : "Perbarui Artikel"}</span>
            </Button>
            <Button asChild variant="ghost" className="w-full rounded-xl" disabled={loading}>
              <Link href={typeQuery ? `/admin/website/posts?type=${typeQuery}` : "/admin/website/posts"}>Batal</Link>
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
