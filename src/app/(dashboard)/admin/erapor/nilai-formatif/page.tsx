import { requireTenantMembership } from "@/lib/api-utils"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { FormatifClient } from "./formatif-client"
import { getUserStaffContext } from "@/features/academic/actions/erapor.action"

export const metadata = {
  title: "Nilai Formatif - E-Rapor",
}

export default async function FormatifPage() {
  const session = await auth()
  const tenantId = session?.user?.tenants?.[0]?.id
  if (!tenantId) return <div>Tenant tidak ditemukan</div>
  
  const { error: accessError } = await requireTenantMembership(tenantId);
  if (accessError) throw new Error("Unauthorized")
  
  const ctx = await getUserStaffContext(tenantId)
  if (!ctx) return <div>Akses Ditolak</div>

  let classrooms = []
  let subjects = []

  if (ctx.isAdmin || !ctx.staffId) {
    classrooms = await db.classroom.findMany({ where: { tenantId }, orderBy: { name: 'asc' } })
    subjects = await db.subject.findMany({ where: { tenantId }, orderBy: { name: 'asc' } })
  } else {
    // If it's a teacher, we get unique classrooms and subjects from their schedule
    const schedules = await db.schedule.findMany({
      where: { tenantId, staffId: ctx.staffId },
      include: { classroom: true, subject: true }
    })
    
    // Extract unique classrooms
    const cMap = new Map()
    schedules.forEach(s => cMap.set(s.classroomId, s.classroom))
    classrooms = Array.from(cMap.values()).sort((a: any, b: any) => a.name.localeCompare(b.name))
    
    // Extract unique subjects
    const sMap = new Map()
    schedules.forEach(s => sMap.set(s.subjectId, s.subject))
    subjects = Array.from(sMap.values()).sort((a: any, b: any) => a.name.localeCompare(b.name))
  }

  // Get TPs to populate dropdowns
  const learningObjectives = await db.learningObjective.findMany({
    where: { tenantId },
    orderBy: { code: 'asc' },
    take: 200,
  })

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Nilai Formatif</h1>
        <p className="text-muted-foreground">
          Input nilai formatif siswa berdasarkan Tujuan Pembelajaran (TP) yang telah disusun.
        </p>
      </div>

      <FormatifClient 
        tenantId={tenantId}
        classrooms={classrooms}
        subjects={subjects}
        learningObjectives={learningObjectives}
      />
    </div>
  )
}
