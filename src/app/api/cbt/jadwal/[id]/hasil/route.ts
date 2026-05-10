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
        questionBank: {
          include: { questions: true }
        },
        sessions: {
          include: {
            student: true,
            answers: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!exam) return NextResponse.json({ error: "Ujian tidak ditemukan" }, { status: 404 })

    // Calculate scores on the fly
    const questions = exam.questionBank.questions
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0) || 1

    const results = exam.sessions.map(s => {
      let earned = 0
      const detailAnswers = questions.map(q => {
        const studentAns = s.answers.find(a => a.questionId === q.id)
        
        let isCorrect = false
        if (q.type === "MULTIPLE_CHOICE" && q.options) {
          const options = q.options as any[]
          const correctOpt = options.find(o => o.isCorrect)
          if (correctOpt && studentAns?.answer === correctOpt.id) {
            isCorrect = true
            earned += q.points
          }
        }
        return {
          questionId: q.id,
          isCorrect,
          studentAnswer: studentAns?.answer || null
        }
      })

      const finalScore = (earned / totalPoints) * 100

      return {
        sessionId: s.id,
        studentName: s.student.name,
        nisn: s.student.nisn,
        className: "Kelas 10", // Should join with class
        status: s.status,
        startTime: s.startTime,
        endTime: s.endTime,
        score: Math.round(finalScore * 100) / 100,
        correctCount: detailAnswers.filter(a => a.isCorrect).length,
        totalQuestions: questions.length,
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
