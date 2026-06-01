import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const tenantId = session.user.tenants?.[0]?.id

  const { id } = await params

  try {
    const exam = await db.cbtExam.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: { sessions: true }
        },
        sessions: {
          include: {
            student: true,
            // We no longer include 'answers' to prevent OOM
            _count: {
              select: { answers: { where: { isCorrect: true } } }
            }
          },
          orderBy: { score: 'desc' }
        },
        questionBank: {
          select: {
            _count: {
              select: { questions: true }
            }
          }
        }
      }
    })

    if (!exam) return NextResponse.json({ error: "Ujian tidak ditemukan" }, { status: 404 })

    const totalQuestions = exam.questionBank._count.questions

    const results = exam.sessions.map(s => {
      // If score is null (still grading or not finished), we show 0 or "Proses"
      return {
        sessionId: s.id,
        studentName: s.student.name,
        nisn: s.student.nisn,
        className: "Kelas 10", // Should join with class
        status: s.status,
        startTime: s.startTime,
        endTime: s.endTime,
        score: s.score || 0,
        correctCount: s._count.answers,
        totalQuestions,
        cheatCount: s.cheatCount
      }
    })

    return NextResponse.json({
      exam: { title: exam.title, status: exam.status, type: exam.type },
      results
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
