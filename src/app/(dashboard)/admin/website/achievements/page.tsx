"use client"

import { useEffect, useState } from"react"
import { useTenantBranding } from"@/components/providers/tenant-branding-provider"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { ConfirmDialog } from"@/components/shared/confirm-dialog"
import { toast } from"@/hooks/use-toast"
import { Plus, Trash2, Edit, Award, Image as ImageIcon, GripVertical, Eye } from"lucide-react"
import Link from"next/link"
import { format } from"date-fns"
import Image from"next/image"
import { getAchievements, deleteAchievement, updateAchievementsOrder } from"@/features/achievement/actions/achievement.action"
import { cn, normalizeImageUrl } from"@/lib/utils"

interface Achievement {
  id: string
  title: string
  description: string | null
  date: Date
  level: string
  type: string
  imageUrl: string | null
  createdAt: Date
}

export default function AchievementsPage() {
  const { branding, isLoadingTenant } = useTenantBranding()
  const [loading, setLoading] = useState(true)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  const tenantId = branding.id

  const loadAchievements = async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const d = await getAchievements(tenantId)
      setAchievements(Array.isArray(d) ? d : [])
    } catch (err: any) {
      toast({ title:"Gagal memuat data", description: err.message, variant:"destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isLoadingTenant && tenantId) {
      loadAchievements()
    }
  }, [tenantId, isLoadingTenant])

  const handleDelete = async (id: string) => {
    if (!tenantId) return
    try {
      await deleteAchievement(id, tenantId)
      toast({ title:"Prestasi dihapus" })
      loadAchievements()
    } catch (err: any) {
      toast({ title:"Gagal", description: err.message, variant:"destructive" })
    }
  }

  const getLevelLabel = (level: string) => {
    switch (level) {
      case"LOKAL": return"Tingkat Lokal / Sekolah"
      case"KABUPATEN": return"Tingkat Kabupaten/Kota"
      case"PROVINSI": return"Tingkat Provinsi"
      case"NASIONAL": return"Tingkat Nasional"
      case"INTERNASIONAL": return"Tingkat Internasional"
      default: return level
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "SISWA": return "Prestasi Siswa"
      case "GURU": return "Prestasi Guru/Staf"
      case "SEKOLAH": return "Prestasi Sekolah"
      default: return type
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

    const newArr = [...achievements]
    const [dragged] = newArr.splice(dragIndex, 1)
    newArr.splice(dropIndex, 0, dragged)
    
    setAchievements(newArr)
    setDragIndex(null)

    if (tenantId) {
      try {
        await updateAchievementsOrder(tenantId, newArr.map(a => a.id))
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
          <h1 className="text-2xl font-bold tracking-tight">Prestasi Sekolah</h1>
          <p className="text-muted-foreground mt-1">Kelola data pencapaian siswa dan sekolah.</p>
        </div>
        <Button asChild className="gap-2 btn-gradient text-white border-0 rounded-xl flex items-center justify-center h-10 px-4">
          <Link href="/admin/website/achievements/new">
            <Plus className="h-4 w-4" /> Tambah Prestasi
          </Link>
        </Button>
      </div>

      <Card className="glass border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Daftar Prestasi</CardTitle>
          <CardDescription className="text-xs">Riwayat prestasi yang akan ditampilkan di website.</CardDescription>
        </CardHeader>
        <CardContent>
          {achievements.length === 0 ? (
            <div className="py-12 text-center">
              <Award className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="font-semibold mb-1">Belum ada data prestasi</p>
              <p className="text-sm text-muted-foreground mb-4">Tambahkan capaian pertama untuk dipamerkan di website.</p>
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/admin/website/achievements/new">Tambah Sekarang</Link>
              </Button>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-4">
                {achievements.length} prestasi · Drag untuk mengubah urutan
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {achievements.map((achievement, i) => (
                <Card key={achievement.id} 
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
                    {achievement.imageUrl ? (
                      <Image src={normalizeImageUrl(achievement.imageUrl)!} alt={achievement.title} fill className="object-cover" />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                    )}
                    {/* Overlay controls */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/60 shadow-sm">
                        <GripVertical className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button asChild variant="secondary" size="icon" className="h-8 w-8 rounded-lg shadow-sm" title="Lihat di website">
                        <a href={`/prestasi`} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button asChild variant="secondary" size="icon" className="h-8 w-8 rounded-lg shadow-sm">
                        <Link href={`/admin/website/achievements/${achievement.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <ConfirmDialog
                        trigger={
                          <Button variant="destructive" size="icon" className="h-8 w-8 rounded-lg shadow-sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        }
                        title="Hapus prestasi ini?"
                        description="Data prestasi akan dihapus secara permanen."
                        confirmText="Ya, hapus"
                        onConfirm={() => handleDelete(achievement.id)}
                      />
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="mb-2 flex flex-wrap gap-1">
                      <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary ring-1 ring-inset ring-primary/20">
                        {getLevelLabel(achievement.level)}
                      </span>
                      <span className="inline-flex items-center rounded-md bg-violet-500/10 px-2 py-1 text-[10px] font-medium text-violet-700 ring-1 ring-inset ring-violet-500/20">
                        {getTypeLabel(achievement.type)}
                      </span>
                    </div>
                    <h3 className="font-semibold truncate">{achievement.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {achievement.description ||"Tidak ada deskripsi"}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-3 font-medium">
                      Diraih pada: {format(new Date(achievement.date), 'dd MMM yyyy')}
                    </p>
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
