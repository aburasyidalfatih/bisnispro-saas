"use client"

import { useEffect, useState } from "react"
import { useTenantBranding } from "@/components/providers/tenant-branding-provider"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { toast } from "@/hooks/use-toast"
import { Plus, Trash2, Edit, Tag, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { categorySchema } from "@/lib/validations/category"
import * as z from "zod"

type FormData = z.infer<typeof categorySchema>

interface Category {
  id: string
  name: string
  slug: string
  description?: string | null
  _count?: {
    posts: number
  }
}

export default function CategoryPage() {
  const { branding, isLoadingTenant } = useTenantBranding()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<Category[]>([])
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const tenantId = branding.id

  const form = useForm<FormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      slug: "",
      description: ""
    }
  })

  // Auto generate slug from name
  const nameValue = form.watch("name")
  useEffect(() => {
    if (!editingId && nameValue) {
      const generatedSlug = nameValue
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
      form.setValue("slug", generatedSlug)
    }
  }, [nameValue, editingId, form])

  const loadData = async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/tenant/categories?tenantId=${tenantId}`)
      if (!res.ok) throw new Error("Gagal memuat data")
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isLoadingTenant && tenantId) {
      loadData()
    }
  }, [tenantId, isLoadingTenant])

  const handleEdit = (category: Category) => {
    setEditingId(category.id)
    form.reset({
      name: category.name,
      slug: category.slug,
      description: category.description || ""
    })
    setOpen(true)
  }

  const handleCreate = () => {
    setEditingId(null)
    form.reset({ name: "", slug: "", description: "" })
    setOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!tenantId) return
    try {
      const res = await fetch(`/api/tenant/categories/${id}?tenantId=${tenantId}`, {
        method: "DELETE"
      })
      if (!res.ok) throw new Error("Gagal menghapus")
      toast({ title: "Kategori dihapus" })
      loadData()
    } catch (err: any) {
      toast({ title: "Gagal", description: err.message, variant: "destructive" })
    }
  }

  const onSubmit = async (data: FormData) => {
    if (!tenantId) return
    setIsSaving(true)
    try {
      const url = editingId ? `/api/tenant/categories/${editingId}` : `/api/tenant/categories`
      const method = editingId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, tenantId })
      })

      const resData = await res.json()

      if (!res.ok) throw new Error(resData.error || "Gagal menyimpan")
      
      toast({ title: "Berhasil", description: resData.message })
      setOpen(false)
      loadData()
    } catch (err: any) {
      toast({ title: "Gagal", description: err.message, variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) return <div className="skeleton h-64 rounded-2xl" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kategori Artikel</h1>
          <p className="text-muted-foreground mt-1">Kelola kategori untuk mengklasifikasikan postingan website.</p>
        </div>
        <Button onClick={handleCreate} className="gap-2 btn-gradient text-white border-0 rounded-xl">
          <Plus className="h-4 w-4" /> Tambah Kategori
        </Button>
      </div>

      <Card className="glass border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Daftar Kategori</CardTitle>
          <CardDescription className="text-xs">Kategori yang tersedia untuk artikel Anda.</CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="py-12 text-center">
              <Tag className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="font-semibold mb-1">Belum ada kategori</p>
              <p className="text-sm text-muted-foreground mb-4">Tambahkan kategori pertama untuk merapikan artikel sekolah.</p>
              <Button onClick={handleCreate} variant="outline" className="rounded-xl">
                Tambah Sekarang
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map(item => (
                <Card key={item.id} className="overflow-hidden border group relative hover:border-primary/50 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <div className="bg-primary/10 p-2 rounded-lg text-primary">
                        <Tag className="h-5 w-5" />
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button onClick={() => handleEdit(item)} variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <ConfirmDialog
                          trigger={
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          }
                          title={`Hapus kategori "${item.name}"?`}
                          description="Artikel yang menggunakan kategori ini akan kehilangan relasinya (tetapi artikel tidak ikut terhapus)."
                          confirmText="Ya, hapus"
                          onConfirm={() => handleDelete(item.id)}
                        />
                      </div>
                    </div>
                    <h3 className="font-bold truncate text-lg">{item.name}</h3>
                    <p className="text-xs text-muted-foreground mb-3 font-mono">/{item.slug}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                      {item.description || "Tidak ada deskripsi."}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Kategori" : "Tambah Kategori Baru"}</DialogTitle>
            <DialogDescription>
              Buat kategori baru untuk mengelompokkan artikel Anda.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Kategori <span className="text-red-500">*</span></Label>
              <Input 
                id="name" 
                {...form.register("name")} 
                placeholder="Contoh: Berita Sekolah" 
                className="rounded-xl"
              />
              {form.formState.errors.name && <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input 
                id="slug" 
                {...form.register("slug")} 
                placeholder="berita-sekolah" 
                className="rounded-xl bg-muted/50"
              />
              <p className="text-[10px] text-muted-foreground">URL yang akan muncul di address bar. Pastikan unik.</p>
              {form.formState.errors.slug && <p className="text-xs text-red-500">{form.formState.errors.slug.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea 
                id="description" 
                {...form.register("description")} 
                placeholder="Kumpulan informasi dan berita terbaru..." 
                className="rounded-xl resize-none h-20"
              />
              {form.formState.errors.description && <p className="text-xs text-red-500">{form.formState.errors.description.message}</p>}
            </div>

            <div className="pt-4 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="rounded-xl">
                Batal
              </Button>
              <Button type="submit" disabled={isSaving} className="rounded-xl btn-gradient text-white border-0">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingId ? "Simpan Perubahan" : "Buat Kategori"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
