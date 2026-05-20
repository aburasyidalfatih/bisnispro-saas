"use client"

import { useEffect, useState } from "react"
import { useTenantBranding } from "@/components/providers/tenant-branding-provider"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { toast } from "@/hooks/use-toast"
import { Plus, Trash2, Edit, Building2, Image as ImageIcon } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import Image from "next/image"
import { getFacilities, deleteFacility as deleteFacilityAction } from "@/features/facility/actions/facility.action"
import { normalizeImageUrl } from "@/lib/utils"

interface Facility {
  id: string
  name: string
  description?: string | null
  imageUrl?: string | null
  category?: string | null
  condition?: string | null
  access?: string | null
  createdAt: string
}

export default function FacilitiesPage() {
  const { branding, isLoadingTenant } = useTenantBranding()
  const [loading, setLoading] = useState(true)
  const [facilities, setFacilities] = useState<Facility[]>([])

  const tenantId = branding.id

  const loadFacilities = () => {
    if (!tenantId) return
    setLoading(true)
    getFacilities(tenantId)
      .then(d => {
        // Parse dates safely since Server Actions pass date objects down if not careful, but Prisma dates are serializable.
        // Or if it causes issue we map it. 
        setFacilities(Array.isArray(d) ? d.map(f => ({...f, createdAt: new Date(f.createdAt).toISOString()})) : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    if (!isLoadingTenant && tenantId) {
      loadFacilities()
    }
  }, [tenantId, isLoadingTenant])

  const deleteFacility = async (id: string) => {
    if (!tenantId) return
    try {
      await deleteFacilityAction(id, tenantId)
      toast({ title: "Fasilitas dihapus" })
      loadFacilities()
    } catch (err: any) {
      toast({ title: "Gagal menghapus", description: err.message || "", variant: "destructive" })
    }
  }

  if (loading) return <div className="skeleton h-64 rounded-2xl" />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fasilitas Sekolah</h1>
          <p className="text-muted-foreground mt-1">Kelola data sarana dan prasarana yang dimiliki institusi.</p>
        </div>
        <Button asChild className="gap-2 btn-gradient text-white border-0 rounded-xl">
          <Link href="/admin/website/facilities/new">
            <Plus className="h-4 w-4" /> Tambah Fasilitas
          </Link>
        </Button>
      </div>

      <Card className="glass border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Daftar Fasilitas</CardTitle>
          <CardDescription className="text-xs">Fasilitas yang akan ditampilkan di halaman website publik.</CardDescription>
        </CardHeader>
        <CardContent>
          {facilities.length === 0 ? (
            <div className="py-12 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="font-semibold mb-1">Belum ada data fasilitas</p>
              <p className="text-sm text-muted-foreground mb-4">Tambahkan fasilitas pertama Anda untuk ditampilkan di website.</p>
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/admin/website/facilities/new">Tambah Sekarang</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {facilities.map(facility => {
                const displayImage = normalizeImageUrl(facility.imageUrl)
                return (
                  <Card key={facility.id} className="overflow-hidden border group relative">
                    <div className="aspect-video relative bg-muted flex items-center justify-center">
                      {displayImage ? (
                        <Image src={displayImage} alt={facility.name} fill className="object-cover" unoptimized />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                      )}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button asChild variant="secondary" size="icon" className="h-8 w-8 rounded-lg shadow-sm">
                        <Link href={`/admin/website/facilities/${facility.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <ConfirmDialog
                        trigger={
                          <Button variant="destructive" size="icon" className="h-8 w-8 rounded-lg shadow-sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        }
                        title="Hapus fasilitas ini?"
                        description="Data fasilitas akan dihapus secara permanen."
                        confirmText="Ya, hapus"
                        onConfirm={() => deleteFacility(facility.id)}
                      />
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold truncate">{facility.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {facility.description || "Tidak ada deskripsi"}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-3">
                      Ditambahkan pada {format(new Date(facility.createdAt), 'dd MMM yyyy')}
                    </p>
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
