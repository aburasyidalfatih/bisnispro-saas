import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { requireTenantMembership } from "@/lib/api-utils"
import { addDays, format, differenceInDays } from "date-fns"

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { status, tenantId } = await req.json()
    if (!tenantId || !status) return NextResponse.json({ error: "tenantId dan status diperlukan" }, { status: 400 })

    const { error } = await requireTenantMembership(tenantId)
    if (error) return error

    // Fetch the permit
    const permit = await db.staffPermit.findUnique({
      where: { id: params.id },
    })

    if (!permit) return NextResponse.json({ error: "Data perizinan tidak ditemukan" }, { status: 404 })
    if (permit.tenantId !== tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Update permit status
    const updatedPermit = await db.staffPermit.update({
      where: { id: params.id },
      data: {
        status,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
      },
    })

    // If approved, insert attendance records
    if (status === "APPROVED") {
      const start = new Date(permit.startDate)
      const end = new Date(permit.endDate)
      const days = differenceInDays(end, start) + 1

      // We use timezone logic similar to the manual attendance
      const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { settings: true } })
      const settings = (tenant?.settings as Record<string, any>) || {}
      const tz = settings.attendance?.timezone || "Asia/Jakarta"

      const attendanceStatus = permit.type.toUpperCase() // e.g. "SAKIT" or "IZIN"

      for (let i = 0; i < days; i++) {
        const currentDate = addDays(start, i)
        const dateStr = format(currentDate, "yyyy-MM-dd")
        const dateIso = new Date(`${dateStr}T00:00:00.000Z`)

        await db.staffAttendance.upsert({
          where: {
            tenantId_staffId_date: {
              tenantId: permit.tenantId,
              staffId: permit.staffId,
              date: dateIso,
            },
          },
          update: {
            status: attendanceStatus,
            notes: `Disetujui dari pengajuan izin: ${permit.reason}`,
          },
          create: {
            tenantId: permit.tenantId,
            staffId: permit.staffId,
            date: dateIso,
            status: attendanceStatus,
            notes: `Disetujui dari pengajuan izin: ${permit.reason}`,
          },
        })
      }
    }

    return NextResponse.json({ success: true, data: updatedPermit })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Terjadi kesalahan" }, { status: 500 })
  }
}
