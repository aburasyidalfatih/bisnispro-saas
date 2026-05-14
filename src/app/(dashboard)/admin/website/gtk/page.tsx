"use client"

import { useEffect, useState } from "react"
import { useTenantBranding } from "@/components/providers/tenant-branding-provider"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { toast } from "@/hooks/use-toast"
import { Plus, Trash2, Edit, Users, Image as ImageIcon } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { getStaff, deleteStaff } from "@/lib/actions/staff"

interface Staff {
  id: string
  name: string
  role: string
  bio?: string | null
  imageUrl?: string | null
  sortOrder: number
}

export default function StaffPage() {
  const { branding, isLoadingTenant } = useTenantBranding()
  const [loading, setLoading] = useState(true)
  const [staffList, setStaffList] = useState<Staff[]>([])

  const tenantId = branding.id

  const loadStaff = async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const d = await getStaff(tenantId)
      setStaffList(Array.isArray(d) ? d : [])
    } catch (err: any) {
      toast({ title: "Gagal memuat data", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isLoadingTenant && tenantId) {
      loadStaff()
    }
  }, [tenantId, isLoadingTenant])

  const handleDelete = async (id: string) => {
    if (!tenantId) return
    try {
      await deleteStaff(id, tenantId)
      toast({ title: "Data GTK dihapus" })
      loadStaff()
    } catch (err: any) {
      toast({ title: "Gagal", description: err.message, variant: "destructive" })
    }
  }

  if (loading) return <div className="skeleton h-64 rounded-2xl" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Guru & Tenaga Kependidikan</h1>
          <p className="text-muted-foreground mt-1">Kelola daftar pendidik dan staf sekolah.</p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline" className="gap-2 rounded-xl text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700">
            <Link href="/admin/website/gtk/id-card">
              <Users className="h-4 w-4" /> Cetak ID Card
            </Link>
          </Button>
          <Button asChild className="gap-2 btn-gradient text-white border-0 rounded-xl">
            <Link href="/admin/website/gtk/new">
              <Plus className="h-4 w-4" /> Tambah GTK
            </Link>
          </Button>
        </div>
      </div>

      <Card className="glass border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Daftar GTK</CardTitle>
          <CardDescription className="text-xs">Profil guru dan staf yang akan ditampilkan di website.</CardDescription>
        </CardHeader>
        <CardContent>
          {staffList.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="font-semibold mb-1">Belum ada data GTK</p>
              <p className="text-sm text-muted-foreground mb-4">Tambahkan profil guru pertama Anda.</p>
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/admin/website/gtk/new">Tambah Sekarang</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {staffList.map(person => (
                <Card key={person.id} className="overflow-hidden border group relative">
                  <div className="aspect-[3/4] relative bg-muted flex items-center justify-center">
                    {person.imageUrl ? (
                      <Image src={person.imageUrl} alt={person.name} fill className="object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-10 w-10 text-muted-foreground/50" />
                        <span className="text-[10px] text-muted-foreground">Tanpa Foto</span>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button asChild variant="secondary" size="icon" className="h-8 w-8 rounded-lg shadow-sm">
                        <Link href={`/admin/website/gtk/${person.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <ConfirmDialog
                        trigger={
                          <Button variant="destructive" size="icon" className="h-8 w-8 rounded-lg shadow-sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        }
                        title="Hapus data ini?"
                        description="Data profil GTK akan dihapus secara permanen."
                        confirmText="Ya, hapus"
                        onConfirm={() => handleDelete(person.id)}
                      />
                    </div>
                  </div>
                  <CardContent className="p-3 text-center">
                    <h3 className="font-bold text-sm truncate">{person.name}</h3>
                    <p className="text-[10px] text-primary font-semibold uppercase tracking-wider mt-1">
                      {person.role}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
