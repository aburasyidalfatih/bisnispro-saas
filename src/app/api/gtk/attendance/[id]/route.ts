import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { requireTenantMembership } from "@/lib/api-utils"
import { z } from "zod"

const checkOutSchema = z.object({
  tenantId: z.string(),
  status: z.enum(["HADIR", "IZIN", "SAKIT", "ALPHA"]).optional(),
  notes: z.string().optional(),
  checkOutLat: z.number().optional(),
  checkOutLng: z.number().optional(),
  checkOutPhoto: z.string().optional(),
})

/**
 * PATCH /api/gtk/attendance/[id]  — Check-out atau update status
 * DELETE /api/gtk/attendance/[id] — Admin hapus rekord
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const parsed = checkOutSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const oldRecord = await db.staffAttendance.findUnique({ where: { id } })
  if (!oldRecord) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { error } = await requireTenantMembership(oldRecord.tenantId)
  if (error) return error

  const { checkOutLat, checkOutLng } = parsed.data
  
  const tenant = await db.tenant.findUnique({ where: { id: oldRecord.tenantId }, select: { settings: true } })
  const settings = (tenant?.settings as Record<string, any>) || {}
  const attSettings = settings.attendance || {}
  const schoolLat = attSettings.schoolLat ? parseFloat(attSettings.schoolLat) : null
  const schoolLng = attSettings.schoolLng ? parseFloat(attSettings.schoolLng) : null
  const radius = attSettings.radiusGps ? parseInt(attSettings.radiusGps) : 0

  if (schoolLat && schoolLng && radius > 0) {
    if (!checkOutLat || !checkOutLng) {
      return NextResponse.json({ 
        error: `Akses ditolak: Absensi ini mewajibkan data lokasi GPS yang valid untuk check-out.`
      }, { status: 400 })
    }
    const R = 6371e3;
    const dLat = (checkOutLat - schoolLat) * Math.PI / 180;
    const dLon = (checkOutLng - schoolLng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(schoolLat * Math.PI / 180) * Math.cos(checkOutLat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distanceInMeters = R * c;

    if (distanceInMeters > radius) {
      return NextResponse.json({ 
        error: `Posisi Anda terlalu jauh dari lokasi sekolah untuk check-out. Jarak Anda: ${Math.round(distanceInMeters)} meter.`
      }, { status: 400 })
    }
  }

  const record = await db.staffAttendance.update({
    where: { id },
    data: {
      checkOutAt: new Date(),
      ...(checkOutLat ? { checkOutLat } : {}),
      ...(checkOutLng ? { checkOutLng } : {}),
      ...(parsed.data.checkOutPhoto ? { checkOutPhoto: parsed.data.checkOutPhoto } : {}),
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
      ...(parsed.data.notes ? { notes: parsed.data.notes } : {}),
    },
  })

  return NextResponse.json(record)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  
  const record = await db.staffAttendance.findUnique({ where: { id } })
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { error } = await requireTenantMembership(record.tenantId)
  if (error) return error

  await db.staffAttendance.delete({ where: { id } })
  return NextResponse.json({ message: "Rekord dihapus" })
}
