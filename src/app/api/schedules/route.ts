import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { requireTenantMembership } from "@/lib/api-utils"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get("tenantId")
    const classroomId = searchParams.get("classroomId")
    const staffId = searchParams.get("staffId")
    if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 })
    const { error: accessError } = await requireTenantMembership(tenantId)
    if (accessError) return accessError

    const where: any = { tenantId }
    if (classroomId) where.classroomId = classroomId
    if (staffId) where.staffId = staffId

    const schedules = await db.schedule.findMany({
      where,
      take: 300,
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
    const { tenantId, classroomId, subjectId, staffId, dayOfWeek, startTime, endTime, isBreak, breakName } = body
    if (!tenantId || !classroomId || !dayOfWeek || !startTime || !endTime) {
      return NextResponse.json({ error: "Semua field waktu dan hari wajib diisi" }, { status: 400 })
    }
    if (!isBreak && (!subjectId || !staffId)) {
      return NextResponse.json({ error: "Guru dan Mata Pelajaran wajib dipilih" }, { status: 400 })
    }
    const { error: accessError } = await requireTenantMembership(tenantId)
    if (accessError) return accessError

    // Deteksi bentrok jadwal (Clash Detection) hanya jika bukan istirahat
    if (!isBreak) {
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
    }

    const schedule = await db.schedule.create({
      data: { 
        tenantId, classroomId, 
        subjectId: isBreak ? null : subjectId, 
        staffId: isBreak ? null : staffId, 
        isBreak: isBreak || false,
        breakName: isBreak ? breakName : null,
        dayOfWeek: Number(dayOfWeek), startTime, endTime 
      },
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
