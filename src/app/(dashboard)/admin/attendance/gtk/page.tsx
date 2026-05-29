"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Users, CalendarCheck, CheckCircle, XCircle, Clock,
  Minus, Loader2, MapPin, LogIn, LogOut, Search, Edit2,
  Download, TrendingUp, Filter
} from "lucide-react"
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { cn, normalizeImageUrl } from "@/lib/utils"

const STATUS_CFG: Record<string, { label: string; color: string; badgeCls: string }> = {
  HADIR: { label: "Hadir", color: "text-emerald-600", badgeCls: "bg-emerald-500/10 text-emerald-600 border-emerald-300" },
  IZIN: { label: "Izin", color: "text-blue-600", badgeCls: "bg-blue-500/10 text-blue-600 border-blue-300" },
  SAKIT: { label: "Sakit", color: "text-amber-600", badgeCls: "bg-amber-500/10 text-amber-600 border-amber-300" },
  ALPHA: { label: "Alpha", color: "text-red-600", badgeCls: "bg-red-500/10 text-red-600 border-red-300" },
}

type StaffRecord = {
  id: string; date: string; status: string
  checkInAt?: string; checkOutAt?: string
  checkInLat?: number; checkInLng?: number; notes?: string
  staff: { id: string; name: string; role: string; imageUrl?: string }
}

export default function AdminGTKAttendancePage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const tenant = session?.user?.tenants?.[0]

  const [records, setRecords] = useState<StaffRecord[]>([])
  const [staffList, setStaffList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [staffFilter, setStaffFilter] = useState("all")
  const [monthOffset, setMonthOffset] = useState(0) // 0 = bulan ini
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 })
  const [page, setPage] = useState(1)
  const [showManual, setShowManual] = useState(false)
  const [manualForm, setManualForm] = useState({ staffId: "", date: format(new Date(), "yyyy-MM-dd"), status: "HADIR", notes: "" })
  const [saving, setSaving] = useState(false)

  const targetMonth = subMonths(new Date(), monthOffset)
  const fromDate = format(startOfMonth(targetMonth), "yyyy-MM-dd")
  const toDate = format(endOfMonth(targetMonth), "yyyy-MM-dd")

  const fetchRecords = async () => {
    if (!tenant) return
    setLoading(true)
    const params = new URLSearchParams({
      tenantId: tenant.id, from: fromDate, to: toDate, take: "100", page: String(page),
      ...(staffFilter !== "all" ? { staffId: staffFilter } : {}),
    })
    const res = await fetch(`/api/gtk/attendance?${params}`)
    const data = await res.json()
    setRecords(data.data || [])
    setMeta(data.meta || { total: 0, totalPages: 1 })
    setLoading(false)
  }

  useEffect(() => {
    if (!tenant) return
    fetch(`/api/gtk/staff?tenantId=${tenant.id}`)
      .then(r => r.json())
      .then(d => setStaffList(d.staff || []))
      .catch(console.error)
  }, [tenant])

  useEffect(() => { fetchRecords() }, [tenant, staffFilter, monthOffset, page])

  // Aggregate per staff
  const staffSummary = staffList.map(s => {
    const staffRecs = records.filter(r => r.staff?.id === s.id)
    return {
      ...s,
      hadir: staffRecs.filter(r => r.status === "HADIR").length,
      izin: staffRecs.filter(r => r.status === "IZIN").length,
      sakit: staffRecs.filter(r => r.status === "SAKIT").length,
      alpha: staffRecs.filter(r => r.status === "ALPHA").length,
      total: staffRecs.length,
      lastRecord: staffRecs[0],
    }
  })

  const globalSummary = {
    HADIR: records.filter(r => r.status === "HADIR").length,
    IZIN: records.filter(r => r.status === "IZIN").length,
    SAKIT: records.filter(r => r.status === "SAKIT").length,
    ALPHA: records.filter(r => r.status === "ALPHA").length,
  }

  const handleManualSave = async () => {
    if (!tenant || !manualForm.staffId) return toast({ title: "Pilih guru terlebih dahulu", variant: "destructive" })
    setSaving(true)
    try {
      const res = await fetch("/api/gtk/attendance/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: tenant.id, ...manualForm }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast({ title: "Absensi berhasil disimpan!" })
      setShowManual(false)
      fetchRecords()
    } catch (err: any) {
      toast({ title: "Gagal", description: err.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleExportCSV = () => {
    const headers = ["Nama Guru/Staf", "Jabatan", "Hadir", "Izin", "Sakit", "Alpha", "Total", "Kehadiran %"]
    const rows = staffSummary.map(s => {
      const percentage = s.total > 0 ? Math.round((s.hadir / s.total) * 100) : 0;
      return [
        `"${s.name}"`, 
        `"${s.role || "-"}"`, 
        s.hadir, s.izin, s.sakit, s.alpha, s.total, `${percentage}%`
      ]
    })
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n")
      
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `Laporan_Kehadiran_GTK_${format(targetMonth, "MMM_yyyy", { locale: localeId })}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Absensi Guru & Staf</h1>
          <p className="text-sm text-muted-foreground">Monitor kehadiran dengan rekap bulanan.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl gap-2 hidden sm:flex" onClick={handleExportCSV}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button variant="outline" className="rounded-xl gap-2 hidden sm:flex" onClick={() => setShowManual(!showManual)}>
            <Edit2 className="h-4 w-4" /> Input Manual
          </Button>
        </div>
      </div>

      {/* Filter Bulan */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setMonthOffset(m => m + 1)}>←</Button>
        <span className="font-bold text-sm px-3">{format(targetMonth, "MMMM yyyy", { locale: localeId })}</span>
        <Button variant="outline" size="sm" className="rounded-xl" disabled={monthOffset === 0} onClick={() => setMonthOffset(m => m - 1)}>→</Button>
        {monthOffset > 0 && <Button size="sm" variant="ghost" className="rounded-xl text-xs" onClick={() => setMonthOffset(0)}>Bulan Ini</Button>}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { key: "HADIR", icon: CheckCircle },
          { key: "IZIN", icon: Clock },
          { key: "SAKIT", icon: Minus },
          { key: "ALPHA", icon: XCircle },
        ].map(({ key, icon: Icon }) => (
          <Card key={key} className="glass border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", STATUS_CFG[key].badgeCls)}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{STATUS_CFG[key].label}</p>
                <p className={cn("font-black text-2xl", STATUS_CFG[key].color)}>
                  {globalSummary[key as keyof typeof globalSummary]}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Input Manual Form */}
      {showManual && (
        <Card className="glass border-0 border-primary/20">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Input Absensi Manual</CardTitle></CardHeader>
          <CardContent className="grid md:grid-cols-4 gap-4">
            <Select value={manualForm.staffId} onValueChange={v => setManualForm(f => ({ ...f, staffId: v }))}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih guru/staf..." /></SelectTrigger>
              <SelectContent>
                {staffList.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" value={manualForm.date} onChange={e => setManualForm(f => ({ ...f, date: e.target.value }))} className="rounded-xl" />
            <Select value={manualForm.status} onValueChange={v => setManualForm(f => ({ ...f, status: v }))}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_CFG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input value={manualForm.notes} onChange={e => setManualForm(f => ({ ...f, notes: e.target.value }))} placeholder="Catatan..." className="rounded-xl flex-1" />
              <Button onClick={handleManualSave} disabled={saving} className="rounded-xl shrink-0">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter Staff */}
      <div className="flex gap-3 items-center">
        <Select value={staffFilter} onValueChange={v => { setStaffFilter(v); setPage(1) }}>
          <SelectTrigger className="w-52 rounded-xl glass border-0">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Semua Guru" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Guru & Staf</SelectItem>
            {staffList.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">{meta.total} rekord ditemukan</p>
      </div>

      {/* Rekap Per Guru */}
      {staffFilter === "all" && (
        <Card className="glass border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Rekap Per Guru — {format(targetMonth, "MMMM yyyy", { locale: localeId })}</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  {["Nama", "Jabatan", "Hadir", "Izin", "Sakit", "Alpha", "% Hadir", "Terakhir"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {staffSummary.map(s => {
                  const pct = s.total > 0 ? Math.round((s.hadir / s.total) * 100) : 0
                  return (
                    <tr key={s.id} className="hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-xl overflow-hidden bg-primary/10 shrink-0">
                            {s.imageUrl ? <img src={normalizeImageUrl(s.imageUrl)} alt={s.name} className="h-full w-full object-cover" /> : (
                              <div className="h-full w-full flex items-center justify-center font-bold text-primary text-xs">{s.name.charAt(0)}</div>
                            )}
                          </div>
                          <p className="font-semibold">{s.name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{s.role}</td>
                      <td className="px-4 py-3 font-bold text-emerald-600">{s.hadir}</td>
                      <td className="px-4 py-3 font-bold text-blue-600">{s.izin}</td>
                      <td className="px-4 py-3 font-bold text-amber-600">{s.sakit}</td>
                      <td className="px-4 py-3 font-bold text-red-600">{s.alpha}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-muted rounded-full h-1.5 min-w-[40px]">
                            <div className={cn("h-full rounded-full", pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs font-bold w-8 text-right">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {s.lastRecord ? format(new Date(s.lastRecord.date), "d MMM", { locale: localeId }) : "—"}
                      </td>
                    </tr>
                  )
                })}
                {staffSummary.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-12 text-muted-foreground text-sm">Tidak ada rekord absensi bulan ini.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Detail Records */}
      {staffFilter !== "all" && (
        <Card className="glass border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Detail Rekord Absensi</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : records.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">Tidak ada rekord untuk periode ini.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    {["Tanggal", "Guru", "Check-In", "Check-Out", "GPS", "Status", "Catatan"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {records.map(r => {
                    const cfg = STATUS_CFG[r.status] || STATUS_CFG.ALPHA
                    return (
                      <tr key={r.id} className="hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 font-semibold text-sm">
                          {format(new Date(r.date), "d MMM yyyy", { locale: localeId })}
                        </td>
                        <td className="px-4 py-3 text-sm">{r.staff?.name}</td>
                        <td className="px-4 py-3 font-mono text-xs">{r.checkInAt ? format(new Date(r.checkInAt), "HH:mm") : "—"}</td>
                        <td className="px-4 py-3 font-mono text-xs">{r.checkOutAt ? format(new Date(r.checkOutAt), "HH:mm") : "—"}</td>
                        <td className="px-4 py-3">
                          {r.checkInLat && r.checkInLng ? (
                            <a href={`https://maps.google.com/?q=${r.checkInLat},${r.checkInLng}`} target="_blank" rel="noopener noreferrer">
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 border text-[10px] cursor-pointer hover:bg-emerald-100">
                                <MapPin className="h-2.5 w-2.5 mr-1" /> GPS
                              </Badge>
                            </a>
                          ) : <span className="text-muted-foreground text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={cn(cfg.badgeCls, "border text-[10px]")}>{cfg.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground max-w-[120px] truncate">{r.notes || "—"}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
