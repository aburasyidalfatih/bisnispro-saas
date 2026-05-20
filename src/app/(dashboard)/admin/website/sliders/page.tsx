"use client"

import { useEffect, useState } from "react"
import { useTenantBranding } from "@/components/providers/tenant-branding-provider"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { toast } from "@/hooks/use-toast"
import { Plus, Trash2, Edit, Image as ImageIcon, GripVertical } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import Link from "next/link"
import Image from "next/image"
import { cn, normalizeImageUrl } from "@/lib/utils"
import { getSliders, deleteSlider, toggleSliderStatus, updateSlidersOrder } from "@/features/slider/actions/slider.action"

interface Slider {
  id: string
  title?: string | null
  imageUrl: string
  isActive: boolean
  sortOrder: number
}

export default function SlidersPage() {
  const { branding, isLoadingTenant } = useTenantBranding()
  const [loading, setLoading] = useState(true)
  const [sliders, setSliders] = useState<Slider[]>([])
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  const tenantId = branding.id

  const loadData = async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const d = await getSliders(tenantId)
      setSliders(d)
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
      await deleteSlider(id, tenantId)
      toast({ title: "Slide dihapus" })
      loadData()
    } catch (err: any) {
      toast({ title: "Gagal", description: err.message, variant: "destructive" })
    }
  }

  const handleToggle = async (id: string, currentStatus: boolean) => {
    if (!tenantId) return
    try {
      await toggleSliderStatus(id, tenantId, !currentStatus)
      toast({ title: !currentStatus ? "Slide diaktifkan" : "Slide dinonaktifkan" })
      loadData()
    } catch (err: any) {
      toast({ title: "Gagal", description: err.message, variant: "destructive" })
    }
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOver(index)
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    setDragOver(null)
    if (dragIndex === null || dragIndex === dropIndex) return

    const newArr = [...sliders]
    const [dragged] = newArr.splice(dragIndex, 1)
    newArr.splice(dropIndex, 0, dragged)
    
    setSliders(newArr)
    setDragIndex(null)

    if (tenantId) {
      try {
        await updateSlidersOrder(tenantId, newArr.map(a => a.id))
        toast({ title: "Urutan berhasil disimpan" })
      } catch (err: any) {
        toast({ title: "Gagal menyimpan urutan", description: err.message, variant: "destructive" })
      }
    }
  }

  if (loading) return <div className="skeleton h-64 rounded-2xl" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Slider Beranda</h1>
          <p className="text-muted-foreground mt-1">Kelola gambar besar yang tampil di bagian paling atas beranda.</p>
        </div>
        <Button asChild className="gap-2 btn-gradient text-white border-0 rounded-xl">
          <Link href="/admin/website/sliders/new">
            <Plus className="h-4 w-4" /> Tambah Slide
          </Link>
        </Button>
      </div>

      <Card className="glass border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Daftar Slide</CardTitle>
          <CardDescription className="text-xs">Slide akan tampil berurutan sesuai nomor urut.</CardDescription>
        </CardHeader>
        <CardContent>
          {sliders.length === 0 ? (
            <div className="py-12 text-center">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="font-semibold mb-1">Belum ada slide</p>
              <p className="text-sm text-muted-foreground mb-4">Unggah gambar slide pertama sekolah Anda.</p>
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/admin/website/sliders/new">Unggah Sekarang</Link>
              </Button>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-4">
                {sliders.length} slide · Drag untuk mengubah urutan
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sliders.map((slide, i) => (
                <Card key={slide.id}
                  draggable
                  onDragStart={e => handleDragStart(e, i)}
                  onDragOver={e => handleDragOver(e, i)}
                  onDrop={e => handleDrop(e, i)}
                  onDragEnd={() => { setDragIndex(null); setDragOver(null) }}
                  className={cn(
                    "overflow-hidden border group relative transition-all",
                    dragOver === i && "ring-2 ring-primary scale-[1.02]",
                    dragIndex === i && "opacity-50"
                  )}>
                  <div className="aspect-video relative bg-muted flex items-center justify-center cursor-grab active:cursor-grabbing">
                    <Image src={normalizeImageUrl(slide.imageUrl)!} alt={slide.title || "Slider"} fill className="object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/60 shadow-sm">
                        <GripVertical className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button asChild variant="secondary" size="icon" className="h-8 w-8 rounded-lg shadow-sm">
                        <Link href={`/admin/website/sliders/${slide.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <ConfirmDialog
                        trigger={
                          <Button variant="destructive" size="icon" className="h-8 w-8 rounded-lg shadow-sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        }
                        title="Hapus slide ini?"
                        description="Gambar slide akan dihapus secara permanen."
                        confirmText="Ya, hapus"
                        onConfirm={() => handleDelete(slide.id)}
                      />
                    </div>
                    <div className="absolute bottom-2 left-2 flex items-center gap-2">
                       <span className="bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                         Order: {slide.sortOrder}
                       </span>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold truncate flex-1">{slide.title || "Tanpa Judul"}</h3>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-medium text-muted-foreground">{slide.isActive ? "Aktif" : "Draft"}</span>
                        <Switch 
                          checked={slide.isActive} 
                          onCheckedChange={() => handleToggle(slide.id, slide.isActive)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
