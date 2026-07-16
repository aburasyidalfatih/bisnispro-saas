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
    const studentId = searchParams.get("studentId")
    const semester = searchParams.get("semester")
    const year = searchParams.get("year")
    if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 })
    const { error: accessError } = await requireTenantMembership(tenantId)
    if (accessError) return accessError

    const where: any = { tenantId }
    if (classroomId) where.classroomId = classroomId
    if (studentId) where.studentId = studentId
    if (semester) where.semester = Number(semester)
    if (year) where.year = Number(year)

    const grades = await db.grade.findMany({
      where,
      take: 200,
      include: {
        student: { select: { id: true, name: true, nis: true } },
        subject: { select: { id: true, name: true, code: true } },
        staff: { select: { id: true, name: true } },
      },
      orderBy: [{ subject: { name: "asc" } }, { type: "asc" }],
    })
    return NextResponse.json({ grades })
  } catch {
    return NextResponse.json({ error: "Gagal memuat nilai" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const body = await req.json()
    // Support bulk upsert: body.grades = [{ studentId, subjectId, classroomId, staffId, type, semester, year, score, notes }]
    const { tenantId, grades: gradesData } = body
    if (!tenantId || !Array.isArray(gradesData) || gradesData.length === 0) {
      return NextResponse.json({ error: "tenantId & grades[] required" }, { status: 400 })
    }
    const { error: accessError } = await requireTenantMembership(tenantId)
    if (accessError) return accessError

    const results = await db.$transaction(
      gradesData.map((g: any) =>
        db.grade.upsert({
          where: {
            tenantId_studentId_subjectId_type_semester_year: {
              tenantId,
              studentId: g.studentId,
              subjectId: g.subjectId,
              type: g.type,
              semester: Number(g.semester),
              year: Number(g.year),
            },
          },
          update: { score: g.score, notes: g.notes || null, staffId: g.staffId },
          create: {
            tenantId,
            studentId: g.studentId,
            subjectId: g.subjectId,
            classroomId: g.classroomId,
            staffId: g.staffId,
            type: g.type,
            semester: Number(g.semester),
            year: Number(g.year),
            score: g.score,
            notes: g.notes || null,
          },
        })
      )
    )
    return NextResponse.json({ saved: results.length })
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan nilai" }, { status: 500 })
  }
}
