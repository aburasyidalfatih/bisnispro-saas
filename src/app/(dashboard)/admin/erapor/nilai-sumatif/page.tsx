import { requireTenantAccess } from "@/lib/guards/tenant-guard"
import { getTenantId } from "@/lib/auth/get-tenant-id"
import { db } from "@/lib/db"
import { SumatifClient } from "./sumatif-client"
import { getUserStaffContext } from "@/features/academic/actions/erapor.action"

export const metadata = {
  title: "Nilai Sumatif - E-Rapor",
}

export default async function SumatifPage() {
  const tenantId = await getTenantId()
  await requireTenantAccess(tenantId)

  const ctx = await getUserStaffContext(tenantId)
  if (!ctx) return <div>Akses Ditolak</div>

  let classrooms = []
  let subjects = []

  if (ctx.isAdmin || !ctx.staffId) {
    classrooms = await db.classroom.findMany({ where: { tenantId }, orderBy: { name: 'asc' } })
    subjects = await db.subject.findMany({ where: { tenantId }, orderBy: { name: 'asc' } })
  } else {
    const schedules = await db.schedule.findMany({
      where: { tenantId, staffId: ctx.staffId },
      include: { classroom: true, subject: true }
    })
    
    const cMap = new Map()
    schedules.forEach(s => cMap.set(s.classroomId, s.classroom))
    classrooms = Array.from(cMap.values()).sort((a: any, b: any) => a.name.localeCompare(b.name))
    
    const sMap = new Map()
    schedules.forEach(s => sMap.set(s.subjectId, s.subject))
    subjects = Array.from(sMap.values()).sort((a: any, b: any) => a.name.localeCompare(b.name))
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Nilai Sumatif</h1>
        <p className="text-muted-foreground">
          Input nilai Sumatif Lingkup Materi dan Sumatif Akhir Semester (SAS).
        </p>
      </div>

      <SumatifClient 
        tenantId={tenantId}
        classrooms={classrooms}
        subjects={subjects}
      />
    </div>
  )
}
