import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { requireTenantMembership } from "@/lib/api-utils"
import { z } from "zod"

const checkInSchema = z.object({
  tenantId: z.string(),
  staffId: z.string(),
  checkInLat: z.number().optional(),
  checkInLng: z.number().optional(),
  checkInPhoto: z.string().optional(),
  notes: z.string().optional(),
})

/**
 * GET  /api/gtk/attendance?tenantId=&staffId=&from=&to=
 * POST /api/gtk/attendance  — Check-in (upsert rekord hari ini)
 */
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  const staffId = url.searchParams.get("staffId")
  const from = url.searchParams.get("from")
  const to = url.searchParams.get("to")
  const page = parseInt(url.searchParams.get("page") || "1")
  const take = parseInt(url.searchParams.get("take") || "30")

  if (!tenantId) return NextResponse.json({ error: "tenantId diperlukan" }, { status: 400 })

  const { error } = await requireTenantMembership(tenantId, ["admin", "owner", "guru"])
  if (error) return error

  const where: any = {
    tenantId,
    ...(staffId ? { staffId } : {}),
    ...(from || to ? {
      date: {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      },
    } : {}),
  }

  const [records, total] = await Promise.all([
    db.staffAttendance.findMany({
      where,
      include: { staff: { select: { id: true, name: true, role: true, imageUrl: true } } },
      orderBy: { date: "desc" },
      skip: (page - 1) * take,
      take,
    }),
    db.staffAttendance.count({ where }),
  ])

  return NextResponse.json({ data: records, meta: { total, page, totalPages: Math.ceil(total / take) } })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const parsed = checkInSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { tenantId, staffId, checkInLat, checkInLng, checkInPhoto, notes } = parsed.data

  const { error } = await requireTenantMembership(tenantId, ["admin", "owner", "guru"])
  if (error) return error

  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { settings: true } })
  const settings = (tenant?.settings as Record<string, any>) || {}
  const tz = settings.timezone || settings.attendance?.timezone || "Asia/Jakarta"

  const dateStr = new Date().toLocaleDateString("en-CA", { timeZone: tz })
  const today = new Date(`${dateStr}T00:00:00.000Z`)

  // Upsert: create jika belum ada rekord hari ini, update jika sudah ada
  // Perbaikan Bug: update TIDAK boleh menimpa checkInAt
  const record = await db.staffAttendance.upsert({
    where: { tenantId_staffId_date: { tenantId, staffId, date: today } },
    create: {
      tenantId,
      staffId,
      date: today,
      checkInAt: new Date(),
      checkInLat,
      checkInLng,
      checkInPhoto,
      status: "HADIR",
      notes,
    },
    update: {
      checkInLat,
      checkInLng,
      checkInPhoto,
      status: "HADIR",
      notes,
    },
  })

  return NextResponse.json(record, { status: 201 })
}
