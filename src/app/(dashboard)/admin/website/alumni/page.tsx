"use client"

import { useEffect, useState } from"react"
import { useTenantBranding } from"@/components/providers/tenant-branding-provider"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { ConfirmDialog } from"@/components/shared/confirm-dialog"
import { toast } from"@/hooks/use-toast"
import { Plus, Trash2, Edit, GraduationCap, Quote, User, GripVertical, Eye } from"lucide-react"
import Link from"next/link"
import Image from"next/image"
import { getAlumni, deleteAlumni, updateAlumniOrder } from"@/features/alumni/actions/alumni.action"
import { cn, normalizeImageUrl } from"@/lib/utils"

interface Alumni {
  id: string
  name: string
  graduationYear: number
  currentStatus: string
  institutionName?: string | null
  testimonial?: string | null
  imageUrl?: string | null
}

export default function AlumniPage() {
  const { branding, isLoadingTenant } = useTenantBranding()
  const [loading, setLoading] = useState(true)
  const [alumniList, setAlumniList] = useState<Alumni[]>([])
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  const tenantId = branding.id

  const loadData = async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const d = await getAlumni(tenantId)
      setAlumniList(Array.isArray(d) ? d : [])
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
      await deleteAlumni(id, tenantId)
      toast({ title:"Data alumni dihapus" })
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

    const newArr = [...alumniList]
    const [dragged] = newArr.splice(dragIndex, 1)
    newArr.splice(dropIndex, 0, dragged)
    
    setAlumniList(newArr)
    setDragIndex(null)

    if (tenantId) {
      try {
        await updateAlumniOrder(tenantId, newArr.map(a => a.id))
        toast({ title:"Urutan berhasil disimpan" })
      } catch (err: any) {
        toast({ title:"Gagal menyimpan urutan", description: err.message, variant:"destructive" })
      }
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case"KULIAH": return"Kuliah"
      case"KERJA": return"Bekerja"
      case"WIRAUSAHA": return"Wirausaha"
      case"MENCARI_KERJA": return"Mencari Kerja"
      default: return status
    }
  }

  if (loading) return <div className="skeleton h-64 rounded-2xl" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Database Alumni & Testimonial</h1>
          <p className="text-muted-foreground mt-1">Kelola data lulusan dan testimoni sukses mereka.</p>
        </div>
        <Button asChild className="gap-2 btn-gradient text-white border-0 rounded-xl">
          <Link href="/admin/website/alumni/new">
            <Plus className="h-4 w-4" /> Tambah Alumni
          </Link>
        </Button>
      </div>

      <Card className="glass border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Daftar Alumni</CardTitle>
          <CardDescription className="text-xs">Alumni yang datanya akan dikelola dan ditampilkan testimoni-nya.</CardDescription>
        </CardHeader>
        <CardContent>
          {alumniList.length === 0 ? (
            <div className="py-12 text-center">
              <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="font-semibold mb-1">Belum ada data alumni</p>
              <p className="text-sm text-muted-foreground mb-4">Tambahkan data alumni pertama sekolah Anda.</p>
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/admin/website/alumni/new">Tambah Sekarang</Link>
              </Button>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-4">
                {alumniList.length} alumni · Drag untuk mengubah urutan
              </p>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {alumniList.map((alumni, i) => (
                <Card key={alumni.id}
                  draggable
                  onDragStart={e => handleDragStart(e, i)}
                  onDragOver={e => handleDragOver(e, i)}
                  onDrop={e => handleDrop(e, i)}
                  onDragEnd={() => { setDragIndex(null); setDragOver(null) }}
                  className={cn("overflow-hidden border group relative hover:shadow-md transition-all cursor-grab active:cursor-grabbing",
                    dragOver === i &&"ring-2 ring-primary scale-[1.02]",
                    dragIndex === i &&"opacity-50"
                  )}>
                  <div className="p-4 flex gap-4">
                    <div className="flex items-center mr-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="h-16 w-16 rounded-full overflow-hidden bg-muted shrink-0 relative flex items-center justify-center">
                      {alumni.imageUrl ? (
                        <Image src={normalizeImageUrl(alumni.imageUrl)!} alt={alumni.name} fill className="object-cover" />
                      ) : (
                        <User className="h-8 w-8 text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-sm truncate">{alumni.name}</h3>
                        <div className="flex gap-1">
                          <Button asChild variant="ghost" size="icon" className="h-7 w-7 rounded-md text-muted-foreground hover:text-blue-600" title="Lihat di website">
                            <a href={`/alumni`} target="_blank" rel="noopener noreferrer">
                              <Eye className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                          <Button asChild variant="ghost" size="icon" className="h-7 w-7 rounded-md">
                            <Link href={`/admin/website/alumni/${alumni.id}/edit`}>
                              <Edit className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                          <ConfirmDialog
                            trigger={
                              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md text-destructive hover:text-destructive">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            }
                            title="Hapus alumni ini?"
                            description="Data alumni dan testimoninya akan dihapus permanen."
                            confirmText="Ya, hapus"
                            onConfirm={() => handleDelete(alumni.id)}
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-medium">Lulusan Tahun {alumni.graduationYear}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary">
                          {getStatusLabel(alumni.currentStatus)}
                        </span>
                        {alumni.institutionName && (
                          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[9px] font-medium text-muted-foreground truncate max-w-[120px]">
                            @ {alumni.institutionName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {alumni.testimonial && (
                    <div className="px-4 pb-4 pt-0">
                      <div className="bg-muted/30 rounded-xl p-3 relative">
                        <Quote className="h-3 w-3 text-primary/30 absolute top-2 left-2" />
                        <p className="text-[11px] text-muted-foreground italic leading-relaxed pl-4 line-clamp-3">
                          {alumni.testimonial}
                        </p>
                      </div>
                    </div>
                  )}
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
