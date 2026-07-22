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
    const dateParam = searchParams.get("date") // Format YYYY-MM-DD

    if (!tenantId) {
      return new NextResponse("Missing tenantId", { status: 400 })
    }

    // Determine the date to query
    let targetDate: Date
    if (dateParam) {
      targetDate = new Date(dateParam)
    } else {
      // Default to today (timezone aware if possible, but let's just use UTC start of day for now, 
      // or match the exact date stored in DB which is usually truncated to 00:00:00)
      const now = new Date()
      targetDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
    }

    // Get all staff (teachers)
    const activeStaff = await db.staff.findMany({
      where: {
        tenantId,
      },
      select: {
        id: true,
        name: true,
        imageUrl: true,
      },
      orderBy: {
        name: "asc",
      }
    })

    // Get all journals for the target date
    const journals = await db.teacherJournal.findMany({
      where: {
        tenantId,
        date: targetDate,
      },
      include: {
        staff: {
          select: { id: true, name: true, imageUrl: true }
        },
        classroom: {
          select: { id: true, name: true, level: true }
        },
        subject: {
          select: { id: true, name: true, code: true }
        },
        presences: {
          select: { status: true, student: { select: { name: true } } }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    // Find who hasn't submitted ANY journal today
    const submittedStaffIds = new Set(journals.map(j => j.staffId))
    const unsubmittedStaff = activeStaff.filter(staff => !submittedStaffIds.has(staff.id))

    return NextResponse.json({
      journals,
      unsubmittedStaff,
      stats: {
        totalStaff: activeStaff.length,
        submittedCount: submittedStaffIds.size,
        unsubmittedCount: unsubmittedStaff.length
      },
      targetDate: targetDate.toISOString()
    })

  } catch (error) {
    console.error("[ADMIN_JOURNALS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
