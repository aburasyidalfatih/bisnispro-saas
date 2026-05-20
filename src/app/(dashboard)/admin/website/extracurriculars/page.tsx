"use client"

import { useEffect, useState } from "react"
import { useTenantBranding } from "@/components/providers/tenant-branding-provider"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { toast } from "@/hooks/use-toast"
import { Plus, Trash2, Edit, Trophy, Image as ImageIcon } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { getExtracurriculars, deleteExtracurricular } from "@/features/extracurricular/actions/extracurricular.action"
import { normalizeImageUrl } from "@/lib/utils"

interface Extracurricular {
  id: string
  name: string
  description?: string | null
  schedule?: string | null
  imageUrl?: string | null
}

export default function ExtracurricularPage() {
  const { branding, isLoadingTenant } = useTenantBranding()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<Extracurricular[]>([])

  const tenantId = branding.id

  const loadData = async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const d = await getExtracurriculars(tenantId)
      setItems(Array.isArray(d) ? d : [])
    } catch (err: any) {
      toast({ title: "Gagal memuat data", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isLoadingTenant && tenantId) {
      loadData()
    }
  }, [tenantId, isLoadingTenant])

  const handleDelete = async (id: string) => {
    if (!tenantId) return
    try {
      await deleteExtracurricular(id, tenantId)
      toast({ title: "Ekstrakurikuler dihapus" })
      loadData()
    } catch (err: any) {
      toast({ title: "Gagal", description: err.message, variant: "destructive" })
    }
  }

  if (loading) return <div className="skeleton h-64 rounded-2xl" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ekstrakurikuler</h1>
          <p className="text-muted-foreground mt-1">Kelola daftar kegiatan pengembangan diri siswa.</p>
        </div>
        <Button asChild className="gap-2 btn-gradient text-white border-0 rounded-xl">
          <Link href="/admin/website/extracurriculars/new">
            <Plus className="h-4 w-4" /> Tambah Ekskul
          </Link>
        </Button>
      </div>

      <Card className="glass border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Daftar Ekstrakurikuler</CardTitle>
          <CardDescription className="text-xs">Kegiatan ekskul yang akan ditampilkan di website.</CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="py-12 text-center">
              <Trophy className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="font-semibold mb-1">Belum ada data ekskul</p>
              <p className="text-sm text-muted-foreground mb-4">Tambahkan kegiatan ekskul pertama sekolah Anda.</p>
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/admin/website/extracurriculars/new">Tambah Sekarang</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map(item => {
                const displayImage = normalizeImageUrl(item.imageUrl)
                return (
                  <Card key={item.id} className="overflow-hidden border group relative">
                    <div className="aspect-video relative bg-muted flex items-center justify-center">
                      {displayImage ? (
                        <Image src={displayImage} alt={item.name} fill className="object-cover" />
                      ) : (
                        <Trophy className="h-10 w-10 text-muted-foreground/50" />
                      )}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button asChild variant="secondary" size="icon" className="h-8 w-8 rounded-lg shadow-sm">
                        <Link href={`/admin/website/extracurriculars/${item.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <ConfirmDialog
                        trigger={
                          <Button variant="destructive" size="icon" className="h-8 w-8 rounded-lg shadow-sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        }
                        title="Hapus ekskul ini?"
                        description="Data kegiatan ekstrakurikuler akan dihapus secara permanen."
                        confirmText="Ya, hapus"
                        onConfirm={() => handleDelete(item.id)}
                      />
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold truncate">{item.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {item.description || "Tidak ada deskripsi"}
                    </p>
                    {item.schedule && (
                      <div className="mt-3 inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium text-primary border border-primary/20">
                        🕒 {item.schedule}
                      </div>
                    )}
                  </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
