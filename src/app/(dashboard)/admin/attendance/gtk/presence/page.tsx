"use client"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Edit2, Users, CheckCircle, Clock, XCircle, Search, Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { format, subDays, addDays } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { useStaffList } from "@/features/gtk-attendance/hooks/use-staff-list"
import { useDailyAttendance } from "@/features/gtk-attendance/hooks/use-daily-attendance"
import { useAttendanceModal } from "@/features/gtk-attendance/hooks/use-attendance-modal"
import { AttendanceTabNav } from "@/features/gtk-attendance/components/attendance-tab-nav"
import { AttendanceKPICards } from "@/features/gtk-attendance/components/attendance-kpi-cards"
import { DailyAttendanceTable } from "@/features/gtk-attendance/components/daily-attendance-table"
import { AttendanceEditModal } from "@/features/gtk-attendance/components/attendance-edit-modal"

export default function AdminGTKAttendancePage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const tenant = session?.user?.tenants?.[0]

  const staffList = useStaffList(tenant?.id)
  const daily = useDailyAttendance(tenant?.id, staffList)
  const modal = useAttendanceModal({ tenantId: tenant?.id, defaultDate: daily.selectedDate, toast, onSaved: daily.refetch })

  const kpiCards = [
    { label: "Total Staf", value: daily.todayStats.total, icon: Users, color: "text-zinc-800 dark:text-zinc-200", badge: "bg-zinc-500/10 text-zinc-500 border-zinc-200" },
    { label: "Hadir", value: daily.todayStats.hadir, icon: CheckCircle, color: "text-emerald-600", badge: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
    { label: "Izin / Sakit", value: daily.todayStats.izinSakit, icon: Clock, color: "text-blue-600", badge: "bg-blue-500/10 text-blue-600 border-blue-200" },
    { label: "Belum Absen", value: daily.todayStats.belumAbsen, icon: XCircle, color: "text-zinc-500", badge: "bg-zinc-500/10 text-zinc-500 border-zinc-200" },
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

      <AttendanceTabNav activeId="presence" />
      <AttendanceKPICards cards={kpiCards} />

      {/* Date Navigator + Search */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex items-center gap-3 bg-white/50 dark:bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 w-fit">
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => daily.setSelectedDate(d => format(subDays(new Date(d), 1), "yyyy-MM-dd"))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 font-semibold text-xs px-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={daily.selectedDate}
              onChange={e => daily.setSelectedDate(e.target.value)}
              className="border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto font-semibold cursor-pointer w-28 text-center text-xs"
            />
          </div>
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => daily.setSelectedDate(d => format(addDays(new Date(d), 1), "yyyy-MM-dd"))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          {daily.selectedDate !== format(new Date(), "yyyy-MM-dd") && (
            <Button size="sm" variant="ghost" className="h-8 rounded-lg text-xs" onClick={() => daily.setSelectedDate(format(new Date(), "yyyy-MM-dd"))}>
              Hari Ini
            </Button>
          )}
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari guru atau staf..."
            value={daily.todaySearch}
            onChange={e => daily.setTodaySearch(e.target.value)}
            className="pl-9 rounded-xl glass text-xs h-9"
          />
        </div>
      </div>

      {/* Daily Table */}
      <DailyAttendanceTable
        title={`Daftar Kehadiran Hari Ini — ${format(new Date(daily.selectedDate), "d MMMM yyyy", { locale: localeId })}`}
        loading={daily.todayLoading}
        data={daily.filteredTodayStaffList}
        onEdit={modal.handleOpenEdit}
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
