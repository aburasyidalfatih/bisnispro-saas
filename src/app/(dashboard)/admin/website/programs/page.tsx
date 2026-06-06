"use client"

import { useEffect, useState } from"react"
import { useTenantBranding } from"@/components/providers/tenant-branding-provider"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { ConfirmDialog } from"@/components/shared/confirm-dialog"
import { toast } from"@/hooks/use-toast"
import { Plus, Trash2, Edit, GraduationCap, Image as ImageIcon, GripVertical, Eye } from"lucide-react"
import Link from"next/link"
import Image from"next/image"
import { getPrograms, deleteProgram, updateProgramsOrder } from"@/features/program/actions/program.action"
import { cn, normalizeImageUrl } from"@/lib/utils"

interface Program {
  id: string
  name: string
  description?: string | null
  imageUrl?: string | null
}

export default function ProgramsPage() {
  const { branding, isLoadingTenant } = useTenantBranding()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<Program[]>([])
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  const tenantId = branding.id

  const loadData = async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const d = await getPrograms(tenantId)
      setItems(Array.isArray(d) ? d : [])
    } catch (err: any) {
      toast({ title:"Gagal memuat data", description: err.message, variant:"destructive" })
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
      await deleteProgram(id, tenantId)
      toast({ title:"Program dihapus" })
      loadData()
    } catch (err: any) {
      toast({ title:"Gagal", description: err.message, variant:"destructive" })
    }
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index)
    e.dataTransfer.effectAllowed ="move"
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOver(index)
    e.dataTransfer.dropEffect ="move"
  }

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    setDragOver(null)
    if (dragIndex === null || dragIndex === dropIndex) return

    const newArr = [...items]
    const [dragged] = newArr.splice(dragIndex, 1)
    newArr.splice(dropIndex, 0, dragged)
    
    setItems(newArr)
    setDragIndex(null)

    if (tenantId) {
      try {
        await updateProgramsOrder(tenantId, newArr.map(a => a.id))
        toast({ title:"Urutan berhasil disimpan" })
      } catch (err: any) {
        toast({ title:"Gagal menyimpan urutan", description: err.message, variant:"destructive" })
      }
    }
  }

  if (loading) return <div className="skeleton h-64 rounded-2xl" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Program Unggulan</h1>
          <p className="text-muted-foreground mt-1">Kelola daftar program studi atau jurusan di sekolah.</p>
        </div>
        <Button asChild className="gap-2 btn-gradient text-white border-0 rounded-xl flex items-center justify-center h-10 px-4">
          <Link href="/admin/website/programs/new">
            <Plus className="h-4 w-4" /> Tambah Program
          </Link>
        </Button>
      </div>

      <Card className="glass border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Daftar Program</CardTitle>
          <CardDescription className="text-xs">Program atau jurusan yang akan ditampilkan di website.</CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="py-12 text-center">
              <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="font-semibold mb-1">Belum ada data program</p>
              <p className="text-sm text-muted-foreground mb-4">Tambahkan program studi atau jurusan pertama sekolah Anda.</p>
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/admin/website/programs/new">Tambah Sekarang</Link>
              </Button>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-4">
                {items.length} program · Drag untuk mengubah urutan
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item, i) => {
                const displayImage = normalizeImageUrl(item.imageUrl)
                return (
                  <Card key={item.id}
                    draggable
                    onDragStart={e => handleDragStart(e, i)}
                    onDragOver={e => handleDragOver(e, i)}
                    onDrop={e => handleDrop(e, i)}
                    onDragEnd={() => { setDragIndex(null); setDragOver(null) }}
                    className={cn("overflow-hidden border group relative transition-all",
                      dragOver === i &&"ring-2 ring-primary scale-[1.02]",
                      dragIndex === i &&"opacity-50"
                    )}>
                    <div className="aspect-video relative bg-muted flex items-center justify-center cursor-grab active:cursor-grabbing">
                      {displayImage ? (
                        <Image src={displayImage} alt={item.name} fill className="object-cover" />
                      ) : (
                        <GraduationCap className="h-10 w-10 text-muted-foreground/50" />
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/60 shadow-sm">
                          <GripVertical className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button asChild variant="secondary" size="icon" className="h-8 w-8 rounded-lg shadow-sm" title="Lihat di website">
                        <a href={`/program`} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button asChild variant="secondary" size="icon" className="h-8 w-8 rounded-lg shadow-sm">
                        <Link href={`/admin/website/programs/${item.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <ConfirmDialog
                        trigger={
                          <Button variant="destructive" size="icon" className="h-8 w-8 rounded-lg shadow-sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        }
                        title="Hapus program ini?"
                        description="Data program/jurusan akan dihapus secara permanen."
                        confirmText="Ya, hapus"
                        onConfirm={() => handleDelete(item.id)}
                      />
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold truncate">{item.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {item.description ||"Tidak ada deskripsi"}
                    </p>
                  </CardContent>
                </Card>
              )
              })}
            </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
