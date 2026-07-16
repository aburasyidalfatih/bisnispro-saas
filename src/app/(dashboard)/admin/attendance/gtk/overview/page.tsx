"use client"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Edit2, CheckCircle, Clock, Minus, XCircle, Search, Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { parseMonthStr } from "@/features/gtk-attendance/helpers"
import { useStaffList } from "@/features/gtk-attendance/hooks/use-staff-list"
import { useMonthlyAttendance } from "@/features/gtk-attendance/hooks/use-monthly-attendance"
import { useAttendanceExport } from "@/features/gtk-attendance/hooks/use-attendance-export"
import { useAttendanceModal } from "@/features/gtk-attendance/hooks/use-attendance-modal"
import { AttendanceTabNav } from "@/features/gtk-attendance/components/attendance-tab-nav"
import { AttendanceKPICards } from "@/features/gtk-attendance/components/attendance-kpi-cards"
import { ExportToolbar } from "@/features/gtk-attendance/components/export-toolbar"
import { SummaryAttendanceTable } from "@/features/gtk-attendance/components/summary-attendance-table"
import { AttendanceEditModal } from "@/features/gtk-attendance/components/attendance-edit-modal"
import { subMonths, addMonths } from "date-fns"

export default function AdminGTKAttendancePage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const tenant = session?.user?.tenants?.[0]

  const staffList = useStaffList(tenant?.id)
  const monthly = useMonthlyAttendance(tenant?.id, staffList)
  const exportHook = useAttendanceExport({ tenantId: tenant?.id, toast })
  const modal = useAttendanceModal({ tenantId: tenant?.id, toast, onSaved: monthly.refetch })

  const kpiCards = [
    { label: "Hadir (Bulan Ini)", value: monthly.monthlyRecords.filter(r => r.status === "HADIR").length, icon: CheckCircle, color: "text-emerald-600", badge: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
    { label: "Izin (Bulan Ini)", value: monthly.monthlyRecords.filter(r => r.status === "IZIN").length, icon: Clock, color: "text-blue-600", badge: "bg-blue-500/10 text-blue-600 border-blue-200" },
    { label: "Sakit (Bulan Ini)", value: monthly.monthlyRecords.filter(r => r.status === "SAKIT").length, icon: Minus, color: "text-amber-600", badge: "bg-amber-500/10 text-amber-600 border-amber-200" },
    { label: "Alpha (Bulan Ini)", value: monthly.monthlyRecords.filter(r => r.status === "ALPHA").length, icon: XCircle, color: "text-red-600", badge: "bg-red-500/10 text-red-600 border-red-200" },
  ]

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
            if (staffList.length > 0) modal.handleOpenEdit(staffList[0])
            else toast({ title: "Belum ada data guru/staf", variant: "destructive" })
          }}>
            <Edit2 className="h-4 w-4" /> Koreksi Absen
          </Button>
        </div>
      </div>

      <AttendanceTabNav activeId="overview" />
      <ExportToolbar {...exportHook} onExport={exportHook.handleExportExcel} />
      <AttendanceKPICards cards={kpiCards} />

      {/* Month Navigator + Search */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex items-center gap-3 bg-white/50 dark:bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 w-fit">
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => {
            const parsed = parseMonthStr(monthly.selectedMonth)
            monthly.setSelectedMonth(format(subMonths(parsed, 1), "yyyy-MM"))
          }}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 font-semibold text-xs px-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input
              type="month"
              value={monthly.selectedMonth}
              onChange={e => monthly.setSelectedMonth(e.target.value)}
              className="border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto font-semibold cursor-pointer w-28 text-center text-xs"
            />
          </div>
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => {
            const parsed = parseMonthStr(monthly.selectedMonth)
            monthly.setSelectedMonth(format(addMonths(parsed, 1), "yyyy-MM"))
          }}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          {monthly.selectedMonth !== format(new Date(), "yyyy-MM") && (
            <Button size="sm" variant="ghost" className="h-8 rounded-lg text-xs" onClick={() => monthly.setSelectedMonth(format(new Date(), "yyyy-MM"))}>
              Bulan Ini
            </Button>
          )}
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari guru atau staf..."
            value={monthly.monthlySearch}
            onChange={e => monthly.setMonthlySearch(e.target.value)}
            className="pl-9 rounded-xl glass text-xs h-9"
          />
        </div>
      </div>

      {/* Monthly Summary Table */}
      <SummaryAttendanceTable
        title={`Rekap Absensi Bulanan — ${format(parseMonthStr(monthly.selectedMonth), "MMMM yyyy", { locale: localeId })}`}
        loading={monthly.monthlyLoading}
        data={monthly.filteredMonthlySummary}
        emptyMessage="Tidak ada data rekap bulanan."
      />

      {/* Edit Modal */}
      <AttendanceEditModal
        open={modal.openModal}
        saving={modal.saving}
        manualForm={modal.manualForm}
        staffList={staffList}
        onClose={() => modal.setOpenModal(false)}
        onSave={modal.handleManualSave}
        onFormChange={modal.setManualForm}
      />
    </div>
  )
}
