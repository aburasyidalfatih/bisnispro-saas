"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"
import { 
  CheckCircle, XCircle, Clock, RefreshCcw, Trash2,
  School, Mail, Phone, MapPin, Landmark, Hash, Globe, ChevronLeft, MoreHorizontal, CheckSquare, Square, Eye, ShieldCheck, User, Search
} from "lucide-react"
import { cn } from "@/lib/utils"
import { checkDataCompleteness, type CompletenessLevel } from "@/lib/utils/data-completeness"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog"

interface Application {
  id: string
  schoolName: string
  schoolSlug: string
  npsn: string
  schoolStatus: string
  province: string
  regency: string
  adminName: string
  adminPosition?: string | null
  adminEmail: string
  adminPhone: string
  address: string
  status: string
  adminMessage: string
  createdAt: string
  updatedAt: string
  logo?: string | null
  studentCount?: number
  affiliate?: { user: { name: string } } | null
}

export default function SuperAdminApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  
  // Modal states
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [actionModalOpen, setActionModalOpen] = useState(false)
  const [actionType, setActionType] = useState<"APPROVED" | "REVISION" | "REJECTED" | "DELETE" | null>(null)
  const [adminMessage, setAdminMessage] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)

  // Bulk action states
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkActionModalOpen, setBulkActionModalOpen] = useState(false)
  const [bulkProgress, setBulkProgress] = useState({ total: 0, current: 0, show: false })

  // Search state
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")

  const filteredApps = useMemo(() => {
    let result = apps
    
    if (statusFilter !== "ALL") {
      result = result.filter(app => app.status === statusFilter)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(app => 
        app.schoolName.toLowerCase().includes(query) ||
        app.adminEmail.toLowerCase().includes(query) ||
        (app.regency && app.regency.toLowerCase().includes(query)) ||
        (app.province && app.province.toLowerCase().includes(query))
      )
    }
    
    return result
  }, [apps, searchQuery, statusFilter])

  const fetchApps = () => {
    fetch("/api/super-admin/applications")
      .then(async (r) => {
        const text = await r.text();
        return text ? JSON.parse(text) : [];
      })
      .then((data) => { setApps(data); setLoading(false) })
      .catch((err) => { console.error(err); setLoading(false); })
  }

  useEffect(() => { fetchApps() }, [])

  const handleUpdateStatus = async () => {
    if (!actionType || (!selectedApp && selectedIds.length === 0)) return
    
    setIsUpdating(true)
    const isBulk = selectedIds.length > 0 && !selectedApp

    try {
      if (actionType === "DELETE") {
        const res = await fetch("/api/super-admin/applications", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: isBulk ? selectedIds : [selectedApp?.id] }),
        })

        if (res.ok) {
          toast({ title: "Berhasil", description: "Pengajuan berhasil dihapus." })
          setSelectedApp(null)
          setActionModalOpen(false)
          setBulkActionModalOpen(false)
          if (isBulk) setSelectedIds([])
          fetchApps()
        } else {
          const errorData = await res.json()
          toast({ title: "Error", description: errorData.error || "Terjadi kesalahan", variant: "destructive" })
        }
        return
      }

      const targetIds = isBulk ? selectedIds : [selectedApp?.id as string]
      
      if (isBulk) {
        setBulkProgress({ total: targetIds.length, current: 0, show: true })
        let successCount = 0
        let failCount = 0

        for (let i = 0; i < targetIds.length; i++) {
          const id = targetIds[i]
          try {
            const res = await fetch("/api/super-admin/applications", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id, status: actionType, adminMessage }),
            })
            if (res.ok) successCount++
            else failCount++
          } catch (e) {
            failCount++
          }
          setBulkProgress(prev => ({ ...prev, current: i + 1 }))
        }

        toast({ 
          title: "Proses Masal Selesai", 
          description: `${successCount} berhasil, ${failCount} gagal.` 
        })
      } else {
        const res = await fetch("/api/super-admin/applications", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: targetIds[0], status: actionType, adminMessage }),
        })

        if (res.ok) {
          toast({ title: "Berhasil", description: `Pengajuan telah di-${actionType.toLowerCase()}.` })
        } else {
          const errorData = await res.json()
          toast({ title: "Error", description: errorData.error || "Terjadi kesalahan", variant: "destructive" })
        }
      }

      setAdminMessage("")
      setSelectedApp(null)
      setActionModalOpen(false)
      setBulkActionModalOpen(false)
      if (isBulk) {
        setSelectedIds([])
        setBulkProgress({ total: 0, current: 0, show: false })
      }
      fetchApps()
    } catch (error) {
      toast({ title: "Error", description: "Gagal memproses permintaan.", variant: "destructive" })
    } finally {
      setIsUpdating(false)
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

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredApps.length && filteredApps.length > 0) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredApps.map(a => a.id))
    }
  }

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  const openActionModal = (app: Application | null, type: "APPROVED" | "REVISION" | "REJECTED" | "DELETE", isBulk: boolean = false) => {
    setActionType(type)
    setAdminMessage(app?.adminMessage || "")
    if (!isBulk) {
      setSelectedApp(app)
      setActionModalOpen(true)
    } else {
      setSelectedApp(null)
      setBulkActionModalOpen(true)
    }
  }

  const viewDetail = (app: Application) => {
    setSelectedApp(app)
    setDetailModalOpen(true)
  }

  if (loading) return <div className="skeleton h-96 rounded-2xl" />

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Pengajuan Sekolah Baru</h1>
          <p className="text-muted-foreground mt-1 text-sm">Validasi dan tinjau pendaftaran tenant dari sekolah.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Cari nama, email, kota..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 rounded-xl w-full"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex h-10 w-full sm:w-40 items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="ALL">Semua Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Disetujui</option>
            <option value="REVISION">Revisi</option>
            <option value="REJECTED">Ditolak</option>
          </select>
          <div className="flex gap-2 shrink-0 items-center">
            <Badge variant="secondary" className="px-3 py-1 rounded-lg flex items-center">{filteredApps.length} Hasil</Badge>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 px-3 py-1 rounded-lg flex items-center">
              {filteredApps.filter(a => a.status === 'PENDING').length} Perlu Tinjauan
            </Badge>
          </div>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 bg-muted/30 p-3 rounded-2xl border">
          <span className="text-sm font-semibold ml-2">{selectedIds.length} Dipilih</span>
          <Button size="sm" variant="outline" className="h-8 border-emerald-200 text-emerald-600 hover:bg-emerald-50" onClick={() => openActionModal(null, "APPROVED", true)}>
            <CheckCircle className="h-4 w-4 mr-1.5" /> Setujui Masal
          </Button>
          <Button size="sm" variant="outline" className="h-8 border-blue-200 text-blue-600 hover:bg-blue-50" onClick={() => openActionModal(null, "REVISION", true)}>
            <RefreshCcw className="h-4 w-4 mr-1.5" /> Revisi Masal
          </Button>
          <Button size="sm" variant="outline" className="h-8 border-rose-200 text-rose-600 hover:bg-rose-50" onClick={() => openActionModal(null, "REJECTED", true)}>
            <XCircle className="h-4 w-4 mr-1.5" /> Tolak Masal
          </Button>
          <Button size="sm" variant="outline" className="h-8 border-red-200 text-red-600 hover:bg-red-50" onClick={() => openActionModal(null, "DELETE", true)}>
            <Trash2 className="h-4 w-4 mr-1.5" /> Hapus Masal
          </Button>
        </div>
      )}

      <Card className="glass border-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b">
              <tr>
                <th className="px-4 py-3 w-10 text-center">
                  <input 
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 accent-primary"
                    checked={filteredApps.length > 0 && selectedIds.length === filteredApps.length} 
                    onChange={toggleSelectAll} 
                  />
                </th>
                <th className="px-4 py-3 font-semibold">Tenant (Sekolah)</th>
                <th className="px-4 py-3 font-semibold">Penanggungjawab</th>
                <th className="px-4 py-3 font-semibold">Kota / Provinsi</th>
                <th className="px-4 py-3 font-semibold text-center">Jml. Siswa</th>
                <th className="px-4 py-3 font-semibold">Affiliator</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredApps.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-muted-foreground">Belum ada data pendaftaran yang sesuai pencarian.</td>
                </tr>
              )}
              {filteredApps.map((app) => (
                <tr key={app.id} className={cn("hover:bg-muted/10 transition-colors", selectedIds.includes(app.id) && "bg-muted/30")}>
                  <td className="px-4 py-4 text-center">
                    <input 
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 accent-primary"
                      checked={selectedIds.includes(app.id)} 
                      onChange={() => toggleSelect(app.id)} 
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 bg-white border rounded-xl flex items-center justify-center overflow-hidden relative">
                        {app.logo ? <img src={app.logo} alt="Logo" className="object-contain p-0.5" /> : <School className="h-5 w-5 text-muted-foreground" />}
                        {(() => {
                          const result = checkDataCompleteness(app)
                          const color = result.level === 'complete' ? 'bg-emerald-500' : result.level === 'location' ? 'bg-amber-500' : 'bg-rose-500'
                          return <span className={`absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${color}`} title={result.level === 'complete' ? 'Data Lengkap' : result.level === 'location' ? 'Lokasi tidak cocok dataset' : `Kurang: ${result.missingFields.join(', ')}`} />
                        })()}
                      </div>
                      <div>
                        <p className="font-bold">{app.schoolName}</p>
                        <p className="text-[10px] text-muted-foreground">Subdomain: <span className="text-primary">{app.schoolSlug}.schoolpro.id</span></p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-medium">{app.adminName}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Phone className="h-3 w-3" /> {app.adminPhone}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-medium">{app.regency}</p>
                    <p className="text-xs text-muted-foreground">{app.province}</p>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="font-semibold">{app.studentCount ? app.studentCount.toLocaleString('id-ID') : '-'}</span>
                  </td>
                  <td className="px-4 py-4">
                    {app.affiliate ? (
                      <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md w-fit">
                        <User className="h-3 w-3" /> {app.affiliate.user.name}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {getStatusBadge(app.status)}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Tindakan</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => viewDetail(app)}>
                          <Eye className="h-4 w-4 mr-2 text-primary" /> Lihat Detail
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => openActionModal(app, "APPROVED")}>
                          <CheckCircle className="h-4 w-4 mr-2 text-emerald-500" /> Setujui
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openActionModal(app, "REVISION")}>
                          <RefreshCcw className="h-4 w-4 mr-2 text-blue-500" /> Revisi
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openActionModal(app, "REJECTED")} className="text-rose-600">
                          <XCircle className="h-4 w-4 mr-2" /> Tolak
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => openActionModal(app, "DELETE")} className="text-red-600 focus:text-red-700 focus:bg-red-50">
                          <Trash2 className="h-4 w-4 mr-2" /> Hapus Pengajuan
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Action Dialog (Single) */}
      <Dialog open={actionModalOpen} onOpenChange={setActionModalOpen}>
        <DialogContent className="glass border-0">
          <DialogHeader>
            <DialogTitle>
              {actionType === "APPROVED" ? "Setujui Pendaftaran" : actionType === "REVISION" ? "Minta Revisi" : actionType === "DELETE" ? "Hapus Pengajuan" : "Tolak Pendaftaran"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "DELETE" 
                ? "Apakah Anda yakin ingin menghapus pengajuan ini? Data yang dihapus tidak dapat dikembalikan."
                : `Tindakan ini akan mengirimkan notifikasi ke email `}
              {actionType !== "DELETE" && <strong className="text-primary">{selectedApp?.adminEmail}</strong>}
            </DialogDescription>
          </DialogHeader>
          {(actionType === "REVISION" || actionType === "REJECTED") && (
            <div className="space-y-3 py-4">
              <Label>Alasan {actionType === "REVISION" ? "Revisi" : "Penolakan"} (Wajib)</Label>
              <Textarea 
                placeholder="Tulis alasan secara detail agar sekolah dapat memperbaikinya..." 
                value={adminMessage}
                onChange={(e) => setAdminMessage(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionModalOpen(false)}>Batal</Button>
            <Button 
              className={cn(
                actionType === "APPROVED" ? "bg-emerald-500 hover:bg-emerald-600" : actionType === "REVISION" ? "bg-blue-500 hover:bg-blue-600" : "bg-rose-500 hover:bg-rose-600",
                "text-white"
              )}
              onClick={handleUpdateStatus}
              disabled={isUpdating || ((actionType === "REVISION" || actionType === "REJECTED") && !adminMessage.trim())}
            >
              {isUpdating ? "Memproses..." : actionType === "DELETE" ? "Ya, Hapus" : "Konfirmasi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Action Dialog */}
      <Dialog open={bulkActionModalOpen} onOpenChange={setBulkActionModalOpen}>
        <DialogContent className="glass border-0">
          <DialogHeader>
            <DialogTitle>
              Konfirmasi Masal: {actionType === "APPROVED" ? "Setujui" : actionType === "REVISION" ? "Revisi" : actionType === "DELETE" ? "Hapus" : "Tolak"} ({selectedIds.length} Sekolah)
            </DialogTitle>
            <DialogDescription>
              {actionType === "DELETE" 
                ? `Apakah Anda yakin ingin menghapus ${selectedIds.length} pengajuan secara permanen?`
                : `Tindakan ini akan diproses untuk seluruh ${selectedIds.length} pengajuan yang dipilih secara masal.`}
            </DialogDescription>
          </DialogHeader>
          
          {bulkProgress.show ? (
            <div className="py-8 space-y-4">
              <div className="flex justify-between text-sm font-medium">
                <span>Memproses...</span>
                <span>{bulkProgress.current} / {bulkProgress.total}</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-primary h-full transition-all duration-300 ease-out"
                  style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">Mohon jangan tutup jendela ini hingga proses selesai.</p>
            </div>
          ) : (
            <>
              {(actionType === "REVISION" || actionType === "REJECTED") && (
                <div className="space-y-3 py-4">
                  <Label>Alasan (Akan dikirim ke semua)</Label>
                  <Textarea 
                    placeholder="Tulis alasan..." 
                    value={adminMessage}
                    onChange={(e) => setAdminMessage(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setBulkActionModalOpen(false)} disabled={isUpdating}>Batal</Button>
                <Button 
                  className={cn(
                    actionType === "APPROVED" ? "bg-emerald-500 hover:bg-emerald-600" : actionType === "REVISION" ? "bg-blue-500 hover:bg-blue-600" : "bg-rose-500 hover:bg-rose-600",
                    "text-white"
                  )}
                  onClick={handleUpdateStatus}
                  disabled={isUpdating || ((actionType === "REVISION" || actionType === "REJECTED") && !adminMessage.trim())}
                >
                  {isUpdating ? "Memproses..." : actionType === "DELETE" ? "Ya, Hapus Masal" : "Proses Masal"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* View Detail Dialog */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-3xl glass border-0 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Pendaftaran Tenant</DialogTitle>
            <DialogDescription>Data lengkap pengajuan operasional platform.</DialogDescription>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-6 py-4">
              {/* Header with Logo & Status */}
              <div className="flex items-center gap-4 bg-muted/20 p-4 rounded-xl border">
                <div className="h-16 w-16 shrink-0 bg-white border rounded-xl flex items-center justify-center overflow-hidden">
                  {selectedApp.logo ? <img src={selectedApp.logo} alt="Logo" className="object-contain p-1 w-full h-full" /> : <School className="h-8 w-8 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg truncate">{selectedApp.schoolName}</h3>
                  <p className="text-sm text-muted-foreground truncate">
                    https://{selectedApp.schoolSlug}.schoolpro.id
                  </p>
                </div>
                <div>{getStatusBadge(selectedApp.status)}</div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Informasi Sekolah */}
                <div className="space-y-4">
                  <h4 className="font-bold border-b pb-2 flex items-center gap-2"><School className="h-4 w-4" /> Informasi Sekolah</h4>
                  <div className="grid grid-cols-2 gap-y-3 text-sm">
                    <div className="text-muted-foreground">Nama Sekolah</div>
                    <div className="font-medium">{selectedApp.schoolName}</div>
                    
                    <div className="text-muted-foreground">Status Lembaga</div>
                    <div className="font-medium">{selectedApp.schoolStatus || '-'}</div>
                    
                    <div className="text-muted-foreground">NPSN</div>
                    <div className="font-medium">{selectedApp.npsn || '-'}</div>
                    
                    <div className="text-muted-foreground">Subdomain</div>
                    <div className="font-medium text-primary">{selectedApp.schoolSlug}.schoolpro.id</div>

                    <div className="text-muted-foreground">Jumlah Siswa</div>
                    <div className="font-medium">{selectedApp.studentCount ? selectedApp.studentCount.toLocaleString('id-ID') : '-'}</div>
                  </div>
                </div>

                {/* Lokasi */}
                <div className="space-y-4">
                  <h4 className="font-bold border-b pb-2 flex items-center gap-2"><MapPin className="h-4 w-4" /> Lokasi</h4>
                  <div className="grid grid-cols-2 gap-y-3 text-sm">
                    <div className="text-muted-foreground">Provinsi</div>
                    <div className="font-medium">{selectedApp.province || '-'}</div>

                    <div className="text-muted-foreground">Kabupaten/Kota</div>
                    <div className="font-medium">{selectedApp.regency || '-'}</div>

                    <div className="text-muted-foreground col-span-2 mt-1">Alamat Lengkap</div>
                    <div className="col-span-2 font-medium bg-muted/20 p-2 rounded-lg text-xs leading-relaxed">
                      {selectedApp.address || '-'}
                    </div>
                  </div>
                </div>

                {/* Penanggung Jawab */}
                <div className="space-y-4">
                  <h4 className="font-bold border-b pb-2 flex items-center gap-2"><User className="h-4 w-4" /> Penanggung Jawab</h4>
                  <div className="grid grid-cols-2 gap-y-3 text-sm">
                    <div className="text-muted-foreground">Nama Admin</div>
                    <div className="font-medium">{selectedApp.adminName}</div>
                    
                    <div className="text-muted-foreground">Jabatan</div>
                    <div className="font-medium">{selectedApp.adminPosition || '-'}</div>
                    
                    <div className="text-muted-foreground">Email</div>
                    <div className="font-medium truncate">{selectedApp.adminEmail}</div>
                    
                    <div className="text-muted-foreground">WhatsApp</div>
                    <div className="font-medium">{selectedApp.adminPhone}</div>
                  </div>
                </div>

                {/* Metadata */}
                <div className="space-y-4">
                  <h4 className="font-bold border-b pb-2 flex items-center gap-2"><Clock className="h-4 w-4" /> Metadata</h4>
                  <div className="grid grid-cols-2 gap-y-3 text-sm">
                    <div className="text-muted-foreground">Tanggal Daftar</div>
                    <div className="font-medium">{new Date(selectedApp.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>

                    <div className="text-muted-foreground">Terakhir Diperbarui</div>
                    <div className="font-medium">{selectedApp.updatedAt ? new Date(selectedApp.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</div>

                    {selectedApp.affiliate && (
                      <>
                        <div className="text-muted-foreground">Affiliator</div>
                        <div className="font-bold text-emerald-600 flex items-center gap-1.5">
                          <User className="h-3 w-3" /> {selectedApp.affiliate.user.name}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Admin Message (Catatan Revisi/Penolakan) */}
              {selectedApp.adminMessage && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 space-y-1">
                  <h5 className="font-bold text-sm flex items-center gap-2">
                    <RefreshCcw className="h-4 w-4" /> Catatan Admin
                  </h5>
                  <p className="text-sm leading-relaxed">{selectedApp.adminMessage}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
