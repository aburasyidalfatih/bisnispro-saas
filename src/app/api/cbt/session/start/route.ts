import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const tenantId = session.user.tenants?.[0]?.id

  try {
    const { pin } = await req.json()
    
    // 1. Validate PIN
    const exam = await db.cbtExam.findFirst({
      where: { pin, tenantId, status: "PUBLISHED" },
      include: {
        questionBank: {
          include: { questions: true }
        }
      }
    })

    if (!exam) {
      return NextResponse.json({ error: "PIN Ujian tidak valid atau ujian belum dimulai." }, { status: 404 })
    }

    // Check if within time
    const now = new Date()
    if (now < exam.startTime) {
      return NextResponse.json({ error: "Ujian belum dimulai. Silakan tunggu jadwalnya." }, { status: 400 })
    }
    if (now > exam.endTime) {
      return NextResponse.json({ error: "Waktu ujian telah berakhir." }, { status: 400 })
    }

    // 2. Get Student ID
    const student = await db.student.findFirst({
      where: { userId: session.user.id, tenantId }
    })

    if (!student) {
      return NextResponse.json({ error: "Akun Anda tidak terdaftar sebagai siswa." }, { status: 403 })
    }

    // 3. Find or Create CbtSession
    let cbtSession = await db.cbtSession.findFirst({
      where: { examId: exam.id, studentId: student.id },
      include: { answers: true }
    })

    if (!cbtSession) {
      // Initialize new session
      cbtSession = await db.cbtSession.create({
        data: {
          examId: exam.id,
          studentId: student.id,
          status: "ONGOING",
          startTime: new Date()
        },
        include: { answers: true }
      })
    } else if (cbtSession.status === "FINISHED") {
      return NextResponse.json({ error: "Anda sudah menyelesaikan ujian ini." }, { status: 403 })
    }

    // 4. Return Data (Sanitized: DO NOT send isCorrect to the client)
    const sanitizedQuestions = exam.questionBank?.questions.map((q: any) => ({
      id: q.id,
      content: q.content,
      options: q.options ? (q.options as any[]).map(o => ({ id: o.id, text: o.text })) : [], // Exclude isCorrect
      type: q.type
    })) || []

    return NextResponse.json({
      sessionId: cbtSession.id,
      exam: {
        title: exam.title,
        duration: exam.duration,
        endTime: exam.endTime
      },
      sessionStartTime: cbtSession.startTime,
      questions: sanitizedQuestions,
      answers: cbtSession.answers
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
