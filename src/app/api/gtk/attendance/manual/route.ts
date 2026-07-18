import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { requireTenantMembership } from "@/lib/api-utils"

const manualSchema = z.object({
  tenantId: z.string(),
  staffId: z.string(),
  date: z.string(), // ISO date string
  status: z.enum(["HADIR", "IZIN", "SAKIT", "ALPHA"]),
  checkInAt: z.string().optional(),
  checkOutAt: z.string().optional(),
  notes: z.string().optional(),
})

/**
 * POST /api/gtk/attendance/manual
 * Admin membuat/mengedit rekord absensi guru secara manual
 */
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body
  try {
    body = await req.json()
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 })
  }
  const parsed = manualSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { tenantId, staffId, date, status, checkInAt, checkOutAt, notes } = parsed.data

  const { error } = await requireTenantMembership(tenantId)
  if (error) return error

  const dateObj = new Date(`${date}T00:00:00.000Z`)

  const record = await db.staffAttendance.upsert({
    where: { tenantId_staffId_date: { tenantId, staffId, date: dateObj } },
    create: {
      tenantId, staffId, date: dateObj, status, notes,
      checkInAt: checkInAt ? new Date(checkInAt) : undefined,
      checkOutAt: checkOutAt ? new Date(checkOutAt) : undefined,
    },
    update: {
      status, notes,
      checkInAt: checkInAt ? new Date(checkInAt) : undefined,
      checkOutAt: checkOutAt ? new Date(checkOutAt) : undefined,
    },
  })

  return NextResponse.json(record, { status: 201 })
}
