import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireTenantMembership } from "@/lib/api-utils"
import { z } from "zod"
import { auth } from "@/lib/auth"

const sessionSchema = z.object({
  tenantId: z.string(),
  classroomId: z.string().optional(),
  date: z.string(), // ISO date string
  type: z.enum(["DAILY", "EXAM", "EXTRACURRICULAR"]).default("DAILY"),
})

export async function GET(req: Request) {
  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  const classroomId = url.searchParams.get("classroomId")
  const date = url.searchParams.get("date")
  const page = parseInt(url.searchParams.get("page") || "1")

  if (!tenantId) return NextResponse.json({ error: "tenantId diperlukan" }, { status: 400 })
  const { error } = await requireTenantMembership(tenantId)
  if (error) return error

  const where: any = { tenantId }
  if (classroomId) where.classroomId = classroomId
  if (date) {
    const d = new Date(date)
    const nextDay = new Date(d)
    nextDay.setDate(nextDay.getDate() + 1)
    where.date = { gte: d, lt: nextDay }
  }

  const [sessions, total] = await Promise.all([
    db.attendanceSession.findMany({
      where,
      include: {
        classroom: { select: { id: true, name: true } },
        _count: { select: { records: true } },
      },
      orderBy: { date: "desc" },
      skip: (page - 1) * 20,
      take: 20,
    }),
    db.attendanceSession.count({ where }),
  ])

  return NextResponse.json({ data: sessions, meta: { total, page, totalPages: Math.ceil(total / 20) } })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const parsed = sessionSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { tenantId, classroomId, date, type } = parsed.data
  const { error } = await requireTenantMembership(tenantId)
  if (error) return error

  // Cek jika sesi untuk kelas & tanggal ini sudah ada
  if (classroomId) {
    const existing = await db.attendanceSession.findFirst({
      where: {
        tenantId, classroomId,
        date: { gte: new Date(date), lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1)) },
      },
    })
    if (existing) return NextResponse.json({ error: "Sesi absensi untuk kelas dan tanggal ini sudah ada", session: existing }, { status: 409 })
  }

  const attendanceSession = await db.attendanceSession.create({
    data: {
      tenantId,
      classroomId,
      date: new Date(date),
      type,
      createdBy: session.user.id,
    },
  })

  // Auto-populate records untuk semua siswa di kelas
  if (classroomId) {
    const students = await db.student.findMany({
      where: { tenantId, classroomId, isActive: true },
      select: { id: true },
    })
    if (students.length > 0) {
      await db.attendanceRecord.createMany({
        data: students.map(s => ({
          sessionId: attendanceSession.id,
          tenantId,
          studentId: s.id,
          status: "HADIR", // Default hadir
        })),
        skipDuplicates: true,
      })
    }
  }

  return NextResponse.json(attendanceSession, { status: 201 })
}
