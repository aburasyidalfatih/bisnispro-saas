import { requireTenantMembership } from "@/lib/api-utils"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { TpClient } from "./tp-client"
import { getLearningObjectives } from "@/features/academic/actions/erapor.action"

export const metadata = {
  title: "Tujuan Pembelajaran - E-Rapor",
}

export default async function TpPage() {
  const session = await auth()
  const tenantId = session?.user?.tenants?.[0]?.id
  if (!tenantId) return <div>Lembaga tidak ditemukan</div>
  
  const { error: accessError } = await requireTenantMembership(tenantId);
  if (accessError) throw new Error("Unauthorized")

  const subjects = await db.subject.findMany({
    where: { tenantId },
    orderBy: { name: 'asc' }
  })

  // Fetch all TP for this tenant to display initially
  const learningObjectives = await getLearningObjectives(tenantId)

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Tujuan Pembelajaran (TP)</h1>
        <p className="text-muted-foreground">
          Kelola Tujuan Pembelajaran untuk setiap mata pelajaran sebagai dasar penilaian Kurikulum Merdeka.
        </p>
      </div>

      <TpClient 
        tenantId={tenantId} 
        subjects={subjects} 
        initialObjectives={learningObjectives} 
      />
    </div>
  )
}
