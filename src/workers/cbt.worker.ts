import { Worker, Job } from "bullmq"
import { connection, applyEnterpriseHandling } from "./shared"
import { db } from "@/lib/db"

export const cbtWorker = new Worker(
  "cbt-queue",
  async (job: Job) => {
    const { sessionId, examId } = job.data
    console.log(`[cbt-queue] Processing scoring for session ${sessionId}...`)

    try {
      // 1. Fetch exam questions and points
      const exam = await db.cbtExam.findUnique({
        where: { id: examId },
        include: { questionBank: { include: { questions: true } } }
      })
      if (!exam) throw new Error("Exam not found")

      // 2. Fetch session and answers
      const session = await db.cbtSession.findUnique({
        where: { id: sessionId },
        include: { answers: true }
      })
      if (!session) throw new Error("Session not found")

      const questions = exam.questionBank.questions
      const totalPoints = questions.reduce((sum, q) => sum + q.points, 0) || 1
      let earned = 0

      // 3. Score the answers
      const updatePromises = []
      for (const studentAns of session.answers) {
        const q = questions.find(q => q.id === studentAns.questionId)
        if (!q) continue

        let isCorrect = false
        if (q.type === "MULTIPLE_CHOICE" && q.options) {
          const options = q.options as any[]
          const correctOpt = options.find(o => o.isCorrect)
          if (correctOpt && studentAns.answer === correctOpt.id) {
            isCorrect = true
            earned += q.points
          }
        }

        // Push update to transaction batch
        updatePromises.push(
          db.cbtAnswer.update({
            where: { id: studentAns.id },
            data: { isCorrect, points: isCorrect ? q.points : 0 }
          })
        )
      }

      await db.$transaction(updatePromises)

      const finalScore = (earned / totalPoints) * 100

      // 4. Update session score
      await db.cbtSession.update({
        where: { id: sessionId },
        data: { score: Math.round(finalScore * 100) / 100 }
      })

      return { success: true, score: finalScore }
    } catch (error: any) {
      console.error(`[cbt-queue] Failed to score session ${sessionId}:`, error.message)
      throw error
    }
  },
  { connection, concurrency: 10 }
)

applyEnterpriseHandling(cbtWorker)
