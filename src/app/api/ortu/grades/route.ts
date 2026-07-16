import { requireTenantMembership } from "@/lib/api-utils"
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
    const studentId = searchParams.get("studentId")
    const semester = searchParams.get("semester")
    const year = searchParams.get("year")
    if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 })
  const { error: accessError } = await requireTenantMembership(tenantId as string);
  if (accessError) return accessError;
    if (!studentId) return NextResponse.json({ error: "studentId required" }, { status: 400 })

    // Ortu guard: Validate parent owns this student (always enforced)
    const link = await db.studentParent.findFirst({
      where: { userId: session.user.id, studentId },
    })
    if (!link) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 })

    const where: any = { tenantId, studentId }
    if (classroomId) where.classroomId = classroomId
    if (semester) where.semester = Number(semester)
    if (year) where.year = Number(year)

    const grades = await db.grade.findMany({
      where,
      include: {
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
