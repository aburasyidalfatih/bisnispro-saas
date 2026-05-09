import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get("tenantId")
    if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 })

    // Ensure caller is a staff in this tenant
    const staff = await db.staff.findFirst({ where: { tenantId, userId: session.user.id } })
    if (!staff) return NextResponse.json({ error: "Profil staff tidak ditemukan" }, { status: 404 })

    // Get classrooms where this staff teaches (via schedules)
    const classroomIds = await db.schedule.findMany({
      where: { tenantId, staffId: staff.id },
      select: { classroomId: true },
      distinct: ["classroomId"],
    })
    const ids = classroomIds.map((c) => c.classroomId)

    const classrooms = await db.classroom.findMany({
      where: { tenantId, id: { in: ids }, isActive: true },
      include: {
        students: {
          where: { isActive: true },
          select: { id: true, name: true, nis: true },
          orderBy: { name: "asc" },
        },
      },
    })
    return NextResponse.json({ classrooms, staffId: staff.id })
  } catch {
    return NextResponse.json({ error: "Gagal memuat kelas" }, { status: 500 })
  }
}
