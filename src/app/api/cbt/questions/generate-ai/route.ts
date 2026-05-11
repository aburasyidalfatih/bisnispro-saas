import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getAiProvider, checkAiTokenBalance, deductAiToken } from "@/lib/services/ai-service"
import { generateObject } from "ai"
import { z } from "zod"
import { logger } from "@/lib/logger"

const QuestionSchema = z.object({
  questions: z.array(z.object({
    content: z.string().describe("Teks pertanyaan utama"),
    options: z.array(z.object({
      id: z.enum(["A", "B", "C", "D", "E"]),
      text: z.string(),
      isCorrect: z.boolean()
    })).length(5).describe("Tepat 5 opsi dari A sampai E, dengan tepat 1 jawaban benar")
  }))
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { questionBankId, topic, difficulty, count } = await req.json()
    const tenantId = session.user.tenants?.[0]?.id

    if (!tenantId || !questionBankId || !topic) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // 1. Cek Saldo Token
    const hasTokens = await checkAiTokenBalance(tenantId)
    if (!hasTokens) {
      return NextResponse.json({ error: "Saldo Token AI habis. Silakan beli kuota tambahan atau gunakan API Key Anda sendiri." }, { status: 403 })
    }

    // 2. Setup AI Provider
    const openai = await getAiProvider(tenantId)
    const model = openai("gpt-4o-mini") // Gunakan model cost-effective

    const prompt = `Buatkan ${count} soal pilihan ganda (A, B, C, D, E) tentang topik: "${topic}".
Tingkat kesulitan: ${difficulty}.
Setiap soal harus memiliki tepat 1 jawaban yang benar.
Gunakan Bahasa Indonesia yang baik dan benar sesuai standar Kurikulum pendidikan Indonesia.`

    // 3. Generate Object (Force JSON Schema)
    const { object } = await generateObject({
      model,
      schema: QuestionSchema,
      prompt,
    })

    // 4. Simpan ke Database
    let savedCount = 0
    for (const q of object.questions) {
      await db.cbtQuestion.create({
        data: {
          questionBankId,
          type: "MULTIPLE_CHOICE",
          content: q.content,
          options: q.options,
          points: 1
        }
      })
      savedCount++
    }

    // 5. Kurangi Token (Anggap 1 soal = 1 token untuk kemudahan)
    await deductAiToken(tenantId, savedCount, session.user.id, "QUESTION_GENERATOR")

    return NextResponse.json({ success: true, count: savedCount })

  } catch (error: any) {
    logger.error("Failed to generate AI questions", error)
    return NextResponse.json({ error: error.message || "Terjadi kesalahan internal pada server AI" }, { status: 500 })
  }
}
