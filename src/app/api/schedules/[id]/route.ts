import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { requireTenantMembership } from "@/lib/api-utils"

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { id } = await params
    const record = await db.schedule.findUnique({ where: { id } })
    if (!record) return NextResponse.json({ error: "Not Found" }, { status: 404 })
    const { error } = await requireTenantMembership(record.tenantId)
    if (error) return error
    await db.schedule.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Gagal menghapus jadwal" }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { id } = await params
    
    const record = await db.schedule.findUnique({ where: { id } })
    if (!record) return NextResponse.json({ error: "Not Found" }, { status: 404 })
    const { error } = await requireTenantMembership(record.tenantId)
    if (error) return error

    const body = await req.json()
    const { subjectId, staffId, dayOfWeek, startTime, endTime, isBreak, breakName } = body
    const schedule = await db.schedule.update({
      where: { id },
      data: { 
        subjectId: isBreak ? null : subjectId, 
        staffId: isBreak ? null : staffId, 
        dayOfWeek: Number(dayOfWeek), 
        startTime, 
        endTime,
        isBreak: Boolean(isBreak),
        breakName: isBreak ? breakName : null
      },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        classroom: { select: { id: true, name: true } },
        staff: { select: { id: true, name: true } },
      },
    })
    return NextResponse.json({ schedule })
  } catch {
    return NextResponse.json({ error: "Gagal update jadwal" }, { status: 500 })
  }
}
