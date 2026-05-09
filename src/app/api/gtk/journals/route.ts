import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get("tenantId")
    if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 })

    const staff = await db.staff.findFirst({ where: { tenantId, userId: session.user.id } })
    if (!staff) return NextResponse.json({ error: "Profil staff tidak ditemukan" }, { status: 404 })

    const journals = await db.teacherJournal.findMany({
      where: { tenantId, staffId: staff.id },
      include: {
        subject: { select: { id: true, name: true } },
        classroom: { select: { id: true, name: true } },
        presences: { select: { studentId: true, status: true } },
      },
      orderBy: { date: "desc" },
      take: 30,
    })
    return NextResponse.json({ journals, staffId: staff.id })
  } catch {
    return NextResponse.json({ error: "Gagal memuat jurnal" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const body = await req.json()
    const { tenantId, classroomId, subjectId, date, topic, notes, presences } = body
    // presences: [{ studentId, status, notes? }]
    if (!tenantId || !classroomId || !subjectId || !date || !topic) {
      return NextResponse.json({ error: "Field wajib tidak lengkap" }, { status: 400 })
    }

    const staff = await db.staff.findFirst({ where: { tenantId, userId: session.user.id } })
    if (!staff) return NextResponse.json({ error: "Profil staff tidak ditemukan" }, { status: 404 })

    const journalDate = new Date(date)

    // Upsert journal
    const journal = await db.teacherJournal.upsert({
      where: { staffId_classroomId_subjectId_date: { staffId: staff.id, classroomId, subjectId, date: journalDate } },
      update: { topic, notes: notes || null },
      create: { tenantId, staffId: staff.id, classroomId, subjectId, date: journalDate, topic, notes: notes || null },
    })

    // Upsert presences
    if (Array.isArray(presences) && presences.length > 0) {
      await db.$transaction(
        presences.map((p: any) =>
          db.journalPresence.upsert({
            where: { journalId_studentId: { journalId: journal.id, studentId: p.studentId } },
            update: { status: p.status, notes: p.notes || null },
            create: { journalId: journal.id, studentId: p.studentId, status: p.status, notes: p.notes || null },
          })
        )
      )
    }

    return NextResponse.json({ journal })
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan jurnal" }, { status: 500 })
  }
}
