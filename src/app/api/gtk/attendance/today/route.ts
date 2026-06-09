import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { requireTenantMembership } from "@/lib/api-utils"

/**
 * GET /api/gtk/attendance/today?tenantId=&staffId=
 * Returns today's attendance record for a staff member
 */
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  const staffId = url.searchParams.get("staffId")

  if (!tenantId || !staffId) {
    return NextResponse.json({ error: "tenantId dan staffId diperlukan" }, { status: 400 })
  }

  const { error } = await requireTenantMembership(tenantId)
  if (error) return error

  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { settings: true } })
  const settings = (tenant?.settings as Record<string, any>) || {}
  const tz = settings.timezone || settings.attendance?.timezone || "Asia/Jakarta"

  const dateStr = new Date().toLocaleDateString("en-CA", { timeZone: tz })
  const today = new Date(`${dateStr}T00:00:00.000Z`)

  const record = await db.staffAttendance.findUnique({
    where: { tenantId_staffId_date: { tenantId, staffId, date: today } },
  })

  return NextResponse.json({ record, today: today.toISOString() })
}
