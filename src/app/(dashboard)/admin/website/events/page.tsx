"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { useEffect, useState } from"react"
import { useTenantBranding } from"@/components/providers/tenant-branding-provider"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { ConfirmDialog } from"@/components/shared/confirm-dialog"
import { toast } from"@/hooks/use-toast"
import { Plus, Edit2, Trash2, Calendar, MapPin, Eye } from"lucide-react"
import Link from"next/link"
import { format } from"date-fns"

interface Event {
  id: string
  title: string
  location?: string
  startDate: string
  endDate: string
}

export default function EventsPage() {
  const { branding, isLoadingTenant } = useTenantBranding()
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<Event[]>([])

  const tenantId = branding.id

  const loadEvents = () => {
    if (!tenantId) return
    setLoading(true)
    fetch(`/api/tenant/events?tenantId=${tenantId}`)
      .then(r => r.json())
      .then(d => {
        setEvents(Array.isArray(d) ? d : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    if (!isLoadingTenant && tenantId) {
      loadEvents()
    }
  }, [tenantId, isLoadingTenant])

  const deleteEvent = async (id: string) => {
    if (!tenantId) return
    try {
      const res = await fetch(`/api/tenant/events/${id}?tenantId=${tenantId}`, { method:"DELETE" })
      if (res.ok) {
        toast({ title:"Acara dihapus" })
        loadEvents()
      } else {
        const d = await res.json()
        toast({ title:"Gagal", description: d.error, variant:"destructive" })
      }
    } catch {
      toast({ title:"Gagal menghapus", variant:"destructive" })
    }
  }

  if (loading) return <div className="skeleton h-64 rounded-2xl" />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agenda & Acara</h1>
          <p className="text-muted-foreground mt-1">Kelola kalender acara dan kegiatan sekolah.</p>
        </div>
        <Button asChild className="gap-2 btn-gradient text-white border-0 rounded-xl">
          <Link href="/admin/website/events/new">
            <Plus className="h-4 w-4" /> Buat Acara Baru
          </Link>
        </Button>
      </div>

      <Card className="glass border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Daftar Acara</CardTitle>
          <CardDescription className="text-xs">Agenda kegiatan yang akan atau telah berlangsung.</CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="font-semibold mb-1">Belum ada acara</p>
              <p className="text-sm text-muted-foreground mb-4">Tambahkan acara baru ke dalam kalender sekolah.</p>
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/admin/website/events/new">Tambah Sekarang</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-4 py-3 font-medium rounded-tl-lg">Judul Acara</TableHead>
                    <TableHead className="px-4 py-3 font-medium">Tanggal</TableHead>
                    <TableHead className="px-4 py-3 font-medium">Lokasi</TableHead>
                    <TableHead className="px-4 py-3 font-medium text-right rounded-tr-lg">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map(event => (
                    <TableRow key={event.id} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                      <TableCell className="px-4 py-3">
                        <div className="font-medium text-foreground">{event.title}</div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="text-xs">
                          {format(new Date(event.startDate), 'dd MMM yyyy HH:mm')} - 
                          <br/>{format(new Date(event.endDate), 'dd MMM yyyy HH:mm')}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-muted-foreground">
                        {event.location ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {event.location}
                          </div>
                        ) :"-"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-blue-500/10 hover:text-blue-600" title="Lihat di website">
                            <a href={`/agenda`} target="_blank" rel="noopener noreferrer">
                              <Eye className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10 hover:text-primary">
                            <Link href={`/admin/website/events/${event.id}`}>
                              <Edit2 className="h-4 w-4" />
                            </Link>
                          </Button>
                          <ConfirmDialog
                            trigger={
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            }
                            title="Hapus acara ini?"
                            description="Tindakan ini tidak dapat dibatalkan."
                            confirmText="Ya, hapus"
                            onConfirm={() => deleteEvent(event.id)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
