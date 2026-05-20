import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getAiModel, checkAiTokenBalance, deductAiToken } from "@/features/ai/services/ai.service"
import { generateObject } from "ai"
import { z } from "zod"
import { logger } from "@/lib/logger"

// Tambahkan timeout 60 detik untuk men-generate hingga 50 soal
export const maxDuration = 60

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { questionBankId, topic, difficulty, count, educationLevel, questionType } = await req.json()
    const tenantId = session.user.tenants?.[0]?.id

    if (!tenantId || !questionBankId || !topic) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // 1. Cek Saldo Token
    const balanceResult = await checkAiTokenBalance(tenantId)
    if (!balanceResult.success || !balanceResult.hasBalance) {
      return NextResponse.json({ error: "Saldo Token AI habis. Silakan beli kuota tambahan atau gunakan API Key Anda sendiri." }, { status: 403 })
    }

    // 2. Setup AI Provider & Model
    const aiResult = await getAiModel(tenantId)
    if (!aiResult.success || !aiResult.model) {
      return NextResponse.json({ error: aiResult.error || "Gagal inisialisasi AI" }, { status: 500 })
    }
    const model = aiResult.model

    // 3. Bangun Prompt & Schema Dinamis
    let schema: z.ZodType<any>
    let formatInstruction = ""

    if (questionType === "MULTIPLE_CHOICE_4") {
      formatInstruction = `Pilihan ganda dengan 4 opsi (A, B, C, D). Tepat 1 opsi harus benar.`
      schema = z.object({
        questions: z.array(z.object({
          content: z.string().describe("Teks pertanyaan utama"),
          options: z.array(z.object({
            id: z.enum(["A", "B", "C", "D"]),
            text: z.string(),
            isCorrect: z.boolean()
          })).length(4).describe("Tepat 4 opsi A sampai D"),
          explanation: z.string().optional().describe("Penjelasan jawaban (opsional)")
        }))
      })
    } else if (questionType === "MULTIPLE_CHOICE_5") {
      formatInstruction = `Pilihan ganda dengan 5 opsi (A, B, C, D, E). Tepat 1 opsi harus benar.`
      schema = z.object({
        questions: z.array(z.object({
          content: z.string().describe("Teks pertanyaan utama"),
          options: z.array(z.object({
            id: z.enum(["A", "B", "C", "D", "E"]),
            text: z.string(),
            isCorrect: z.boolean()
          })).length(5).describe("Tepat 5 opsi A sampai E"),
          explanation: z.string().optional().describe("Penjelasan jawaban (opsional)")
        }))
      })
    } else if (questionType === "TRUE_FALSE") {
      formatInstruction = `Pernyataan Benar/Salah. Buat 2 opsi: A (Benar) dan B (Salah). Tepat 1 opsi benar.`
      schema = z.object({
        questions: z.array(z.object({
          content: z.string().describe("Pernyataan yang harus dinilai benar atau salah"),
          options: z.array(z.object({
            id: z.enum(["A", "B"]),
            text: z.enum(["Benar", "Salah"]),
            isCorrect: z.boolean()
          })).length(2).describe("Hanya 2 opsi: Benar dan Salah"),
          explanation: z.string().optional().describe("Penjelasan jawaban")
        }))
      })
    } else if (questionType === "ESSAY") {
      formatInstruction = `Soal Uraian / Essay. Tidak ada opsi pilihan ganda. Wajib berikan pedoman jawaban.`
      schema = z.object({
        questions: z.array(z.object({
          content: z.string().describe("Teks pertanyaan essay/uraian"),
          explanation: z.string().describe("Kunci jawaban atau pedoman penilaian untuk soal ini")
        }))
      })
    } else {
      return NextResponse.json({ error: "Invalid question type" }, { status: 400 })
    }

    const prompt = `Buatkan ${count} soal berdasarkan kisi-kisi materi berikut: "${topic}".
Tingkat kesulitan: ${difficulty}.
Jenjang Pendidikan target: ${educationLevel || "Sekolah Menengah"}. Sesuaikan gaya bahasa dan kompleksitas materi dengan tingkat ini.

Format Soal: ${formatInstruction}

Gunakan Bahasa Indonesia yang baik dan benar sesuai kurikulum pendidikan di Indonesia.`

    // 4. Generate Object (Force JSON Schema)
    const { object } = await generateObject({
      model,
      schema: schema,
      prompt,
    })

    // 5. Simpan ke Database
    let savedCount = 0
    for (const q of object.questions) {
      const dbType = questionType === "ESSAY" ? "ESSAY" : "MULTIPLE_CHOICE"
      
      await db.cbtQuestion.create({
        data: {
          questionBankId,
          type: dbType,
          content: q.content,
          options: dbType === "ESSAY" ? [] : q.options,
          explanation: q.explanation || null,
          points: dbType === "ESSAY" ? 5 : 1 // Berikan poin default lebih besar untuk essay
        }
      })
      savedCount++
    }

    // 6. Kurangi Token (Anggap 1 soal = 1 token untuk kemudahan, bisa di-scale sesuai butuh)
    await deductAiToken(tenantId, savedCount, session.user.id, "QUESTION_GENERATOR")

    return NextResponse.json({ success: true, count: savedCount })

  } catch (error: any) {
    logger.error("Failed to generate AI questions", error)
    return NextResponse.json({ error: error.message || "Terjadi kesalahan internal pada server AI" }, { status: 500 })
  }
}
