"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { 
  CheckCircle, XCircle, Clock, RefreshCcw, 
  School, Mail, Phone, MapPin, Landmark, Hash, Globe, ChevronLeft 
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Application {
  id: string
  schoolName: string
  schoolSlug: string
  npsn: string
  schoolStatus: string
  province: string
  regency: string
  adminName: string
  adminEmail: string
  adminPhone: string
  address: string
  status: string
  adminMessage: string
  createdAt: string
  logo?: string | null
}

export default function SuperAdminApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [adminMessage, setAdminMessage] = useState("")

  const fetchApps = () => {
    fetch("/api/super-admin/applications")
      .then((r) => r.json())
      .then((data) => { setApps(data); setLoading(false) })
  }

  useEffect(() => { fetchApps() }, [])

  const handleUpdateStatus = async (id: string, status: string) => {
    const res = await fetch("/api/super-admin/applications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, adminMessage }),
    })

    if (res.ok) {
      toast({ title: "Berhasil", description: `Pengajuan telah di-${status.toLowerCase()}.` })
      setAdminMessage("")
      setSelectedApp(null)
      fetchApps()
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING": return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1"><Clock className="h-3 w-3" /> Pending</Badge>
      case "APPROVED": return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1"><CheckCircle className="h-3 w-3" /> Disetujui</Badge>
      case "REVISION": return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 gap-1"><RefreshCcw className="h-3 w-3" /> Revisi</Badge>
      case "REJECTED": return <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20 gap-1"><XCircle className="h-3 w-3" /> Ditolak</Badge>
      default: return <Badge>{status}</Badge>
    }
  }

  if (loading) return <div className="skeleton h-96 rounded-2xl" />

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Pengajuan Sekolah Baru</h1>
          <p className="text-muted-foreground mt-1 text-sm">Validasi dan tinjau pendaftaran tenant dari sekolah.</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="px-3 py-1 rounded-lg">{apps.length} Total Pengajuan</Badge>
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 px-3 py-1 rounded-lg">
            {apps.filter(a => a.status === 'PENDING').length} Perlu Tinjauan
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* List Card */}
        <div className="lg:col-span-2 space-y-3">
          {apps.length === 0 && (
            <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed">
              <p className="text-muted-foreground">Belum ada data pendaftaran.</p>
            </div>
          )}
          {apps.map((app) => (
            <Card 
              key={app.id} 
              className={cn(
                "glass border-0 cursor-pointer transition-all duration-300 hover:scale-[1.01]",
                selectedApp?.id === app.id ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/30"
              )}
              onClick={() => { setSelectedApp(app); setAdminMessage(app.adminMessage || "") }}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl overflow-hidden",
                    app.logo ? "bg-white border" : (app.schoolStatus === 'NEGERI' ? "bg-blue-500/10 text-blue-500" : "bg-primary/10 text-primary")
                  )}>
                    {app.logo ? (
                      <img src={app.logo} alt={app.schoolName} className="h-full w-full object-contain p-1" />
                    ) : (
                      <School className="h-6 w-6" />
                    )}
                  </div>
                  <div className="space-y-1 overflow-hidden">
                    <h3 className="font-bold text-sm leading-none truncate">{app.schoolName}</h3>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground uppercase font-semibold">
                      <span className="flex items-center gap-1"><Hash className="h-3 w-3" /> {app.npsn}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {app.regency}, {app.province}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {getStatusBadge(app.status)}
                  <span className="text-[10px] text-muted-foreground">{new Date(app.createdAt).toLocaleDateString('id-ID')}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Panel Detail */}
        <div className="space-y-6">
          {selectedApp ? (
            <Card className="glass border-0 sticky top-6 overflow-hidden">
              <div className={cn(
                "h-1.5 w-full",
                selectedApp.schoolStatus === 'NEGERI' ? "bg-blue-500" : "bg-primary"
              )} />
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  Detail Pendaftaran
                </CardTitle>
                <CardDescription>ID Pengajuan: {selectedApp.id.slice(-8).toUpperCase()}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Data Sekolah */}
                <div className="grid gap-3">
                  <div className="p-3 rounded-2xl bg-muted/50 border space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl overflow-hidden",
                          selectedApp.logo ? "bg-white border" : (selectedApp.schoolStatus === 'NEGERI' ? "bg-blue-500/10 text-blue-500" : "bg-primary/10 text-primary")
                        )}>
                          {selectedApp.logo ? (
                            <img src={selectedApp.logo} alt={selectedApp.schoolName} className="h-full w-full object-contain p-0.5" />
                          ) : (
                            <School className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">Institusi</p>
                          <p className="font-bold text-sm">{selectedApp.schoolName}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{selectedApp.schoolStatus}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">NPSN</p>
                        <p className="text-xs font-medium">{selectedApp.npsn}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Subdomain</p>
                        <p className="text-xs font-medium text-primary underline">{selectedApp.schoolSlug}.schoolpro.id</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Alamat & Lokasi</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {selectedApp.address}, {selectedApp.regency}, {selectedApp.province}
                      </p>
                    </div>
                  </div>

                  {/* Data Admin */}
                  <div className="p-3 rounded-2xl bg-primary/5 border border-primary/10 space-y-3">
                    <div>
                      <p className="text-[10px] font-bold text-primary uppercase">Penanggung Jawab</p>
                      <p className="font-bold text-sm">{selectedApp.adminName}</p>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3 text-primary" /> {selectedApp.adminEmail}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3 text-primary" /> {selectedApp.adminPhone}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tindakan */}
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Catatan / Alasan</Label>
                    <Textarea 
                      value={adminMessage} 
                      onChange={(e) => setAdminMessage(e.target.value)}
                      placeholder="Tulis alasan jika ditolak atau revisi..." 
                      className="rounded-xl min-h-[80px] text-xs bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      className="rounded-xl h-10 text-xs border-rose-200 text-rose-600 hover:bg-rose-50"
                      onClick={() => handleUpdateStatus(selectedApp.id, "REJECTED")}
                    >
                      Tolak
                    </Button>
                    <Button 
                      variant="outline" 
                      className="rounded-xl h-10 text-xs border-blue-200 text-blue-600 hover:bg-blue-50"
                      onClick={() => handleUpdateStatus(selectedApp.id, "REVISION")}
                    >
                      Revisi
                    </Button>
                    <Button 
                      className="col-span-2 rounded-xl h-11 btn-gradient text-white border-0 font-bold"
                      onClick={() => handleUpdateStatus(selectedApp.id, "APPROVED")}
                    >
                      Setujui & Aktifkan Sekolah
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="h-[400px] flex flex-col items-center justify-center text-center p-8 bg-muted/10 rounded-3xl border-2 border-dashed">
              <div className="h-16 w-16 bg-muted/20 rounded-full flex items-center justify-center mb-4">
                <ChevronLeft className="h-8 w-8 text-muted-foreground opacity-20" />
              </div>
              <h4 className="font-bold text-muted-foreground">Pilih Pengajuan</h4>
              <p className="text-xs text-muted-foreground max-w-[200px] mt-1">Klik pada salah satu kartu di samping untuk melihat detail pendaftaran.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
