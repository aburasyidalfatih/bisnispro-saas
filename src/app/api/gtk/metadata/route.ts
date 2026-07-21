import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { requireTenantMembership } from "@/lib/api-utils"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get("tenantId")

    if (!tenantId) {
      return new NextResponse("Missing tenantId", { status: 400 })
    }
    const { error: accessError } = await requireTenantMembership(tenantId)
    if (accessError) return accessError

    // Ambil data staf dari user yang login
    const staff = await db.staff.findFirst({
      where: { userId: session.user.id, tenantId }
    })

    const [classrooms, subjects, scheduleToday] = await Promise.all([
      db.classroom.findMany({
        where: { tenantId, isActive: true },
        select: { id: true, name: true, level: true },
        orderBy: [{ level: 'asc' }, { name: 'asc' }]
      }),
      db.subject.findMany({
        where: { tenantId, isActive: true },
        select: { id: true, name: true, code: true },
        orderBy: { name: 'asc' }
      }),
      staff ? db.schedule.findMany({
        where: { 
          tenantId, 
          staffId: staff.id,
          // dayOfWeek = 0 (Minggu) - 6 (Sabtu)
          dayOfWeek: new Date().getDay()
        },
        include: {
          classroom: { select: { id: true, name: true } },
          subject: { select: { id: true, name: true } }
        },
        orderBy: { startTime: 'asc' }
      }) : []
    ])

    return NextResponse.json({
      classrooms,
      subjects,
      scheduleToday,
      staffId: staff?.id || null
    })

  } catch (error) {
    console.error("[GTK_METADATA_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
