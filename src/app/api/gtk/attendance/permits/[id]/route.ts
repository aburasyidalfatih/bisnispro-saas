import { NextResponse } from "next/server"
import { runWithTenantContext } from "@/lib/db"
import { auth } from "@/lib/auth"
import { requireTenantMembership } from "@/lib/api-utils"
import { addDays, format, differenceInDays } from "date-fns"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const { status, tenantId } = await req.json()
    if (!tenantId || !status) return NextResponse.json({ error: "tenantId dan status diperlukan" }, { status: 400 })

    const { error } = await requireTenantMembership(tenantId)
    if (error) return error

    const result = await runWithTenantContext(tenantId, async (tx) => {
      const permit = await tx.staffPermit.findFirst({
        where: { id, tenantId },
      })

      if (!permit) return null

      const updatedPermit = await tx.staffPermit.update({
        where: { id, tenantId },
        data: {
          status,
          reviewedBy: session.user.id,
          reviewedAt: new Date(),
        },
      })

      if (status === "APPROVED") {
        const start = new Date(permit.startDate)
        const end = new Date(permit.endDate)
        const days = differenceInDays(end, start) + 1
        const attendanceStatus = permit.type.toUpperCase()

        for (let i = 0; i < days; i++) {
          const currentDate = addDays(start, i)
          const dateStr = format(currentDate, "yyyy-MM-dd")
          const dateIso = new Date(`${dateStr}T00:00:00.000Z`)

          await tx.staffAttendance.upsert({
            where: {
              tenantId_staffId_date: {
                tenantId,
                staffId: permit.staffId,
                date: dateIso,
              },
            },
            update: {
              status: attendanceStatus,
              notes: `Disetujui dari pengajuan izin: ${permit.reason}`,
            },
            create: {
              tenantId,
              staffId: permit.staffId,
              date: dateIso,
              status: attendanceStatus,
              notes: `Disetujui dari pengajuan izin: ${permit.reason}`,
            },
          })
        }
      }

      return updatedPermit
    })

    if (!result) return NextResponse.json({ error: "Data perizinan tidak ditemukan" }, { status: 404 })

    return NextResponse.json({ success: true, data: result })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Terjadi kesalahan" }, { status: 500 })
  }
}
