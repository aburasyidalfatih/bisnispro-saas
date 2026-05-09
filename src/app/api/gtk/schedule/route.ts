import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

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

    const staff = await db.staff.findFirst({
      where: { userId: session.user.id, tenantId }
    })

    if (!staff) {
      return new NextResponse("Staff profile not found", { status: 404 })
    }

    const schedules = await db.schedule.findMany({
      where: {
        tenantId,
        staffId: staff.id
      },
      include: {
        classroom: { select: { name: true, level: true } },
        subject: { select: { name: true, code: true } }
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    })

    return NextResponse.json({ schedules, staffId: staff.id })

  } catch (error) {
    console.error("[GTK_SCHEDULE_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
