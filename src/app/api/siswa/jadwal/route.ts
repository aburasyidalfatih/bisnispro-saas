import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const tenantId = session.user.tenants?.[0]?.id

  try {
    const student = await db.student.findFirst({
      where: { userId: session.user.id, tenantId }
    })

    if (!student) {
      return NextResponse.json({ error: "Siswa tidak ditemukan" }, { status: 404 })
    }

    // Get schedule for all days or just today based on query, but for now we'll get all and group them
    const schedules = await db.schedule.findMany({
      where: { classroomId: student.classroomId || "", tenantId },
      include: {
        subject: true,
        staff: true
      },
      orderBy: { startTime: "asc" }
    })

    const today = new Date()
    const currentDayInt = today.getDay() // 0 = Minggu, 1 = Senin, ...
    const todayDateStr = today.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

    const scheduleToday = schedules.filter((s: any) => s.dayOfWeek === currentDayInt).map((s: any) => ({
      time: `${s.startTime} - ${s.endTime}`,
      subject: s.subject?.name || "Tanpa Mapel",
      teacher: s.staff?.name || "Tanpa Guru",
      room: "Ruang Kelas",
      color: "bg-blue-50 border-blue-200",
      iconText: "text-blue-600"
    }))

    // Add a break time if needed, or rely strictly on DB.
    
    return NextResponse.json({ scheduleToday, todayDateStr, allSchedules: schedules })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
