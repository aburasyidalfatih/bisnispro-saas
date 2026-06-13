"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { useEffect, useState, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  Users, CalendarCheck, CheckCircle, XCircle, Clock,
  Minus, Loader2, MapPin, LogIn, LogOut, Search, Edit2,
  Download, TrendingUp, Filter, Calendar, ChevronLeft, ChevronRight, X, User as UserIcon, Settings, FileText
} from "lucide-react"
import { format, startOfMonth, endOfMonth, subMonths, addMonths, subDays, addDays } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { cn, normalizeImageUrl } from "@/lib/utils"

const STATUS_CFG: Record<string, { label: string; color: string; badgeCls: string }> = {
  HADIR: { label: "Hadir", color: "text-emerald-600", badgeCls: "bg-emerald-500/10 text-emerald-600 border-emerald-300" },
  IZIN: { label: "Izin", color: "text-blue-600", badgeCls: "bg-blue-500/10 text-blue-600 border-blue-300" },
  SAKIT: { label: "Sakit", color: "text-amber-600", badgeCls: "bg-amber-500/10 text-amber-600 border-amber-300" },
  ALPHA: { label: "Alpha", color: "text-red-600", badgeCls: "bg-red-500/10 text-red-600 border-red-300" },
  BELUM_ABSEN: { label: "Belum Absen", color: "text-zinc-500", badgeCls: "bg-zinc-500/10 text-zinc-500 border-zinc-300" },
}

type StaffRecord = {
  id: string; date: string; status: string
  checkInAt?: string; checkOutAt?: string
  checkInLat?: number; checkInLng?: number; notes?: string
  staff: { id: string; name: string; role: string; imageUrl?: string }
}

type ExportMode = "range" | "week" | "month" | "year"

function getWeekInputValue(date = new Date()) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNumber = target.getUTCDay() || 7
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber)
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1))
  const weekNumber = Math.ceil((((target.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)

  return `${target.getUTCFullYear()}-W${String(weekNumber).padStart(2, "0")}`
}

function parseMonthStr(monthStr: string) {
  const [year, month] = monthStr.split("-").map(Number)
  return new Date(year, month - 1, 1)
}

function getHHMM(isoString?: string) {
  if (!isoString) return ""
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return ""
  const hours = String(d.getHours()).padStart(2, "0")
  const minutes = String(d.getMinutes()).padStart(2, "0")
  return `${hours}:${minutes}`
}

function getExportFilename(contentDisposition: string | null) {
  const match = contentDisposition?.match(/filename="?([^"]+)"?/)
  return match?.[1] || `Laporan_Presensi_GTK_${format(new Date(), "yyyyMMdd")}.xlsx`
}

export default function AdminGTKAttendancePage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const tenant = session?.user?.tenants?.[0]

  const activeTab: string = "monthly";

  
  const [staffList, setStaffList] = useState<any[]>([])
  const [exporting, setExporting] = useState(false)
  const [exportMode, setExportMode] = useState<ExportMode>("month")
  const [exportFromDate, setExportFromDate] = useState(() => format(startOfMonth(new Date()), "yyyy-MM-dd"))
  const [exportToDate, setExportToDate] = useState(() => format(new Date(), "yyyy-MM-dd"))
  const [exportWeek, setExportWeek] = useState(() => getWeekInputValue())
  const [exportMonth, setExportMonth] = useState(() => format(new Date(), "yyyy-MM"))
  const [exportYear, setExportYear] = useState(() => format(new Date(), "yyyy"))
  
  // Modal State
  const [openModal, setOpenModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [manualForm, setManualForm] = useState({
    staffId: "",
    staffName: "",
    date: "",
    status: "HADIR",
    checkInTime: "",
    checkOutTime: "",
    notes: "",
  })

  // TODAY TAB STATE
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), "yyyy-MM-dd"))
  const [todayRecords, setTodayRecords] = useState<StaffRecord[]>([])
  const [todayLoading, setTodayLoading] = useState(false)
  const [todaySearch, setTodaySearch] = useState("")

  const fetchTodayRecords = async () => {
    if (!tenant) return
    setTodayLoading(true)
    try {
      const params = new URLSearchParams({
        tenantId: tenant.id,
        from: selectedDate,
        to: selectedDate,
        take: "500",
      })
      const res = await fetch(`/api/gtk/attendance?${params}`)
      const data = await res.json()
      setTodayRecords(data.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setTodayLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === "today") fetchTodayRecords()
  }, [tenant, activeTab, selectedDate])

  const filteredTodayStaffList = useMemo(() => {
    const list = staffList.map(s => {
      const record = todayRecords.find(r => r.staff?.id === s.id)
      return {
        staff: s,
        record: record,
        status: record ? record.status : "BELUM_ABSEN",
      }
    })
    if (!todaySearch) return list
    return list.filter(item => 
      item.staff.name.toLowerCase().includes(todaySearch.toLowerCase()) ||
      item.staff.role?.toLowerCase().includes(todaySearch.toLowerCase())
    )
  }, [staffList, todayRecords, todaySearch])

  const todayStats = useMemo(() => {
    const total = staffList.length
    const hadir = todayRecords.filter(r => r.status === "HADIR").length
    const izinSakit = todayRecords.filter(r => r.status === "IZIN" || r.status === "SAKIT").length
    const belumAbsen = total - todayRecords.filter(r => ["HADIR", "IZIN", "SAKIT", "ALPHA"].includes(r.status)).length
    return { total, hadir, izinSakit, belumAbsen }
  }, [staffList, todayRecords])


  // MONTHLY TAB STATE
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), "yyyy-MM"))
  const [monthlyRecords, setMonthlyRecords] = useState<StaffRecord[]>([])
  const [monthlyLoading, setMonthlyLoading] = useState(false)
  const [monthlySearch, setMonthlySearch] = useState("")

  const fetchMonthlyRecords = async () => {
    if (!tenant) return
    setMonthlyLoading(true)
    try {
      const parsed = parseMonthStr(selectedMonth)
      const start = format(startOfMonth(parsed), "yyyy-MM-dd")
      const end = format(endOfMonth(parsed), "yyyy-MM-dd")
      const params = new URLSearchParams({
        tenantId: tenant.id,
        from: start,
        to: end,
        take: "3000",
      })
      const res = await fetch(`/api/gtk/attendance?${params}`)
      const data = await res.json()
      setMonthlyRecords(data.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setMonthlyLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === "monthly") fetchMonthlyRecords()
  }, [tenant, activeTab, selectedMonth])

  const monthlySummary = useMemo(() => {
    return staffList.map(s => {
      const staffRecs = monthlyRecords.filter(r => r.staff?.id === s.id)
      const hadir = staffRecs.filter(r => r.status === "HADIR").length
      const izin = staffRecs.filter(r => r.status === "IZIN").length
      const sakit = staffRecs.filter(r => r.status === "SAKIT").length
      const alpha = staffRecs.filter(r => r.status === "ALPHA").length
      const total = staffRecs.length
      return {
        ...s,
        hadir,
        izin,
        sakit,
        alpha,
        total,
        percentage: total > 0 ? Math.round((hadir / total) * 100) : 0,
      }
    })
  }, [staffList, monthlyRecords])

  const filteredMonthlySummary = useMemo(() => {
    if (!monthlySearch) return monthlySummary
    return monthlySummary.filter(s => 
      s.name.toLowerCase().includes(monthlySearch.toLowerCase()) ||
      s.role?.toLowerCase().includes(monthlySearch.toLowerCase())
    )
  }, [monthlySummary, monthlySearch])


  // YEARLY TAB STATE
  const [selectedYear, setSelectedYear] = useState(() => format(new Date(), "yyyy"))
  const [yearlyRecords, setYearlyRecords] = useState<StaffRecord[]>([])
  const [yearlyLoading, setYearlyLoading] = useState(false)
  const [yearlySearch, setYearlySearch] = useState("")

  const fetchYearlyRecords = async () => {
    if (!tenant) return
    setYearlyLoading(true)
    try {
      const start = `${selectedYear}-01-01`
      const end = `${selectedYear}-12-31`
      const params = new URLSearchParams({
        tenantId: tenant.id,
        from: start,
        to: end,
        take: "15000",
      })
      const res = await fetch(`/api/gtk/attendance?${params}`)
      const data = await res.json()
      setYearlyRecords(data.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setYearlyLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === "yearly") fetchYearlyRecords()
  }, [tenant, activeTab, selectedYear])

  const yearlySummary = useMemo(() => {
    return staffList.map(s => {
      const staffRecs = yearlyRecords.filter(r => r.staff?.id === s.id)
      const hadir = staffRecs.filter(r => r.status === "HADIR").length
      const izin = staffRecs.filter(r => r.status === "IZIN").length
      const sakit = staffRecs.filter(r => r.status === "SAKIT").length
      const alpha = staffRecs.filter(r => r.status === "ALPHA").length
      const total = staffRecs.length
      return {
        ...s,
        hadir,
        izin,
        sakit,
        alpha,
        total,
        percentage: total > 0 ? Math.round((hadir / total) * 100) : 0,
      }
    })
  }, [staffList, yearlyRecords])

  const filteredYearlySummary = useMemo(() => {
    if (!yearlySearch) return yearlySummary
    return yearlySummary.filter(s => 
      s.name.toLowerCase().includes(yearlySearch.toLowerCase()) ||
      s.role?.toLowerCase().includes(yearlySearch.toLowerCase())
    )
  }, [yearlySummary, yearlySearch])


  // RIWAYAT LOGS TAB STATE
  const [logsFromDate, setLogsFromDate] = useState(() => format(startOfMonth(new Date()), "yyyy-MM-dd"))
  const [logsToDate, setLogsToDate] = useState(() => format(new Date(), "yyyy-MM-dd"))
  const [logsRecords, setLogsRecords] = useState<StaffRecord[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [logsPage, setLogsPage] = useState(1)
  const [logsMeta, setLogsMeta] = useState({ total: 0, totalPages: 1 })
  const [logsSearch, setLogsSearch] = useState("")

  const fetchLogsRecords = async () => {
    if (!tenant) return
    setLogsLoading(true)
    try {
      const params = new URLSearchParams({
        tenantId: tenant.id,
        from: logsFromDate,
        to: logsToDate,
        take: "30",
        page: String(logsPage),
      })
      const res = await fetch(`/api/gtk/attendance?${params}`)
      const data = await res.json()
      setLogsRecords(data.data || [])
      setLogsMeta(data.meta || { total: 0, totalPages: 1 })
    } catch (e) {
      console.error(e)
    } finally {
      setLogsLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === "logs") fetchLogsRecords()
  }, [tenant, activeTab, logsFromDate, logsToDate, logsPage])

  const filteredLogs = useMemo(() => {
    if (!logsSearch) return logsRecords
    return logsRecords.filter(r => 
      r.staff?.name?.toLowerCase().includes(logsSearch.toLowerCase()) ||
      r.staff?.role?.toLowerCase().includes(logsSearch.toLowerCase())
    )
  }, [logsRecords, logsSearch])


  // FETCH ALL STAFF
  useEffect(() => {
    if (!tenant) return
    fetch(`/api/gtk/staff?tenantId=${tenant.id}`)
      .then(r => r.json())
      .then(d => setStaffList(d.staff || []))
      .catch(console.error)
  }, [tenant])


  // MANAGE MODAL
  const handleOpenEdit = (staff: any, record?: StaffRecord) => {
    setManualForm({
      staffId: staff.id,
      staffName: staff.name,
      date: record ? format(new Date(record.date), "yyyy-MM-dd") : selectedDate,
      status: record ? record.status : "HADIR",
      checkInTime: record ? getHHMM(record.checkInAt) : "",
      checkOutTime: record ? getHHMM(record.checkOutAt) : "",
      notes: record ? (record.notes || "") : "",
    })
    setOpenModal(true)
  }

  const handleManualSave = async () => {
    if (!tenant || !manualForm.staffId) {
      return toast({ title: "Pilih guru terlebih dahulu", variant: "destructive" })
    }
    setSaving(true)
    try {
      let checkInAt: string | undefined = undefined
      let checkOutAt: string | undefined = undefined

      if (manualForm.status === "HADIR") {
        if (manualForm.checkInTime) {
          checkInAt = new Date(`${manualForm.date}T${manualForm.checkInTime}:00`).toISOString()
        }
        if (manualForm.checkOutTime) {
          checkOutAt = new Date(`${manualForm.date}T${manualForm.checkOutTime}:00`).toISOString()
        }
      }

      const payload = {
        tenantId: tenant.id,
        staffId: manualForm.staffId,
        date: manualForm.date,
        status: manualForm.status,
        checkInAt,
        checkOutAt,
        notes: manualForm.notes || "",
      }

      const res = await fetch("/api/gtk/attendance/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        throw new Error((await res.json()).error)
      }

      toast({ title: "Absensi berhasil disimpan!" })
      setOpenModal(false)

      if (activeTab === "today") fetchTodayRecords()
      else if (activeTab === "monthly") fetchMonthlyRecords()
      else if (activeTab === "yearly") fetchYearlyRecords()
      else if (activeTab === "logs") fetchLogsRecords()
    } catch (err: any) {
      toast({ title: "Gagal menyimpan absensi", description: err.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleExportExcel = async () => {
    if (!tenant) {
      return toast({ title: "Tenant belum siap", variant: "destructive" })
    }

    if (exportMode === "range" && exportFromDate > exportToDate) {
      return toast({ title: "Rentang tanggal tidak valid", description: "Tanggal mulai tidak boleh melebihi tanggal akhir.", variant: "destructive" })
    }

    setExporting(true)
    try {
      const params = new URLSearchParams({
        tenantId: tenant.id,
        mode: exportMode,
      })

      if (exportMode === "range") {
        params.set("from", exportFromDate)
        params.set("to", exportToDate)
      } else if (exportMode === "week") {
        params.set("week", exportWeek)
      } else if (exportMode === "month") {
        params.set("month", exportMonth)
      } else {
        params.set("year", exportYear)
      }

      const res = await fetch(`/api/gtk/attendance/export?${params.toString()}`)
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Export gagal" }))
        throw new Error(error.error || "Export gagal")
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = getExportFilename(res.headers.get("Content-Disposition"))
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast({ title: "Export berhasil", description: "File Excel presensi GTK berhasil diunduh." })
    } catch (err: any) {
      toast({ title: "Gagal export Excel", description: err.message || "Terjadi kesalahan saat membuat file.", variant: "destructive" })
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Presensi Guru & Staf</h1>
          <p className="text-sm text-muted-foreground">Monitor, koreksi, dan rekap absensi karyawan profesional.</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button variant="default" className="rounded-xl gap-2 font-semibold shadow-sm" onClick={() => {
            if (staffList.length > 0) {
              handleOpenEdit(staffList[0])
            } else {
              toast({ title: "Belum ada data guru/staf", variant: "destructive" })
            }
          }}>
            <Edit2 className="h-4 w-4" /> Koreksi Absen
          </Button>
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
          const isActive = tab.id === "overview"
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition-all border-b-2 -mb-px rounded-t-xl shrink-0",
                isActive 
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Link>
          )
        })}
      </div>

      <Card className="glass border-0 shadow-sm overflow-hidden">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-2 md:flex-row md:items-center lg:flex-1">
              <div className="flex h-10 items-center gap-2 rounded-xl border border-border/70 bg-white/70 px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground dark:bg-zinc-950/60 md:w-44">
                <Filter className="h-3.5 w-3.5 shrink-0" />
                <span>Periode Ekspor</span>
              </div>

              <div className={cn(
                "grid w-full grid-cols-1 gap-2 sm:grid-cols-2 md:items-center lg:w-auto",
                exportMode === "range" ? "lg:grid-cols-[180px_160px_160px]" :
                exportMode === "year" ? "lg:grid-cols-[180px_120px]" :
                "lg:grid-cols-[180px_220px]"
              )}>
                <div>
                  <Label className="sr-only">Jenis periode ekspor</Label>
                  <Select value={exportMode} onValueChange={(value) => setExportMode(value as ExportMode)}>
                    <SelectTrigger className="h-10 rounded-xl bg-white/80 text-xs dark:bg-zinc-950/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="range">Rentang Tanggal</SelectItem>
                      <SelectItem value="week">Minggu</SelectItem>
                      <SelectItem value="month">Bulan</SelectItem>
                      <SelectItem value="year">Tahun</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {exportMode === "range" && (
                  <>
                    <div>
                      <Label className="sr-only">Tanggal mulai ekspor</Label>
                      <Input
                        type="date"
                        value={exportFromDate}
                        onChange={(e) => setExportFromDate(e.target.value)}
                        className="h-10 rounded-xl bg-white/80 text-xs dark:bg-zinc-950/60"
                      />
                    </div>
                    <div>
                      <Label className="sr-only">Tanggal akhir ekspor</Label>
                      <Input
                        type="date"
                        value={exportToDate}
                        onChange={(e) => setExportToDate(e.target.value)}
                        className="h-10 rounded-xl bg-white/80 text-xs dark:bg-zinc-950/60"
                      />
                    </div>
                  </>
                )}

                {exportMode === "week" && (
                  <div>
                    <Label className="sr-only">Minggu ekspor</Label>
                    <Input
                      type="week"
                      value={exportWeek}
                      onChange={(e) => setExportWeek(e.target.value)}
                      className="h-10 rounded-xl bg-white/80 text-xs dark:bg-zinc-950/60"
                    />
                  </div>
                )}

                {exportMode === "month" && (
                  <div>
                    <Label className="sr-only">Bulan ekspor</Label>
                    <Input
                      type="month"
                      value={exportMonth}
                      onChange={(e) => setExportMonth(e.target.value)}
                      className="h-10 rounded-xl bg-white/80 text-xs dark:bg-zinc-950/60"
                    />
                  </div>
                )}

                {exportMode === "year" && (
                  <div>
                    <Label className="sr-only">Tahun ekspor</Label>
                    <Input
                      type="number"
                      min="2000"
                      max="2100"
                      value={exportYear}
                      onChange={(e) => setExportYear(e.target.value)}
                      className="h-10 rounded-xl bg-white/80 text-xs dark:bg-zinc-950/60"
                    />
                  </div>
                )}
              </div>
            </div>

            <Button type="button" className="h-10 rounded-xl gap-2 font-semibold w-full sm:w-auto shrink-0" onClick={handleExportExcel} disabled={exporting}>
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Ekspor Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {activeTab === "today" ? (
          <>
            {[
              { label: "Total Staf", value: todayStats.total, icon: Users, color: "text-zinc-800 dark:text-zinc-200", badge: "bg-zinc-500/10 text-zinc-500 border-zinc-200" },
              { label: "Hadir", value: todayStats.hadir, icon: CheckCircle, color: "text-emerald-600", badge: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
              { label: "Izin / Sakit", value: todayStats.izinSakit, icon: Clock, color: "text-blue-600", badge: "bg-blue-500/10 text-blue-600 border-blue-200" },
              { label: "Belum Absen", value: todayStats.belumAbsen, icon: XCircle, color: "text-zinc-500", badge: "bg-zinc-500/10 text-zinc-500 border-zinc-200" },
            ].map((card) => {
              const Icon = card.icon
              return (
                <Card key={card.label} className="glass border-0 shadow-sm">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center border", card.badge)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{card.label}</p>
                      <p className={cn("font-black text-2xl tracking-tight", card.color)}>{card.value}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </>
        ) : activeTab === "monthly" ? (
          <>
            {[
              { label: "Hadir (Bulan Ini)", value: monthlyRecords.filter(r => r.status === "HADIR").length, icon: CheckCircle, color: "text-emerald-600", badge: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
              { label: "Izin (Bulan Ini)", value: monthlyRecords.filter(r => r.status === "IZIN").length, icon: Clock, color: "text-blue-600", badge: "bg-blue-500/10 text-blue-600 border-blue-200" },
              { label: "Sakit (Bulan Ini)", value: monthlyRecords.filter(r => r.status === "SAKIT").length, icon: Minus, color: "text-amber-600", badge: "bg-amber-500/10 text-amber-600 border-amber-200" },
              { label: "Alpha (Bulan Ini)", value: monthlyRecords.filter(r => r.status === "ALPHA").length, icon: XCircle, color: "text-red-600", badge: "bg-red-500/10 text-red-600 border-red-200" },
            ].map((card) => {
              const Icon = card.icon
              return (
                <Card key={card.label} className="glass border-0 shadow-sm">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center border", card.badge)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{card.label}</p>
                      <p className={cn("font-black text-2xl tracking-tight", card.color)}>{card.value}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </>
        ) : activeTab === "yearly" ? (
          <>
            {[
              { label: "Hadir (Tahun Ini)", value: yearlyRecords.filter(r => r.status === "HADIR").length, icon: CheckCircle, color: "text-emerald-600", badge: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
              { label: "Izin (Tahun Ini)", value: yearlyRecords.filter(r => r.status === "IZIN").length, icon: Clock, color: "text-blue-600", badge: "bg-blue-500/10 text-blue-600 border-blue-200" },
              { label: "Sakit (Tahun Ini)", value: yearlyRecords.filter(r => r.status === "SAKIT").length, icon: Minus, color: "text-amber-600", badge: "bg-amber-500/10 text-amber-600 border-amber-200" },
              { label: "Alpha (Tahun Ini)", value: yearlyRecords.filter(r => r.status === "ALPHA").length, icon: XCircle, color: "text-red-600", badge: "bg-red-500/10 text-red-600 border-red-200" },
            ].map((card) => {
              const Icon = card.icon
              return (
                <Card key={card.label} className="glass border-0 shadow-sm">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center border", card.badge)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{card.label}</p>
                      <p className={cn("font-black text-2xl tracking-tight", card.color)}>{card.value}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </>
        ) : (
          <>
            {[
              { label: "Total Record Log", value: logsMeta.total, icon: Users, color: "text-zinc-800 dark:text-zinc-200", badge: "bg-zinc-500/10 text-zinc-500 border-zinc-200" },
              { label: "Hadir", value: logsRecords.filter(r => r.status === "HADIR").length, icon: CheckCircle, color: "text-emerald-600", badge: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
              { label: "Izin / Sakit", value: logsRecords.filter(r => r.status === "IZIN" || r.status === "SAKIT").length, icon: Clock, color: "text-blue-600", badge: "bg-blue-500/10 text-blue-600 border-blue-200" },
              { label: "Alpha", value: logsRecords.filter(r => r.status === "ALPHA").length, icon: XCircle, color: "text-red-600", badge: "bg-red-500/10 text-red-600 border-red-200" },
            ].map((card) => {
              const Icon = card.icon
              return (
                <Card key={card.label} className="glass border-0 shadow-sm">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center border", card.badge)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{card.label}</p>
                      <p className={cn("font-black text-2xl tracking-tight", card.color)}>{card.value}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </>
        )}
      </div>

      {/* Dynamic Controls / Filters per Tab */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        {activeTab === "today" && (
          <>
            <div className="flex items-center gap-3 bg-white/50 dark:bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 w-fit">
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setSelectedDate(d => format(subDays(new Date(d), 1), "yyyy-MM-dd"))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 font-semibold text-xs px-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input 
                  type="date" 
                  value={selectedDate} 
                  onChange={e => setSelectedDate(e.target.value)} 
                  className="border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto font-semibold cursor-pointer w-28 text-center text-xs" 
                />
              </div>
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setSelectedDate(d => format(addDays(new Date(d), 1), "yyyy-MM-dd"))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              {selectedDate !== format(new Date(), "yyyy-MM-dd") && (
                <Button size="sm" variant="ghost" className="h-8 rounded-lg text-xs" onClick={() => setSelectedDate(format(new Date(), "yyyy-MM-dd"))}>
                  Hari Ini
                </Button>
              )}
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari guru atau staf..."
                value={todaySearch}
                onChange={e => setTodaySearch(e.target.value)}
                className="pl-9 rounded-xl glass text-xs h-9"
              />
            </div>
          </>
        )}

        {activeTab === "monthly" && (
          <>
            <div className="flex items-center gap-3 bg-white/50 dark:bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 w-fit">
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => {
                const parsed = parseMonthStr(selectedMonth)
                setSelectedMonth(format(subMonths(parsed, 1), "yyyy-MM"))
              }}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 font-semibold text-xs px-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input 
                  type="month" 
                  value={selectedMonth} 
                  onChange={e => setSelectedMonth(e.target.value)} 
                  className="border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto font-semibold cursor-pointer w-28 text-center text-xs" 
                />
              </div>
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => {
                const parsed = parseMonthStr(selectedMonth)
                setSelectedMonth(format(addMonths(parsed, 1), "yyyy-MM"))
              }}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              {selectedMonth !== format(new Date(), "yyyy-MM") && (
                <Button size="sm" variant="ghost" className="h-8 rounded-lg text-xs" onClick={() => setSelectedMonth(format(new Date(), "yyyy-MM"))}>
                  Bulan Ini
                </Button>
              )}
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari guru atau staf..."
                value={monthlySearch}
                onChange={e => setMonthlySearch(e.target.value)}
                className="pl-9 rounded-xl glass text-xs h-9"
              />
            </div>
          </>
        )}

        {activeTab === "yearly" && (
          <>
            <div className="flex items-center gap-3 bg-white/50 dark:bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 w-fit">
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setSelectedYear(y => String(Number(y) - 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 font-semibold text-xs px-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedYear} onValueChange={v => setSelectedYear(v)}>
                  <SelectTrigger className="border-0 bg-transparent p-0 focus:ring-0 focus:ring-offset-0 h-auto font-semibold cursor-pointer w-16 shadow-none text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => {
                      const year = String(new Date().getFullYear() - 5 + i)
                      return <SelectItem key={year} value={year}>{year}</SelectItem>
                    })}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setSelectedYear(y => String(Number(y) + 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              {selectedYear !== String(new Date().getFullYear()) && (
                <Button size="sm" variant="ghost" className="h-8 rounded-lg text-xs" onClick={() => setSelectedYear(String(new Date().getFullYear()))}>
                  Tahun Ini
                </Button>
              )}
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari guru atau staf..."
                value={yearlySearch}
                onChange={e => setYearlySearch(e.target.value)}
                className="pl-9 rounded-xl glass text-xs h-9"
              />
            </div>
          </>
        )}

        {activeTab === "logs" && (
          <div className="flex flex-wrap items-center gap-3 w-full justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-white/50 dark:bg-zinc-900/50 px-3 py-1.5 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground">Dari</span>
                <Input 
                  type="date" 
                  value={logsFromDate} 
                  onChange={e => { setLogsFromDate(e.target.value); setLogsPage(1) }} 
                  className="border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto text-xs font-semibold cursor-pointer w-28" 
                />
              </div>
              <div className="flex items-center gap-2 bg-white/50 dark:bg-zinc-900/50 px-3 py-1.5 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground">Sampai</span>
                <Input 
                  type="date" 
                  value={logsToDate} 
                  onChange={e => { setLogsToDate(e.target.value); setLogsPage(1) }} 
                  className="border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto text-xs font-semibold cursor-pointer w-28" 
                />
              </div>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari guru atau staf..."
                value={logsSearch}
                onChange={e => setLogsSearch(e.target.value)}
                className="pl-9 rounded-xl glass text-xs h-9"
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Tab Renderings */}
      {activeTab === "today" && (
        <Card className="glass border-0 shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold tracking-tight">Daftar Kehadiran Hari Ini — {format(new Date(selectedDate), "d MMMM yyyy", { locale: localeId })}</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            {todayLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    {["Guru/Staf", "Jabatan", "Status", "Jam Masuk", "Jam Pulang", "Catatan", "Aksi"].map(h => (
                      <TableHead key={h} className="text-left px-4 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTodayStaffList.map(item => {
                    const cfg = STATUS_CFG[item.status] || STATUS_CFG.BELUM_ABSEN
                    const rec = item.record
                    return (
                      <TableRow key={item.staff.id} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                        <TableCell className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl overflow-hidden bg-primary/10 shrink-0 border border-border/50">
                              {item.staff.imageUrl ? (
                                <img src={normalizeImageUrl(item.staff.imageUrl)} alt={item.staff.name} className="h-full w-full object-cover" loading="lazy" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center font-bold text-primary text-xs bg-primary/5">
                                  <UserIcon className="h-4 w-4 text-primary" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-xs text-foreground leading-snug">{item.staff.name}</p>
                              <p className="text-[10px] text-muted-foreground">{item.staff.role || "Staf"}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-xs text-muted-foreground">{item.staff.role || "Staf"}</TableCell>
                        <TableCell className="px-4 py-3">
                          <Badge className={cn(cfg.badgeCls, "border text-[10px] font-bold rounded-lg px-2 py-0.5 shadow-none")}>{cfg.label}</Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 font-mono text-xs text-foreground">
                          {rec?.checkInAt ? (
                            <div className="flex items-center gap-1.5">
                              <span>{format(new Date(rec.checkInAt), "HH:mm")}</span>
                              {rec.checkInLat && rec.checkInLng && (
                                <a href={`https://maps.google.com/?q=${rec.checkInLat},${rec.checkInLng}`} target="_blank" rel="noopener noreferrer">
                                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 border text-[9px] cursor-pointer hover:bg-emerald-100/50 py-0 px-1 shadow-none">
                                    <MapPin className="h-2 w-2 mr-0.5" /> GPS
                                  </Badge>
                                </a>
                              )}
                            </div>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="px-4 py-3 font-mono text-xs text-foreground">
                          {rec?.checkOutAt ? format(new Date(rec.checkOutAt), "HH:mm") : "—"}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-xs text-muted-foreground max-w-[150px] truncate">{rec?.notes || "—"}</TableCell>
                        <TableCell className="px-4 py-3">
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground" onClick={() => handleOpenEdit(item.staff, rec)}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {filteredTodayStaffList.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-xs font-medium">Tidak ada guru/staf ditemukan.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>
      )}

      {activeTab === "monthly" && (
        <Card className="glass border-0 shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold tracking-tight">Rekap Absensi Bulanan — {format(parseMonthStr(selectedMonth), "MMMM yyyy", { locale: localeId })}</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            {monthlyLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    {["Guru/Staf", "Jabatan", "Hadir", "Izin", "Sakit", "Alpha", "Total Absensi", "Kehadiran %"].map(h => (
                      <TableHead key={h} className="text-left px-4 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMonthlySummary.map(s => (
                    <TableRow key={s.id} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl overflow-hidden bg-primary/10 shrink-0 border border-border/50">
                            {s.imageUrl ? (
                              <img src={normalizeImageUrl(s.imageUrl)} alt={s.name} className="h-full w-full object-cover" loading="lazy" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center font-bold text-primary text-xs bg-primary/5">
                                <UserIcon className="h-4 w-4 text-primary" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-xs text-foreground leading-snug">{s.name}</p>
                            <p className="text-[10px] text-muted-foreground">{s.role || "Staf"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-xs text-muted-foreground">{s.role || "Staf"}</TableCell>
                      <TableCell className="px-4 py-3 font-bold text-emerald-600 text-xs">{s.hadir}</TableCell>
                      <TableCell className="px-4 py-3 font-bold text-blue-600 text-xs">{s.izin}</TableCell>
                      <TableCell className="px-4 py-3 font-bold text-amber-600 text-xs">{s.sakit}</TableCell>
                      <TableCell className="px-4 py-3 font-bold text-red-600 text-xs">{s.alpha}</TableCell>
                      <TableCell className="px-4 py-3 font-bold text-zinc-500 text-xs">{s.total}</TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-muted dark:bg-zinc-800 rounded-full h-1.5 min-w-[50px] overflow-hidden">
                            <div className={cn("h-full rounded-full", s.percentage >= 80 ? "bg-emerald-500" : s.percentage >= 60 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${s.percentage}%` }} />
                          </div>
                          <span className="text-xs font-bold w-8 text-right">{s.percentage}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredMonthlySummary.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground text-xs font-medium">Tidak ada data rekap bulanan.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>
      )}

      {activeTab === "yearly" && (
        <Card className="glass border-0 shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold tracking-tight">Rekap Absensi Tahunan — {selectedYear}</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            {yearlyLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    {["Guru/Staf", "Jabatan", "Hadir", "Izin", "Sakit", "Alpha", "Total Absensi", "Kehadiran %"].map(h => (
                      <TableHead key={h} className="text-left px-4 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredYearlySummary.map(s => (
                    <TableRow key={s.id} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl overflow-hidden bg-primary/10 shrink-0 border border-border/50">
                            {s.imageUrl ? (
                              <img src={normalizeImageUrl(s.imageUrl)} alt={s.name} className="h-full w-full object-cover" loading="lazy" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center font-bold text-primary text-xs bg-primary/5">
                                <UserIcon className="h-4 w-4 text-primary" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-xs text-foreground leading-snug">{s.name}</p>
                            <p className="text-[10px] text-muted-foreground">{s.role || "Staf"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-xs text-muted-foreground">{s.role || "Staf"}</TableCell>
                      <TableCell className="px-4 py-3 font-bold text-emerald-600 text-xs">{s.hadir}</TableCell>
                      <TableCell className="px-4 py-3 font-bold text-blue-600 text-xs">{s.izin}</TableCell>
                      <TableCell className="px-4 py-3 font-bold text-amber-600 text-xs">{s.sakit}</TableCell>
                      <TableCell className="px-4 py-3 font-bold text-red-600 text-xs">{s.alpha}</TableCell>
                      <TableCell className="px-4 py-3 font-bold text-zinc-500 text-xs">{s.total}</TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-muted dark:bg-zinc-800 rounded-full h-1.5 min-w-[50px] overflow-hidden">
                            <div className={cn("h-full rounded-full", s.percentage >= 80 ? "bg-emerald-500" : s.percentage >= 60 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${s.percentage}%` }} />
                          </div>
                          <span className="text-xs font-bold w-8 text-right">{s.percentage}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredYearlySummary.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground text-xs font-medium">Tidak ada data rekap tahunan.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>
      )}

      {activeTab === "logs" && (
        <Card className="glass border-0 shadow-sm overflow-hidden">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold tracking-tight">Riwayat Log Absensi Lengkap</CardTitle>
            <p className="text-xs text-muted-foreground font-semibold">{logsMeta.total} rekord ditemukan</p>
          </CardHeader>
          <div className="overflow-x-auto">
            {logsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    {["Tanggal", "Guru/Staf", "Status", "Check-In", "Check-Out", "GPS", "Catatan", "Aksi"].map(h => (
                      <TableHead key={h} className="text-left px-4 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map(r => {
                    const cfg = STATUS_CFG[r.status] || STATUS_CFG.ALPHA
                    return (
                      <TableRow key={r.id} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                        <TableCell className="px-4 py-3 font-semibold text-xs text-foreground">
                          {format(new Date(r.date), "d MMM yyyy", { locale: localeId })}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-xs leading-none">{r.staff?.name}</p>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <Badge className={cn(cfg.badgeCls, "border text-[9px] font-bold rounded-lg px-1.5 py-0.5 shadow-none")}>{cfg.label}</Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 font-mono text-xs text-foreground">
                          {r.checkInAt ? format(new Date(r.checkInAt), "HH:mm") : "—"}
                        </TableCell>
                        <TableCell className="px-4 py-3 font-mono text-xs text-foreground">
                          {r.checkOutAt ? format(new Date(r.checkOutAt), "HH:mm") : "—"}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          {r.checkInLat && r.checkInLng ? (
                            <a href={`https://maps.google.com/?q=${r.checkInLat},${r.checkInLng}`} target="_blank" rel="noopener noreferrer">
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 border text-[9px] cursor-pointer hover:bg-emerald-100/50 py-0 px-1 shadow-none">
                                <MapPin className="h-2 w-2 mr-0.5" /> GPS
                              </Badge>
                            </a>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-xs text-muted-foreground max-w-[120px] truncate">{r.notes || "—"}</TableCell>
                        <TableCell className="px-4 py-3">
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground" onClick={() => handleOpenEdit(r.staff, r)}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {filteredLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground text-xs font-medium">Tidak ada rekord log absensi.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Pagination Controls */}
          {logsMeta.totalPages > 1 && (
            <div className="flex items-center justify-end gap-2 p-4 border-t border-border/50">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 rounded-lg text-xs" 
                disabled={logsPage === 1 || logsLoading} 
                onClick={() => setLogsPage(p => p - 1)}
              >
                Sebelumnya
              </Button>
              <span className="text-xs font-semibold px-2">Halaman {logsPage} dari {logsMeta.totalPages}</span>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 rounded-lg text-xs" 
                disabled={logsPage === logsMeta.totalPages || logsLoading} 
                onClick={() => setLogsPage(p => p + 1)}
              >
                Selanjutnya
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Core Edit Modal Dialog */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Tutup modal koreksi absensi"
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setOpenModal(false)}
          />
          
          {/* Modal Container */}
          <div className="relative bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md p-6 overflow-hidden flex flex-col gap-4 animate-in fade-in zoom-in duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="font-black text-base tracking-tight text-foreground">Koreksi Absensi</h3>
                <p className="text-[11px] text-muted-foreground">Koreksi status & waktu absen guru/staf.</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => setOpenModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Form */}
            <div className="space-y-4 text-left">
              {/* Staff Select / Display */}
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Guru / Staf</Label>
                <Select value={manualForm.staffId} onValueChange={(val) => {
                  const found = staffList.find(s => s.id === val)
                  setManualForm(prev => ({ ...prev, staffId: val, staffName: found?.name || "" }))
                }}>
                  <SelectTrigger className="rounded-xl h-10 text-xs">
                    <SelectValue placeholder="Pilih guru/staf..." />
                  </SelectTrigger>
                  <SelectContent>
                    {staffList.map((s: any) => (
                      <SelectItem key={s.id} value={s.id} className="text-xs">{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Selection */}
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tanggal Absen</Label>
                <Input 
                  type="date" 
                  value={manualForm.date} 
                  onChange={e => setManualForm(f => ({ ...f, date: e.target.value }))} 
                  className="rounded-xl h-10 text-xs" 
                />
              </div>

              {/* Status Selector Button Groups */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status Kehadiran</Label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { key: "HADIR", label: "Hadir", activeCls: "bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600", normalCls: "border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20" },
                    { key: "IZIN", label: "Izin", activeCls: "bg-blue-500 text-white border-blue-500 hover:bg-blue-600", normalCls: "border-blue-200 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20" },
                    { key: "SAKIT", label: "Sakit", activeCls: "bg-amber-500 text-white border-amber-500 hover:bg-amber-600", normalCls: "border-amber-200 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20" },
                    { key: "ALPHA", label: "Alpha", activeCls: "bg-red-500 text-white border-red-500 hover:bg-red-600", normalCls: "border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20" },
                  ].map((btn) => {
                    const isActive = manualForm.status === btn.key
                    return (
                      <Button
                        variant="ghost"
                        type="button"
                        key={btn.key}
                        onClick={() => setManualForm(f => ({ ...f, status: btn.key }))}
                        className={cn(
                          "h-auto px-0 py-1.5 text-center text-xs font-semibold border rounded-xl transition-all shadow-sm",
                          isActive ? btn.activeCls : btn.normalCls
                        )}
                      >
                        {btn.label}
                      </Button>
                    )
                  })}
                </div>
              </div>

              {/* Check-In/Check-Out Time Grid */}
              {manualForm.status === "HADIR" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <LogIn className="h-3 w-3 text-emerald-600" /> Jam Masuk
                    </Label>
                    <Input 
                      type="time" 
                      value={manualForm.checkInTime} 
                      onChange={e => setManualForm(f => ({ ...f, checkInTime: e.target.value }))} 
                      className="rounded-xl h-10 text-xs font-mono" 
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <LogOut className="h-3 w-3 text-red-600" /> Jam Pulang
                    </Label>
                    <Input 
                      type="time" 
                      value={manualForm.checkOutTime} 
                      onChange={e => setManualForm(f => ({ ...f, checkOutTime: e.target.value }))} 
                      className="rounded-xl h-10 text-xs font-mono" 
                    />
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Catatan / Alasan</Label>
                <Textarea 
                  placeholder="Isikan keterangan (misal: dinas luar, lupa scan masuk, dsb.)..." 
                  value={manualForm.notes} 
                  onChange={e => setManualForm(f => ({ ...f, notes: e.target.value }))} 
                  className="rounded-xl text-xs h-20"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 justify-end">
              <Button variant="outline" className="rounded-xl font-semibold text-xs" onClick={() => setOpenModal(false)}>
                Batal
              </Button>
              <Button onClick={handleManualSave} disabled={saving} className="rounded-xl font-semibold text-xs min-w-[80px]">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
