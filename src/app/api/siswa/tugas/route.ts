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

    // Ambil Tugas yang sudah dipublish
    const exams = await db.cbtExam.findMany({
      where: { tenantId, type: "TUGAS", status: "PUBLISHED" },
      take: 100,
      include: {
        questionBank: true,
        sessions: {
          where: { studentId: student.id }
        }
      },
      orderBy: { endTime: "asc" }
    })

    const activeTasks: any[] = []
    const completedTasks: any[] = []

    const now = new Date()

    for (const exam of exams) {
      const examData = exam as any
      const studentSession = examData.sessions[0]
      
      if (studentSession && studentSession.status === "FINISHED") {
        completedTasks.push({
          id: examData.id,
          title: examData.title,
          subject: examData.questionBank.subject || examData.questionBank.name,
          score: studentSession.score || 0
        })
      } else {
        // If end time is in the past, it's expired, skip or mark as missed
        if (examData.endTime < now) continue

        activeTasks.push({
          id: examData.id,
          title: examData.title,
          subject: examData.questionBank.subject || examData.questionBank.name,
          deadline: examData.endTime,
          pin: examData.pin
        })
      }
    }

    return NextResponse.json({ activeTasks, completedTasks })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
