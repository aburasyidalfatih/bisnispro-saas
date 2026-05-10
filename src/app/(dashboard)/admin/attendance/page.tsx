import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Users, GraduationCap, FileCheck, CalendarCheck, ArrowRight, Activity, Clock } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { id } from "date-fns/locale"

export default async function AttendanceOverviewPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const tenantId = session.user.tenants?.[0]?.id
  if (!tenantId) redirect("/admin")

  const todayStr = format(new Date(), "yyyy-MM-dd")

  // Fetch quick stats
  // 1. Pending Permits
  const pendingPermitsCount = await db.attendancePermit.count({
    where: { tenantId, status: "PENDING" }
  })

  // 2. Student Attendance Today
  const totalStudents = await db.student.count({
    where: { tenantId, isActive: true }
  })

  const studentAttendanceToday = await db.attendanceRecord.count({
    where: { 
      tenantId, 
      session: {
        date: new Date(todayStr)
      }
    }
  })

  // 3. GTK Attendance Today
  const totalGtk = await db.tenantUser.count({
    where: { tenantId, role: "guru" }
  })

  const gtkAttendanceToday = await db.staffAttendance.count({
    where: { 
      tenantId, 
      date: new Date(todayStr),
      status: "HADIR"
    }
  })

  const studentPercent = totalStudents > 0 ? Math.round((studentAttendanceToday / totalStudents) * 100) : 0
  const gtkPercent = totalGtk > 0 ? Math.round((gtkAttendanceToday / totalGtk) * 100) : 0

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Overview Kehadiran & Presensi</h1>
        <p className="text-muted-foreground text-sm">Ringkasan data absensi siswa dan guru untuk hari ini: {format(new Date(), "EEEE, dd MMMM yyyy", { locale: id })}.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-3 gap-5">
        <Card className="glass border-0 shadow-lg overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-5">
             <GraduationCap className="w-24 h-24 -mr-6 -mt-6" />
          </div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Kehadiran Siswa</p>
                <h3 className="text-2xl font-black">{studentPercent}%</h3>
              </div>
            </div>
            <div className="flex justify-between items-center text-xs text-muted-foreground border-t pt-3">
               <span>{studentAttendanceToday} hadir dari {totalStudents} siswa</span>
               <Link href="/admin/attendance/students" className="text-blue-600 font-semibold hover:underline flex items-center gap-1">Detail <ArrowRight className="h-3 w-3"/></Link>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-0 shadow-lg overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-5">
             <Users className="w-24 h-24 -mr-6 -mt-6" />
          </div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Kehadiran GTK</p>
                <h3 className="text-2xl font-black">{gtkPercent}%</h3>
              </div>
            </div>
            <div className="flex justify-between items-center text-xs text-muted-foreground border-t pt-3">
               <span>{gtkAttendanceToday} hadir dari {totalGtk} guru</span>
               <Link href="/admin/attendance/gtk" className="text-purple-600 font-semibold hover:underline flex items-center gap-1">Detail <ArrowRight className="h-3 w-3"/></Link>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-0 shadow-lg overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-5">
             <FileCheck className="w-24 h-24 -mr-6 -mt-6" />
          </div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                <FileCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Menunggu Izin</p>
                <h3 className="text-2xl font-black">{pendingPermitsCount}</h3>
              </div>
            </div>
            <div className="flex justify-between items-center text-xs text-muted-foreground border-t pt-3">
               <span>Pengajuan izin butuh respon</span>
               <Link href="/admin/attendance/permits" className="text-amber-600 font-semibold hover:underline flex items-center gap-1">Proses <ArrowRight className="h-3 w-3"/></Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Menu */}
      <h2 className="text-lg font-bold mt-8 mb-4">Menu Presensi</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
         <Link href="/admin/attendance/students">
            <Card className="hover:border-primary hover:shadow-md transition-all cursor-pointer h-full">
               <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                  <div className="h-14 w-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                     <GraduationCap className="h-7 w-7" />
                  </div>
                  <div>
                     <p className="font-bold text-sm">Absensi Siswa</p>
                     <p className="text-[10px] text-muted-foreground mt-1">Rekap dan kelola absensi harian siswa</p>
                  </div>
               </CardContent>
            </Card>
         </Link>
         
         <Link href="/admin/attendance/gtk">
            <Card className="hover:border-primary hover:shadow-md transition-all cursor-pointer h-full">
               <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                  <div className="h-14 w-14 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                     <Users className="h-7 w-7" />
                  </div>
                  <div>
                     <p className="font-bold text-sm">Absensi Guru (GTK)</p>
                     <p className="text-[10px] text-muted-foreground mt-1">Rekap kehadiran pegawai dan guru</p>
                  </div>
               </CardContent>
            </Card>
         </Link>

         <Link href="/admin/attendance/permits">
            <Card className="hover:border-primary hover:shadow-md transition-all cursor-pointer h-full">
               <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                  <div className="h-14 w-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                     <FileCheck className="h-7 w-7" />
                  </div>
                  <div>
                     <p className="font-bold text-sm">Pengajuan Izin</p>
                     <p className="text-[10px] text-muted-foreground mt-1">Verifikasi surat sakit atau izin</p>
                  </div>
               </CardContent>
            </Card>
         </Link>

         <Link href="/admin/schedules">
            <Card className="hover:border-primary hover:shadow-md transition-all cursor-pointer h-full">
               <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                  <div className="h-14 w-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                     <CalendarCheck className="h-7 w-7" />
                  </div>
                  <div>
                     <p className="font-bold text-sm">Jadwal Pelajaran</p>
                     <p className="text-[10px] text-muted-foreground mt-1">Atur jadwal untuk acuan absensi</p>
                  </div>
               </CardContent>
            </Card>
         </Link>
      </div>
    </div>
  )
}
