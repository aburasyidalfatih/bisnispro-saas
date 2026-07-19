import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const tenantId = session.user.tenants?.[0]?.id

  try {
    const body = await req.json()
    const { sessionId, questionId, answer, isDoubtful, action } = body

    // Validate student
    const student = await db.student.findFirst({
      where: { userId: session.user.id, tenantId }
    })
    if (!student) return NextResponse.json({ error: "Bukan siswa" }, { status: 403 })

    const cbtSession = await db.cbtSession.findFirst({
      where: { id: sessionId, studentId: student.id },
      include: { exam: true }
    })
    if (!cbtSession || cbtSession.status !== "ONGOING") {
      return NextResponse.json({ error: "Sesi tidak valid atau sudah selesai" }, { status: 400 })
    }

    // Strict Server-Side Time Verification
    const now = new Date()
    const sessionDeadline = new Date(cbtSession.startTime.getTime() + cbtSession.exam.duration * 60000)
    const absoluteDeadline = new Date(Math.min(sessionDeadline.getTime(), cbtSession.exam.endTime.getTime()) + 60000) // 1 min grace period

    if (now > absoluteDeadline && action !== "FINISH") {
      // Auto-finish session if time is up to prevent cheating
      await db.cbtSession.update({
        where: { id: sessionId },
        data: { status: "FINISHED", endTime: now }
      })
      
      const { cbtQueue } = await import("@/lib/queue")
      await cbtQueue.add("score-session", { 
        sessionId: cbtSession.id, 
        examId: cbtSession.examId 
      })
      
      return NextResponse.json({ error: "Waktu ujian telah berakhir" }, { status: 403 })
    }

    // Handle Finish Action
    if (action === "FINISH") {
      await db.cbtSession.update({
        where: { id: sessionId },
        data: { status: "FINISHED", endTime: new Date() }
      })
      
      const { cbtQueue } = await import("@/lib/queue")
      await cbtQueue.add("score-session", { 
        sessionId: cbtSession.id, 
        examId: cbtSession.examId 
      })

      return NextResponse.json({ success: true })
    }

    // Handle Cheat Detection Action
    if (action === "CHEAT") {
      await db.cbtSession.update({
        where: { id: sessionId },
        data: { cheatCount: { increment: 1 } }
      })
      return NextResponse.json({ success: true })
    }

    // Handle Answer Save
    if (questionId && answer !== undefined) {
      // Find question to check correctness (optional, can be done later, but we save answer text)
      await db.cbtAnswer.upsert({
        where: {
          sessionId_questionId: {
            sessionId: cbtSession.id,
            questionId
          }
        },
        update: {
          answer,
          // We can evaluate correctness later in the result API, so we just save the answer here
        },
        create: {
          sessionId: cbtSession.id,
          studentId: student.id,
          questionId,
          answer,
        }
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
