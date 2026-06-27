import { requireTenantAccess } from "@/lib/guards/tenant-guard"
import { getTenantId } from "@/lib/auth/get-tenant-id"
import { db } from "@/lib/db"
import { SumatifClient } from "./sumatif-client"

export const metadata = {
  title: "Nilai Sumatif - E-Rapor",
}

export default async function SumatifPage() {
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
