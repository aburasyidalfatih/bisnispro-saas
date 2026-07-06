import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get("tenantId")
    const classroomId = searchParams.get("classroomId")
    const staffId = searchParams.get("staffId")
    if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 })

    const where: any = { tenantId }
    if (classroomId) where.classroomId = classroomId
    if (staffId) where.staffId = staffId

    const schedules = await db.schedule.findMany({
      where,
      include: {
        subject: { select: { id: true, name: true, code: true } },
        classroom: { select: { id: true, name: true, level: true } },
        staff: { select: { id: true, name: true, imageUrl: true } },
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    })
    return NextResponse.json({ schedules })
  } catch {
    return NextResponse.json({ error: "Gagal memuat jadwal" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const body = await req.json()
    const { tenantId, classroomId, subjectId, staffId, dayOfWeek, startTime, endTime } = body
    if (!tenantId || !classroomId || !subjectId || !staffId || !dayOfWeek || !startTime || !endTime) {
      return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 })
    }

    // Deteksi bentrok jadwal (Clash Detection)
    // Cek apakah guru sudah punya jadwal di hari yang sama dengan rentang waktu yang tumpang tindih
    const clash = await db.schedule.findFirst({
      where: {
        tenantId,
        staffId,
        dayOfWeek: Number(dayOfWeek),
        startTime: { lt: endTime },
        endTime: { gt: startTime }
      },
      include: {
        classroom: { select: { name: true } }
      }
    })

    if (clash) {
      return NextResponse.json(
        { error: `Guru ini sudah memiliki jadwal di kelas ${clash.classroom.name} pada pukul ${clash.startTime} - ${clash.endTime}` }, 
        { status: 400 }
      )
    }

    const schedule = await db.schedule.create({
      data: { tenantId, classroomId, subjectId, staffId, dayOfWeek: Number(dayOfWeek), startTime, endTime },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        classroom: { select: { id: true, name: true } },
        staff: { select: { id: true, name: true } },
      },
    })
    return NextResponse.json({ schedule })
  } catch {
    return NextResponse.json({ error: "Gagal membuat jadwal" }, { status: 500 })
  }
}
