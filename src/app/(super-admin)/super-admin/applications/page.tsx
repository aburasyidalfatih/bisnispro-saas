"use client"

import { useEffect, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { CheckCircle, RefreshCcw, XCircle, Trash2, Mail, Search, MessageSquareOff, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

import { Application } from "./_components/types"
import { ApplicationTable } from "./_components/application-table"
import { ApplicationDetailModal } from "./_components/application-detail-modal"
import { ActionModal, BulkActionModal } from "./_components/action-modals"
import { ServerPagination } from "@/components/shared/server-pagination"

export default function SuperAdminApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [isWaDisabled, setIsWaDisabled] = useState(false)
  const [isAutoApprove24h, setIsAutoApprove24h] = useState(false)
  const [isAutoApproveInstant, setIsAutoApproveInstant] = useState(false)
  
  // Modal states
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [actionModalOpen, setActionModalOpen] = useState(false)
  const [actionType, setActionType] = useState<"APPROVED" | "REVISION" | "REJECTED" | "DELETE" | "RESEND_EMAIL" | null>(null)
  const [adminMessage, setAdminMessage] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)

  // Bulk action states
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkActionModalOpen, setBulkActionModalOpen] = useState(false)
  const [bulkProgress, setBulkProgress] = useState({ total: 0, current: 0, show: false })

  // Search state
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  
  // Pagination state
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const filteredApps = apps

  const fetchApps = (currentPage = page, search = searchQuery, status = statusFilter) => {
    setLoading(true)
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: "20",
      search,
      status
    })
    
    fetch(`/api/super-admin/applications?${params.toString()}`)
      .then(async (r) => {
        const text = await r.text();
        return text ? JSON.parse(text) : [];
      })
      .then((data) => { 
        setApps(Array.isArray(data) ? data : data.data || [])
        setTotalPages(data.totalPages || 1)
        setTotal(data.total || 0)
        setLoading(false) 
      })
      .catch((err) => { console.error(err); setLoading(false); })
  }

  const fetchSettings = () => {
    fetch("/api/super-admin/settings")
      .then(r => r.json())
      .then(data => {
        setIsWaDisabled(data.DISABLE_WA_NOTIFICATION === "true")
        setIsAutoApprove24h(data.AUTO_APPROVE_APPLICATIONS_24H === "true")
        setIsAutoApproveInstant(data.AUTO_APPROVE_APPLICATIONS_INSTANT === "true")
      })
      .catch(console.error)
  }

  useEffect(() => { 
    fetchApps()
    fetchSettings()
  }, [])

  const toggleWa = async () => {
    const newValue = !isWaDisabled
    setIsWaDisabled(newValue) // optimistic update
    try {
      const res = await fetch("/api/super-admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ DISABLE_WA_NOTIFICATION: newValue ? "true" : "false" })
      })
      if (!res.ok) {
        setIsWaDisabled(!newValue)
        toast({ title: "Gagal", description: "Gagal menyimpan pengaturan WA", variant: "destructive" })
      } else {
        toast({ title: "Berhasil", description: newValue ? "Notifikasi WhatsApp dinonaktifkan." : "Notifikasi WhatsApp diaktifkan." })
      }
    } catch {
      setIsWaDisabled(!newValue)
    }
  }

  const toggleAutoApprove = async (type: '24h' | 'instant') => {
    const is24h = type === '24h';
    const newValue = is24h ? !isAutoApprove24h : !isAutoApproveInstant;
    
    // Optimistic update - if turning one on, turn the other off
    if (is24h) {
      setIsAutoApprove24h(newValue);
      if (newValue) setIsAutoApproveInstant(false);
    } else {
      setIsAutoApproveInstant(newValue);
      if (newValue) setIsAutoApprove24h(false);
    }
    
    try {
      const payload: Record<string, string> = {};
      if (is24h) {
        payload.AUTO_APPROVE_APPLICATIONS_24H = newValue ? "true" : "false";
        if (newValue) payload.AUTO_APPROVE_APPLICATIONS_INSTANT = "false";
      } else {
        payload.AUTO_APPROVE_APPLICATIONS_INSTANT = newValue ? "true" : "false";
        if (newValue) payload.AUTO_APPROVE_APPLICATIONS_24H = "false";
      }
      
      const res = await fetch("/api/super-admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        fetchSettings(); // revert
        toast({ title: "Gagal", description: "Gagal menyimpan pengaturan Auto Approve", variant: "destructive" })
      } else {
        toast({ title: "Berhasil", description: `Pengaturan Auto Approve ${type === '24h' ? '24 Jam' : 'Instan'} diperbarui.` })
      }
    } catch {
      fetchSettings(); // revert
    }
  }

  const handleUpdateStatus = async () => {
    if (!actionType || (!selectedApp && selectedIds.length === 0)) return
    
    setIsUpdating(true)
    const isBulk = selectedIds.length > 0 && !selectedApp
    const targetIds = isBulk ? selectedIds : [selectedApp?.id as string]

    try {
      if (isBulk) {
        setBulkProgress({ total: targetIds.length, current: 0, show: true })
        let successCount = 0
        let failCount = 0

        for (let i = 0; i < targetIds.length; i++) {
          const id = targetIds[i]
          try {
            let res;
            if (actionType === "DELETE") {
              res = await fetch("/api/super-admin/applications", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: [id] }),
              })
            } else if (actionType === "RESEND_EMAIL") {
              res = await fetch("/api/super-admin/applications/resend-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
              })
            } else {
              res = await fetch("/api/super-admin/applications", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status: actionType, adminMessage }),
              })
            }

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
        let res;
        const id = targetIds[0]
        if (actionType === "DELETE") {
          res = await fetch("/api/super-admin/applications", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: [id] }),
          })
        } else if (actionType === "RESEND_EMAIL") {
          res = await fetch("/api/super-admin/applications/resend-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
          })
        } else {
          res = await fetch("/api/super-admin/applications", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, status: actionType, adminMessage }),
          })
        }

        if (res.ok) {
          toast({ title: "Berhasil", description: actionType === "DELETE" ? "Pengajuan berhasil dihapus." : actionType === "RESEND_EMAIL" ? "Email sedang dikirim ulang." : `Pengajuan telah di-${actionType.toLowerCase()}.` })
        } else {
          const errorData = await res.json()
          toast({ title: "Error", description: errorData?.error || "Terjadi kesalahan", variant: "destructive" })
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

  const handleResendEmail = async (id: string) => {
    setIsUpdating(true)
    try {
      const res = await fetch("/api/super-admin/applications/resend-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      })
      if (res.ok) {
        toast({ title: "Berhasil", description: "Email sedang dikirim ulang." })
        fetchApps()
      } else {
        const err = await res.json()
        toast({ title: "Error", description: err.error || "Gagal mengirim ulang", variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "Error", description: "Terjadi kesalahan sistem.", variant: "destructive" })
    } finally {
      setIsUpdating(false)
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

  const openActionModal = (app: Application | null, type: "APPROVED" | "REVISION" | "REJECTED" | "DELETE" | "RESEND_EMAIL", isBulk: boolean = false) => {
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
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
            Pengajuan Perusahaan Baru
            <Button 
              variant={isWaDisabled ? "destructive" : "outline"} 
              size="sm" 
              className={cn("h-7 rounded-full text-[10px] px-3 gap-1.5 transition-all ml-2", !isWaDisabled && "border-emerald-200 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 bg-emerald-50/50")}
              onClick={toggleWa}
              title="Klik untuk mengubah pengaturan WA"
            >
              {isWaDisabled ? <MessageSquareOff className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
              {isWaDisabled ? "WA Off (Fast Mode)" : "WA On"}
            </Button>
            <Button 
              variant={isAutoApprove24h ? "outline" : "secondary"} 
              size="sm" 
              className={cn("h-7 rounded-full text-[10px] px-3 gap-1.5 transition-all", isAutoApprove24h && "border-blue-200 text-blue-600 hover:text-blue-700 hover:bg-blue-50 bg-blue-50/50")}
              onClick={() => toggleAutoApprove('24h')}
              title="Setujui otomatis setelah 24 jam"
            >
              <CheckCircle className="h-3 w-3" />
              {isAutoApprove24h ? "Auto Approve (24h) On" : "Auto Approve (24h) Off"}
            </Button>
            <Button 
              variant={isAutoApproveInstant ? "outline" : "secondary"} 
              size="sm" 
              className={cn("h-7 rounded-full text-[10px] px-3 gap-1.5 transition-all", isAutoApproveInstant && "border-purple-200 text-purple-600 hover:text-purple-700 hover:bg-purple-50 bg-purple-50/50")}
              onClick={() => toggleAutoApprove('instant')}
              title="Setujui otomatis seketika dengan verifikasi email"
            >
              <CheckCircle className="h-3 w-3" />
              {isAutoApproveInstant ? "Auto Approve (Instant) On" : "Auto Approve (Instant) Off"}
            </Button>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Validasi dan tinjau pendaftaran tenant dari perusahaan.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Cari nama, email, kota..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setPage(1)
                  fetchApps(1, searchQuery, statusFilter)
                }
              }}
              className="pl-9 h-10 rounded-xl w-full"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => {
            setStatusFilter(value)
            setPage(1)
            fetchApps(1, searchQuery, value)
          }}>
            <SelectTrigger className="w-full sm:w-40 h-10 rounded-xl">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Disetujui</SelectItem>
              <SelectItem value="REVISION">Revisi</SelectItem>
              <SelectItem value="REJECTED">Ditolak</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2 shrink-0 items-center">
            <Badge variant="secondary" className="px-3 py-1 rounded-lg flex items-center">{filteredApps.length} Hasil</Badge>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 px-3 py-1 rounded-lg flex items-center">
              {filteredApps.filter(a => a.status === 'PENDING').length} Perlu Tinjauan
            </Badge>
          </div>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 bg-muted/30 p-3 rounded-2xl border flex-wrap">
          <span className="text-sm font-semibold ml-2">{selectedIds.length} Dipilih</span>
          <Button size="sm" variant="outline" className="h-8 border-emerald-200 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => openActionModal(null, "APPROVED", true)}>
            <CheckCircle className="h-4 w-4 mr-1.5" /> Setujui Masal
          </Button>
          <Button size="sm" variant="outline" className="h-8 border-purple-200 text-purple-600 hover:text-purple-700 hover:bg-purple-50" onClick={() => openActionModal(null, "RESEND_EMAIL", true)} disabled={isUpdating}>
            <Mail className="h-4 w-4 mr-1.5" /> Kirim Ulang Email Masal
          </Button>
          <Button size="sm" variant="outline" className="h-8 border-blue-200 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => openActionModal(null, "REVISION", true)}>
            <RefreshCcw className="h-4 w-4 mr-1.5" /> Revisi Masal
          </Button>
          <Button size="sm" variant="outline" className="h-8 border-rose-200 text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={() => openActionModal(null, "REJECTED", true)}>
            <XCircle className="h-4 w-4 mr-1.5" /> Tolak Masal
          </Button>
          <Button size="sm" variant="outline" className="h-8 border-red-200 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => openActionModal(null, "DELETE", true)}>
            <Trash2 className="h-4 w-4 mr-1.5" /> Hapus Masal
          </Button>
        </div>
      )}

      <ApplicationTable 
        filteredApps={filteredApps}
        selectedIds={selectedIds}
        toggleSelectAll={toggleSelectAll}
        toggleSelect={toggleSelect}
        viewDetail={viewDetail}
        handleResendEmail={handleResendEmail}
        openActionModal={openActionModal}
      />

      <ActionModal 
        open={actionModalOpen}
        setOpen={setActionModalOpen}
        actionType={actionType}
        selectedApp={selectedApp}
        adminMessage={adminMessage}
        setAdminMessage={setAdminMessage}
        isUpdating={isUpdating}
        handleUpdateStatus={handleUpdateStatus}
      />

      <div className="mt-4">
        <ServerPagination page={page} totalPages={totalPages} total={total} onPageChange={(p) => { setPage(p); fetchApps(p, searchQuery, statusFilter); }} />
      </div>

      <BulkActionModal 
        open={bulkActionModalOpen}
        setOpen={setBulkActionModalOpen}
        actionType={actionType}
        selectedIds={selectedIds}
        adminMessage={adminMessage}
        setAdminMessage={setAdminMessage}
        isUpdating={isUpdating}
        bulkProgress={bulkProgress}
        handleUpdateStatus={handleUpdateStatus}
      />

      <ApplicationDetailModal 
        open={detailModalOpen}
        setOpen={setDetailModalOpen}
        selectedApp={selectedApp}
      />
    </div>
  )
}
