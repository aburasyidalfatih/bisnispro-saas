import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get("tenantId")
    const studentId = searchParams.get("studentId")
    const classroomId = searchParams.get("classroomId")
    if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 })

    // If studentId provided (ortu context), verify parent owns student
    if (studentId) {
      const link = await db.studentParent.findFirst({ where: { userId: session.user.id, studentId } })
      if (!link) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 })
    }

    const where: any = { tenantId }
    if (studentId) where.studentId = studentId
    if (classroomId) where.student = { classroomId }

    const records = await db.disciplineRecord.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, nis: true } },
        staff: { select: { id: true, name: true } },
      },
      orderBy: { date: "desc" },
      take: 100,
    })
    return NextResponse.json({ records })
  } catch {
    return NextResponse.json({ error: "Gagal memuat catatan disiplin" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const body = await req.json()
    const { tenantId, studentId, staffId, type, category, description, points, date } = body
    if (!tenantId || !studentId || !staffId || !type || !category || !description || !date) {
      return NextResponse.json({ error: "Field wajib tidak lengkap" }, { status: 400 })
    }

    const record = await db.disciplineRecord.create({
      data: {
        tenantId, studentId, staffId, type, category, description,
        points: Number(points) || 0,
        date: new Date(date),
      },
    })
    return NextResponse.json({ record })
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan catatan" }, { status: 500 })
  }
}
