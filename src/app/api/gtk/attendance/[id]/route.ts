import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { requireTenantMembership } from "@/lib/api-utils"
import { z } from "zod"

const checkOutSchema = z.object({
  tenantId: z.string(),
  status: z.enum(["HADIR", "IZIN", "SAKIT", "ALPHA"]).optional(),
  notes: z.string().optional(),
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

  const { error } = await requireTenantMembership(parsed.data.tenantId)
  if (error) return error

  const record = await db.staffAttendance.update({
    where: { id },
    data: {
      checkOutAt: new Date(),
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
