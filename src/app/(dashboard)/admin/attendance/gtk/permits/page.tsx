"use client"

import { useState, useEffect, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Clock, TrendingUp, CalendarCheck, Settings, Download, Search, CheckCircle, XCircle, FileText, Upload, Plus, ExternalLink } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { cn, normalizeImageUrl } from "@/lib/utils"
import Link from "next/link"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

const STATUS_CFG: Record<string, { label: string; badgeCls: string }> = {
  HADIR: { label: "Hadir", badgeCls: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
  IZIN: { label: "Izin", badgeCls: "bg-blue-500/10 text-blue-600 border-blue-200" },
  SAKIT: { label: "Sakit", badgeCls: "bg-amber-500/10 text-amber-600 border-amber-200" },
  ALPHA: { label: "Alpha", badgeCls: "bg-red-500/10 text-red-600 border-red-200" },
  TUGAS_LUAR: { label: "Tugas Luar", badgeCls: "bg-purple-500/10 text-purple-600 border-purple-200" },
  PENDING: { label: "Menunggu", badgeCls: "bg-zinc-500/10 text-zinc-600 border-zinc-200" },
  APPROVED: { label: "Disetujui", badgeCls: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
  REJECTED: { label: "Ditolak", badgeCls: "bg-red-500/10 text-red-600 border-red-200" },
}

export default function GTKPermitsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  
  const [tenant, setTenant] = useState<any>(null)
  const [staffList, setStaffList] = useState<any[]>([])
  
  const [subTab, setSubTab] = useState<"permits" | "logs">("permits")

  // PERMITS STATE
  const [permits, setPermits] = useState<any[]>([])
  const [permitsLoading, setPermitsLoading] = useState(false)
  const [permitsSearch, setPermitsSearch] = useState("")
  
  // LOGS STATE
  const [logsFromDate, setLogsFromDate] = useState(format(new Date(new Date().setDate(1)), "yyyy-MM-dd"))
  const [logsToDate, setLogsToDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [logsRecords, setLogsRecords] = useState<any[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [logsSearch, setLogsSearch] = useState("")

  // MODAL FORM STATE
  const [openModal, setOpenModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    staffId: "",
    type: "IZIN",
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
    reason: "",
    proofUrl: "",
  })

  useEffect(() => {
    fetch("/api/user/tenants")
      .then(r => r.json())
      .then(d => {
        if (d.data?.length > 0) {
          const t = d.data[0].tenant
          setTenant(t)
          fetchStaff(t.id)
        }
      })
  }, [])

  const fetchStaff = async (tenantId: string) => {
    const res = await fetch(`/api/gtk/staff?tenantId=${tenantId}`)
    const d = await res.json()
    setStaffList(d.staff || [])
  }

  const fetchPermits = async () => {
    if (!tenant) return
    setPermitsLoading(true)
    try {
      const res = await fetch(`/api/gtk/attendance/permits?tenantId=${tenant.id}&take=100`)
      const d = await res.json()
      setPermits(d.data || [])
    } finally {
      setPermitsLoading(false)
    }
  }

  const fetchLogs = async () => {
    if (!tenant) return
    setLogsLoading(true)
    try {
      const params = new URLSearchParams({
        tenantId: tenant.id,
        from: logsFromDate,
        to: logsToDate,
        take: "500",
      })
      const res = await fetch(`/api/gtk/attendance?${params}`)
      const data = await res.json()
      setLogsRecords(data.data || [])
    } finally {
      setLogsLoading(false)
    }
  }

  useEffect(() => {
    if (tenant) {
      if (subTab === "permits") fetchPermits()
      else fetchLogs()
    }
  }, [tenant, subTab, logsFromDate, logsToDate])

  const filteredPermits = useMemo(() => {
    return permits.filter(p => 
      p.staff?.name?.toLowerCase().includes(permitsSearch.toLowerCase()) ||
      p.reason?.toLowerCase().includes(permitsSearch.toLowerCase())
    )
  }, [permits, permitsSearch])

  const filteredLogs = useMemo(() => {
    return logsRecords.filter(r => 
      r.staff?.name?.toLowerCase().includes(logsSearch.toLowerCase()) ||
      r.staff?.role?.toLowerCase().includes(logsSearch.toLowerCase())
    )
  }, [logsRecords, logsSearch])

  const handleSubmitPermit = async () => {
    if (!tenant || !form.staffId || !form.reason) {
      return toast({ title: "Lengkapi form terlebih dahulu", variant: "destructive" })
    }
    setSaving(true)
    try {
      const res = await fetch("/api/gtk/attendance/permits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, tenantId: tenant.id }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast({ title: "Pengajuan izin berhasil dibuat!" })
      setOpenModal(false)
      fetchPermits()
    } catch (err: any) {
      toast({ title: "Gagal", description: err.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleReview = async (id: string, status: "APPROVED" | "REJECTED") => {
    if (!tenant) return
    try {
      const res = await fetch(`/api/gtk/attendance/permits/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: tenant.id, status }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast({ title: `Izin berhasil di-${status.toLowerCase()}!` })
      fetchPermits()
    } catch (err: any) {
      toast({ title: "Gagal memproses", description: err.message, variant: "destructive" })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Perizinan Guru & Staf</h1>
          <p className="text-sm text-muted-foreground">Kelola pengajuan surat izin dan riwayat absen.</p>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-border/50 pb-px overflow-x-auto gap-1">
        {[
          { id: "overview", label: "Overview", icon: TrendingUp, href: "/admin/attendance/gtk/overview" },
          { id: "presence", label: "Presensi Harian", icon: CalendarCheck, href: "/admin/attendance/gtk/presence" },
          { id: "permits", label: "Perizinan", icon: FileText, href: "/admin/attendance/gtk/permits" },
          { id: "settings", label: "Pengaturan", icon: Settings, href: "/admin/attendance/gtk/settings" },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = tab.id === "permits"
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition-all border-b-2 -mb-px rounded-t-xl shrink-0",
                isActive ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Link>
          )
        })}
      </div>

      {/* Sub-Tabs */}
      <div className="flex bg-muted/50 p-1 rounded-xl w-fit">
        <button onClick={() => setSubTab("permits")} className={cn("px-4 py-1.5 text-xs font-bold rounded-lg transition-all", subTab === "permits" ? "bg-white dark:bg-zinc-900 shadow text-foreground" : "text-muted-foreground hover:text-foreground")}>Pengajuan Izin</button>
        <button onClick={() => setSubTab("logs")} className={cn("px-4 py-1.5 text-xs font-bold rounded-lg transition-all", subTab === "logs" ? "bg-white dark:bg-zinc-900 shadow text-foreground" : "text-muted-foreground hover:text-foreground")}>Riwayat Log Absen</button>
      </div>

      {/* Permits Section */}
      {subTab === "permits" && (
        <Card className="glass border-0 shadow-sm overflow-hidden">
          <CardHeader className="pb-4 flex flex-row items-center justify-between border-b border-border/50">
            <CardTitle className="text-sm font-bold tracking-tight">Daftar Pengajuan Izin</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Cari nama guru..." value={permitsSearch} onChange={e => setPermitsSearch(e.target.value)} className="pl-9 h-9 text-xs rounded-xl" />
              </div>
              <Button onClick={() => setOpenModal(true)} size="sm" className="h-9 rounded-xl font-semibold gap-1.5 shadow-sm">
                <Plus className="h-4 w-4" /> Buat Pengajuan
              </Button>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-bold uppercase">Guru/Staf</TableHead>
                  <TableHead className="text-xs font-bold uppercase">Tipe</TableHead>
                  <TableHead className="text-xs font-bold uppercase">Tanggal</TableHead>
                  <TableHead className="text-xs font-bold uppercase">Alasan & Bukti</TableHead>
                  <TableHead className="text-xs font-bold uppercase">Status</TableHead>
                  <TableHead className="text-xs font-bold uppercase text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPermits.map(p => {
                  const cfg = STATUS_CFG[p.status] || STATUS_CFG.PENDING
                  const tCfg = STATUS_CFG[p.type] || { label: p.type, badgeCls: "bg-zinc-100 text-zinc-800" }
                  return (
                    <TableRow key={p.id} className="hover:bg-muted/30">
                      <TableCell>
                        <p className="font-bold text-xs">{p.staff?.name}</p>
                        <p className="text-[10px] text-muted-foreground">{p.staff?.role || "-"}</p>
                      </TableCell>
                      <TableCell><Badge className={cn(tCfg.badgeCls, "border text-[10px] shadow-none py-0 px-1.5")}>{tCfg.label}</Badge></TableCell>
                      <TableCell className="text-xs font-mono">
                        {format(new Date(p.startDate), "dd/MM/yyyy")} - {format(new Date(p.endDate), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="text-xs truncate" title={p.reason}>{p.reason}</p>
                        {p.proofUrl && (
                          <a href={normalizeImageUrl(p.proofUrl)} target="_blank" rel="noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-1 mt-1 font-semibold">
                            <ExternalLink className="h-3 w-3" /> Lihat Surat
                          </a>
                        )}
                      </TableCell>
                      <TableCell><Badge className={cn(cfg.badgeCls, "border text-[10px] shadow-none py-0 px-1.5")}>{cfg.label}</Badge></TableCell>
                      <TableCell className="text-right">
                        {p.status === "PENDING" ? (
                          <div className="flex items-center justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={() => handleReview(p.id, "APPROVED")} className="h-7 w-7 text-emerald-600 hover:bg-emerald-50"><CheckCircle className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => handleReview(p.id, "REJECTED")} className="h-7 w-7 text-red-600 hover:bg-red-50"><XCircle className="h-4 w-4" /></Button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic">Selesai</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
                {filteredPermits.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">Belum ada pengajuan izin.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Logs Section */}
      {subTab === "logs" && (
        <Card className="glass border-0 shadow-sm overflow-hidden">
          <CardHeader className="pb-4 flex flex-col md:flex-row items-start md:items-center justify-between border-b border-border/50 gap-4">
            <CardTitle className="text-sm font-bold tracking-tight">Riwayat Log Absen</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Input type="date" value={logsFromDate} onChange={e => setLogsFromDate(e.target.value)} className="h-9 text-xs rounded-xl w-32" />
              <span className="text-xs text-muted-foreground">s/d</span>
              <Input type="date" value={logsToDate} onChange={e => setLogsToDate(e.target.value)} className="h-9 text-xs rounded-xl w-32" />
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Cari..." value={logsSearch} onChange={e => setLogsSearch(e.target.value)} className="pl-9 h-9 text-xs rounded-xl" />
              </div>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-bold uppercase">Tanggal</TableHead>
                  <TableHead className="text-xs font-bold uppercase">Guru/Staf</TableHead>
                  <TableHead className="text-xs font-bold uppercase">Status</TableHead>
                  <TableHead className="text-xs font-bold uppercase">Masuk</TableHead>
                  <TableHead className="text-xs font-bold uppercase">Pulang</TableHead>
                  <TableHead className="text-xs font-bold uppercase">Catatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map(r => {
                  const cfg = STATUS_CFG[r.status] || STATUS_CFG.HADIR
                  return (
                    <TableRow key={r.id} className="hover:bg-muted/30">
                      <TableCell className="text-xs font-mono">{format(new Date(r.date), "dd/MM/yyyy")}</TableCell>
                      <TableCell>
                        <p className="font-bold text-xs">{r.staff?.name}</p>
                        <p className="text-[10px] text-muted-foreground">{r.staff?.role || "-"}</p>
                      </TableCell>
                      <TableCell><Badge className={cn(cfg.badgeCls, "border text-[10px] shadow-none py-0 px-1.5")}>{cfg.label}</Badge></TableCell>
                      <TableCell className="text-xs font-mono">{r.checkInAt ? format(new Date(r.checkInAt), "HH:mm") : "-"}</TableCell>
                      <TableCell className="text-xs font-mono">{r.checkOutAt ? format(new Date(r.checkOutAt), "HH:mm") : "-"}</TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">{r.notes || "-"}</TableCell>
                    </TableRow>
                  )
                })}
                {filteredLogs.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">Tidak ada riwayat log.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="max-w-md rounded-2xl glass border-zinc-200/50 dark:border-zinc-800/50 shadow-2xl p-0 overflow-hidden">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 pb-4">
            <DialogHeader>
              <DialogTitle className="text-xl font-black flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Buat Pengajuan Izin
              </DialogTitle>
            </DialogHeader>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Guru / Staf</label>
              <Select value={form.staffId} onValueChange={v => setForm({ ...form, staffId: v })}>
                <SelectTrigger className="rounded-xl text-sm h-11"><SelectValue placeholder="Pilih Guru/Staf" /></SelectTrigger>
                <SelectContent>
                  {staffList.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Jenis Izin</label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                <SelectTrigger className="rounded-xl text-sm h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="IZIN">Izin</SelectItem>
                  <SelectItem value="SAKIT">Sakit</SelectItem>
                  <SelectItem value="TUGAS_LUAR">Tugas Luar / Dinas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Dari Tgl</label>
                <Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="rounded-xl h-11" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sampai Tgl</label>
                <Input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="rounded-xl h-11" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Alasan / Keterangan</label>
              <Textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} className="rounded-xl resize-none" rows={3} placeholder="Jelaskan alasan izin..." />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">URL Surat Bukti (Opsional)</label>
              <Input value={form.proofUrl} onChange={e => setForm({ ...form, proofUrl: e.target.value })} placeholder="Link Google Drive / Upload file" className="rounded-xl h-11" />
              <p className="text-[10px] text-muted-foreground">Isi dengan link file bukti surat dokter atau surat tugas jika ada.</p>
            </div>
          </div>
          <div className="p-4 bg-muted/30 border-t flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpenModal(false)} className="rounded-xl font-semibold">Batal</Button>
            <Button onClick={handleSubmitPermit} disabled={saving} className="rounded-xl font-bold shadow-md">{saving ? "Menyimpan..." : "Simpan Pengajuan"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
