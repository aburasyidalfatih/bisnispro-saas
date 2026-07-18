"use client"

import { useEffect, useState } from"react"
import { useTenantBranding } from"@/components/providers/tenant-branding-provider"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { ConfirmDialog } from"@/components/shared/confirm-dialog"
import { toast } from"@/hooks/use-toast"
import { Plus, Trash2, Edit, Image as ImageIcon, GripVertical } from"lucide-react"
import { Switch } from"@/components/ui/switch"
import Link from"next/link"
import Image from"next/image"
import { cn, normalizeImageUrl } from"@/lib/utils"
import { getPartnerships, deletePartnership, togglePartnershipStatus, updatePartnershipsOrder } from"@/features/partnership/actions/partnership.action"

interface Partnership {
  id: string
  name: string
  imageUrl: string
  websiteUrl?: string | null
  isActive: boolean
  sortOrder: number
}

export default function PartnershipsPage() {
  const { branding, isLoadingLembaga } = useTenantBranding()
  const [loading, setLoading] = useState(true)
  const [partnerships, setPartnerships] = useState<Partnership[]>([])
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  const tenantId = branding.id

  const loadData = async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const d = await getPartnerships(tenantId)
      setPartnerships(d)
    } catch (err: any) {
      toast({ title:"Gagal memuat data", description: err.message, variant:"destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isLoadingLembaga && tenantId) {
      loadData()
    }
  }, [tenantId, isLoadingTenant])

  const handleDelete = async (id: string) => {
    if (!tenantId) return
    try {
      await deletePartnership(id, tenantId)
      toast({ title:"Kerjasama dihapus" })
      loadData()
    } catch (err: any) {
      toast({ title:"Gagal", description: err.message, variant:"destructive" })
    }
  }

  const handleToggle = async (id: string, currentStatus: boolean) => {
    if (!tenantId) return
    try {
      await togglePartnershipStatus(id, tenantId, !currentStatus)
      toast({ title: !currentStatus ?"Kerjasama diaktifkan" :"Kerjasama dinonaktifkan" })
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

    const newArr = [...partnerships]
    const [dragged] = newArr.splice(dragIndex, 1)
    newArr.splice(dropIndex, 0, dragged)
    
    setPartnerships(newArr)
    setDragIndex(null)

    if (tenantId) {
      try {
        await updatePartnershipsOrder(tenantId, newArr.map(a => a.id))
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
          <h1 className="text-2xl font-bold tracking-tight">Kerjasama Lembaga</h1>
          <p className="text-muted-foreground mt-1">Kelola logo lembaga/perusahaan yang bekerja sama dengan sekolah.</p>
        </div>
        <Button asChild className="gap-2 btn-gradient text-white border-0 rounded-xl flex items-center justify-center h-10 px-4">
          <Link href="/admin/website/partners/new">
            <Plus className="h-4 w-4" /> Tambah Kerjasama
          </Link>
        </Button>
      </div>

      <Card className="glass border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Daftar Kerjasama</CardTitle>
          <CardDescription className="text-xs">Logo akan tampil di bagian depan website.</CardDescription>
        </CardHeader>
        <CardContent>
          {partnerships.length === 0 ? (
            <div className="py-12 text-center">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="font-semibold mb-1">Belum ada data kerjasama</p>
              <p className="text-sm text-muted-foreground mb-4">Tambahkan logo lembaga atau perusahaan mitra.</p>
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/admin/website/partners/new">Tambah Sekarang</Link>
              </Button>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-4">
                {partnerships.length} kerjasama · Drag untuk mengubah urutan
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {partnerships.map((partner, i) => (
                <Card key={partner.id}
                  draggable
                  onDragStart={e => handleDragStart(e, i)}
                  onDragOver={e => handleDragOver(e, i)}
                  onDrop={e => handleDrop(e, i)}
                  onDragEnd={() => { setDragIndex(null); setDragOver(null) }}
                  className={cn("overflow-hidden border group relative transition-all",
                    dragOver === i &&"ring-2 ring-primary scale-[1.02]",
                    dragIndex === i &&"opacity-50"
                  )}>
                  <div className="aspect-video relative bg-white flex items-center justify-center p-4 cursor-grab active:cursor-grabbing">
                    <Image src={normalizeImageUrl(partner.imageUrl)!} alt={partner.name} fill className="object-contain p-4" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/60 shadow-sm">
                        <GripVertical className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button asChild variant="secondary" size="icon" className="h-8 w-8 rounded-lg shadow-sm">
                        <Link href={`/admin/website/partners/${partner.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <ConfirmDialog
                        trigger={
                          <Button variant="destructive" size="icon" className="h-8 w-8 rounded-lg shadow-sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        }
                        title="Hapus kerjasama ini?"
                        description="Logo akan dihapus secara permanen."
                        confirmText="Ya, hapus"
                        onConfirm={() => handleDelete(partner.id)}
                      />
                    </div>
                  </div>
                  <CardContent className="p-3 border-t">
                    <div className="flex flex-col gap-2">
                      <h3 className="text-sm font-bold truncate">{partner.name}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-medium text-muted-foreground">{partner.isActive ?"Aktif" :"Draft"}</span>
                        <Switch 
                          checked={partner.isActive} 
                          onCheckedChange={() => handleToggle(partner.id, partner.isActive)}
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
