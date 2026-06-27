import { requireTenantAccess } from "@/lib/guards/tenant-guard"
import { getTenantId } from "@/lib/auth/get-tenant-id"
import { db } from "@/lib/db"
import { FormatifClient } from "./formatif-client"

export const metadata = {
  title: "Nilai Formatif - E-Rapor",
}

export default async function FormatifPage() {
  const tenantId = await getTenantId()
  await requireTenantAccess(tenantId)

  const classrooms = await db.classroom.findMany({
    where: { tenantId },
    orderBy: { name: 'asc' }
  })

  const subjects = await db.subject.findMany({
    where: { tenantId },
    orderBy: { name: 'asc' }
  })

  // Get TPs to populate dropdowns
  const learningObjectives = await db.learningObjective.findMany({
    where: { tenantId },
    orderBy: { code: 'asc' }
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
