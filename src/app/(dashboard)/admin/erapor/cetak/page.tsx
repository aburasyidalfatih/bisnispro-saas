import { requireTenantAccess } from "@/lib/guards/tenant-guard"
import { getTenantId } from "@/lib/auth/get-tenant-id"
import { db } from "@/lib/db"
import { CetakClient } from "./cetak-client"
import { getUserStaffContext } from "@/features/academic/actions/erapor.action"

export const metadata = {
  title: "Cetak Rapor - E-Rapor",
}

export default async function CetakRaporPage() {
  const tenantId = await getTenantId()
  await requireTenantAccess(tenantId)

  const ctx = await getUserStaffContext(tenantId)
  if (!ctx) return <div>Akses Ditolak</div>

  let classrooms = []

  if (ctx.isAdmin || !ctx.staffId) {
    classrooms = await db.classroom.findMany({ where: { tenantId }, orderBy: { name: 'asc' } })
  } else {
    // For cetak rapor, a teacher can only see classes where they are the homeroom teacher (Wali Kelas)
    classrooms = await db.classroom.findMany({ 
      where: { tenantId, waliKelasId: ctx.staffId }, 
      orderBy: { name: 'asc' } 
    })
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Cetak Rapor Wali Kelas</h1>
        <p className="text-muted-foreground">
          Kelola data ketidakhadiran, catatan wali kelas, dan generate PDF E-Rapor siswa.
        </p>
      </div>

      <CetakClient 
        tenantId={tenantId}
        classrooms={classrooms}
      />
    </div>
  )
}
