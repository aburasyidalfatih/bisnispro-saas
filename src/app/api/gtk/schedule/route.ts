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

    const mySchedules = await db.schedule.findMany({
      where: {
        tenantId,
        staffId: staff.id
      },
      include: {
        classroom: { select: { name: true, level: true } },
        subject: { select: { name: true, code: true } }
      }
    })

    const classroomIds = Array.from(new Set(mySchedules.map(s => s.classroomId)))

    const breakSchedules = await db.schedule.findMany({
      where: {
        tenantId,
        isBreak: true,
        classroomId: { in: classroomIds }
      },
      include: {
        classroom: { select: { name: true, level: true } }
      }
    })

    // Deduplicate breaks with same name, day, and time
    const uniqueBreaks = breakSchedules.reduce((acc, curr) => {
      const key = `${curr.dayOfWeek}-${curr.startTime}-${curr.endTime}-${curr.breakName}`
      if (!acc.has(key)) acc.set(key, curr)
      return acc
    }, new Map()).values()

    const allSchedules = [...mySchedules, ...Array.from(uniqueBreaks)]
    
    // Sort
    allSchedules.sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek
      return a.startTime.localeCompare(b.startTime)
    })

    return NextResponse.json({ schedules: allSchedules, staffId: staff.id })

  } catch (error) {
    console.error("[GTK_SCHEDULE_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
