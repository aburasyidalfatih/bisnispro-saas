"use client"

import { useEffect, useState } from"react"
import { useTenantBranding } from"@/components/providers/tenant-branding-provider"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { ConfirmDialog } from"@/components/shared/confirm-dialog"
import { toast } from"@/hooks/use-toast"
import { Plus, Trash2, Edit, Megaphone, MonitorPlay } from"lucide-react"
import { Switch } from"@/components/ui/switch"
import Link from"next/link"
import { getPopups, deletePopup, togglePopupStatus } from"@/features/popup/actions/popup.action"

interface Popup {
  id: string
  title: string
  isActive: boolean
  createdAt: Date
}

export default function PopupsPage() {
  const { branding, isLoadingLembaga } = useTenantBranding()
  const [loading, setLoading] = useState(true)
  const [popups, setPopups] = useState<Popup[]>([])

  const tenantId = branding.id

  const loadData = async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const d = await getPopups(tenantId)
      setPopups(d)
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
      await deletePopup(id, tenantId)
      toast({ title:"Popup dihapus" })
      loadData()
    } catch (err: any) {
      toast({ title:"Gagal", description: err.message, variant:"destructive" })
    }
  }

  const handleToggle = async (id: string, currentStatus: boolean) => {
    if (!tenantId) return
    try {
      await togglePopupStatus(id, tenantId, !currentStatus)
      toast({ title: !currentStatus ?"Popup diaktifkan" :"Popup dinonaktifkan" })
      loadData()
    } catch (err: any) {
      toast({ title:"Gagal", description: err.message, variant:"destructive" })
    }
  }

  if (loading) return <div className="skeleton h-64 rounded-2xl" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sistem Popup Pengumuman</h1>
          <p className="text-muted-foreground mt-1">Kelola banner modal yang muncul saat website dibuka.</p>
        </div>
        <Button asChild className="gap-2 btn-gradient text-white border-0 rounded-xl flex items-center justify-center h-10 px-4">
          <Link href="/admin/website/popups/new">
            <Plus className="h-4 w-4" /> Buat Popup Baru
          </Link>
        </Button>
      </div>

      <Card className="glass border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Daftar Popup</CardTitle>
          <CardDescription className="text-xs">Hanya satu popup yang bisa aktif dalam satu waktu.</CardDescription>
        </CardHeader>
        <CardContent>
          {popups.length === 0 ? (
            <div className="py-12 text-center">
              <Megaphone className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="font-semibold mb-1">Belum ada popup</p>
              <p className="text-sm text-muted-foreground mb-4">Buat pengumuman modal pertama Anda.</p>
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/admin/website/popups/new">Buat Sekarang</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {popups.map(popup => (
                <div key={popup.id} className="flex items-center justify-between p-4 rounded-xl border bg-card/50 hover:bg-accent/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${popup.isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      <MonitorPlay className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">{popup.title}</h3>
                      <p className="text-[10px] text-muted-foreground">Dibuat pada {new Date(popup.createdAt).toLocaleDateString('id-ID')}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-muted-foreground">{popup.isActive ?"Aktif" :"Draft"}</span>
                      <Switch 
                        checked={popup.isActive} 
                        onCheckedChange={() => handleToggle(popup.id, popup.isActive)}
                      />
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                        <Link href={`/admin/website/popups/${popup.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <ConfirmDialog
                        trigger={
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        }
                        title="Hapus popup ini?"
                        description="Data popup akan dihapus secara permanen."
                        confirmText="Ya, hapus"
                        onConfirm={() => handleDelete(popup.id)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
