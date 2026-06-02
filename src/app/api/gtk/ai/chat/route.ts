import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { streamText } from "ai"
import { getAiModel, checkAiTokenBalance, deductAiToken } from "@/features/ai/services/ai.service"
import { db } from "@/lib/db"

export const maxDuration = 60

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { messages, sessionId } = await req.json()

    // Determine tenantId
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { tenantId: true }
    })

    if (!user || !user.tenantId) {
      return NextResponse.json({ error: "User tidak terkait dengan institusi apapun" }, { status: 400 })
    }

    // Check token balance
    const balanceCheck = await checkAiTokenBalance(user.tenantId, session.user.id)
    if (!balanceCheck.success || !balanceCheck.hasBalance) {
      return NextResponse.json({ error: "Token AI tidak mencukupi. Silakan lakukan Top-Up." }, { status: 402 })
    }

    // Get AI Model
    const modelResult = await getAiModel(user.tenantId)
    if (!modelResult.success || !modelResult.model) {
      return NextResponse.json({ error: "Gagal memuat model AI" }, { status: 500 })
    }

    // Prepare system prompt
    const systemPrompt = "Anda adalah Asisten Guru yang ramah dan membantu. Tugas Anda adalah membantu guru dalam membuat materi pelajaran, RPP, soal ujian, menganalisa nilai, serta tugas-tugas administratif sekolah lainnya. Jawablah dengan menggunakan bahasa Indonesia yang baik dan benar serta mudah dipahami."

    // Generate Stream
    const result = await streamText({
      model: modelResult.model,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      async onFinish({ usage, text }) {
        // 1. Deduct tokens
        const tokensUsed = usage.totalTokens
        if (tokensUsed > 0) {
          await deductAiToken(user.tenantId!, tokensUsed, session.user.id, "AI_CHAT_GTK")
        }

        // 2. Save Chat Session (if we want to persist it)
        try {
           const allMessages = [...messages, { role: "assistant", content: text }]
           
           if (sessionId) {
              await db.aiChatSession.update({
                 where: { id: sessionId },
                 data: { messages: JSON.stringify(allMessages) }
              })
           } else {
              // Create new session if this is the first message
              const firstUserMsg = messages.find((m: any) => m.role === "user")?.content || "Percakapan Baru"
              const title = firstUserMsg.length > 50 ? firstUserMsg.substring(0, 50) + "..." : firstUserMsg
              
              await db.aiChatSession.create({
                 data: {
                    userId: session.user.id,
                    title,
                    messages: JSON.stringify(allMessages)
                 }
              })
           }
        } catch (err) {
           console.error("Failed to save chat session", err)
        }
      }
    })

    return result.toDataStreamResponse()
  } catch (error: any) {
    console.error("AI Chat Error:", error)
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server" }, { status: 500 })
  }
}
