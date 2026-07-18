"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/hooks/use-toast"
import { ChevronLeft, Save, Loader2 } from "lucide-react"
import Link from "next/link"

export default function CreateCoursePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    thumbnail: "",
    price: 0,
    isPublished: false,
  })

  const generateSlug = (text: string) => {
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value
    setFormData({ ...formData, title, slug: generateSlug(title) })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/super-admin/academy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (res.ok) {
        toast({ title: "Berhasil", description: "Kelas baru berhasil dibuat" })
        router.push("/super-admin/academy")
      } else {
        toast({ title: "Gagal", description: data.error || "Terjadi kesalahan", variant: "destructive" })
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/super-admin/academy">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Buat Kelas Baru</h1>
          <p className="text-muted-foreground text-sm">Tambahkan materi kursus baru untuk Admin Lembaga</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="glass border-0 shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="text-lg">Informasi Dasar Kelas</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="title">Judul Kelas</Label>
                <Input
                  id="title"
                  placeholder="Contoh: Digital Marketing untuk Sekolah"
                  value={formData.title}
                  onChange={handleTitleChange}
                  required
                  className="rounded-xl bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug URL</Label>
                <Input
                  id="slug"
                  placeholder="digital-marketing-sekolah"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
                  required
                  className="rounded-xl bg-background/50 font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Harga (Rp)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="0 untuk gratis"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                  className="rounded-xl bg-background/50"
                  min="0"
                />
                <p className="text-[10px] text-muted-foreground">Isi 0 jika kelas ini gratis.</p>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="description">Deskripsi Singkat</Label>
                <Textarea
                  id="description"
                  placeholder="Jelaskan secara singkat apa yang akan dipelajari..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="rounded-xl bg-background/50 min-h-[100px]"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="thumbnail">URL Thumbnail (Opsional)</Label>
                <Input
                  id="thumbnail"
                  placeholder="https://..."
                  value={formData.thumbnail}
                  onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                  className="rounded-xl bg-background/50"
                />
              </div>

              <div className="flex items-center justify-between sm:col-span-2 p-4 rounded-xl border bg-muted/20">
                <div className="space-y-0.5">
                  <Label>Publikasikan Kelas</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Jika tidak diaktifkan, kelas akan tersimpan sebagai draft dan tidak terlihat oleh Tenant.
                  </p>
                </div>
                <Switch
                  checked={formData.isPublished}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Link href="/super-admin/academy">
                <Button type="button" variant="ghost" className="rounded-xl">Batal</Button>
              </Link>
              <Button type="submit" disabled={loading} className="rounded-xl gap-2 px-6">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Simpan Kelas
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
