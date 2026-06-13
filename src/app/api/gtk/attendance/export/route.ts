import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { requireTenantMembership } from "@/lib/api-utils"
import {
  createGtkAttendanceExportWorkbook,
  resolveGtkAttendanceExportPeriod,
} from "@/features/attendance/services/gtk-attendance-export.service"

export const runtime = "nodejs"

function sanitizeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "")
}

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  if (!tenantId) return NextResponse.json({ error: "tenantId diperlukan" }, { status: 400 })

  const { error } = await requireTenantMembership(tenantId, ["admin", "owner"])
  if (error) return error

  try {
    const period = resolveGtkAttendanceExportPeriod(url.searchParams)

    const [tenant, staff, records] = await Promise.all([
      db.tenant.findUnique({
        where: { id: tenantId },
        select: { name: true, settings: true },
      }),
      db.staff.findMany({
        where: { tenantId },
        select: { id: true, name: true, role: true },
        orderBy: { name: "asc" },
      }),
      db.staffAttendance.findMany({
        where: {
          tenantId,
          deletedAt: null,
          date: {
            gte: period.fromDate,
            lte: period.toDate,
          },
        },
        include: {
          staff: { select: { id: true, name: true, role: true } },
        },
        orderBy: [
          { date: "asc" },
          { staff: { name: "asc" } },
        ],
      }),
    ])

    if (!tenant) return NextResponse.json({ error: "Tenant tidak ditemukan" }, { status: 404 })

    const settings = (tenant.settings as Record<string, any>) || {}
    const timeZone = settings.timezone || settings.attendance?.timezone || "Asia/Jakarta"
    const buffer = await createGtkAttendanceExportWorkbook({
      tenantName: tenant.name,
      period,
      staff,
      records,
      timeZone,
    })
    const filename = sanitizeFileName(`Laporan_Presensi_GTK_${period.slug}.xlsx`)

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal membuat file export"
    const status = message.includes("format") || message.includes("valid") || message.includes("Tanggal") || message.includes("Mode") ? 400 : 500
    console.error("[GTK_ATTENDANCE_EXPORT]", error)
    return NextResponse.json({ error: message }, { status })
  }
}
