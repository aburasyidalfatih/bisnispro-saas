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
      select: { tenants: { select: { tenantId: true }, take: 1 } }
    })

    if (!user || !user.tenants[0]?.tenantId) {
      return NextResponse.json({ error: "User tidak terkait dengan institusi apapun" }, { status: 400 })
    }

    // Check token balance
    const balanceCheck = await checkAiTokenBalance(user.tenants[0].tenantId, session.user.id)
    if (!balanceCheck.success || !balanceCheck.hasBalance) {
      return NextResponse.json({ error: "Token AI tidak mencukupi. Silakan lakukan Top-Up." }, { status: 402 })
    }

    // Get AI Model
    const modelResult = await getAiModel(user.tenants[0].tenantId)
    if (!modelResult.success || !modelResult.model) {
      return NextResponse.json({ error: "Gagal memuat model AI" }, { status: 500 })
    }

    // Prepare system prompt
    const systemPrompt = "Anda adalah Asisten Guru yang ramah dan membantu. Tugas Anda adalah membantu guru dalam membuat materi pelajaran, RPP, soal ujian, menganalisa nilai, serta tugas-tugas administratif sekolah lainnya. Jawablah dengan menggunakan bahasa Indonesia yang baik dan benar serta mudah dipahami."

    let activeSessionId = sessionId;

    if (!activeSessionId) {
       const firstUserMsg = messages.find((m: any) => m.role === "user")?.content || "Percakapan Baru"
       const title = firstUserMsg.length > 50 ? firstUserMsg.substring(0, 50) + "..." : firstUserMsg
       
       const newSessionObj = await db.aiChatSession.create({
          data: {
             userId: session.user.id,
             title,
             messages: JSON.stringify(messages) // Will be updated in onFinish
          }
       })
       activeSessionId = newSessionObj.id;
    }

    // Generate Stream
    const result = await streamText({
      model: modelResult.model,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      async onFinish({ usage, text }) {
        // 1. Deduct tokens
        const tokensUsed = usage?.totalTokens || 0
        if (tokensUsed > 0) {
          await deductAiToken(user.tenants[0].tenantId!, tokensUsed, session.user.id, "AI_CHAT_GTK")
        }
        
        // 2. Save Chat Session
        try {
           const allMessages = [...messages, { role: "assistant", content: text }]
           
           await db.aiChatSession.updateMany({
              where: { id: activeSessionId, userId: session.user.id },
              data: { messages: JSON.stringify(allMessages) }
           })
        } catch (err) {
           console.error("Failed to save chat session", err)
        }
      }
    })

    return result.toTextStreamResponse({
      headers: {
        'x-session-id': activeSessionId
      }
    })
  } catch (error: any) {
    console.error("AI Chat Error:", error)
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server" }, { status: 500 })
  }
}
