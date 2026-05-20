import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getAiProvider, checkAiTokenBalance, deductAiToken } from "@/features/ai/services/ai.service"
import { generateObject } from "ai"
import { z } from "zod"
import { logger } from "@/lib/logger"

const TOKEN_COST_PER_ARTICLE = 50

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { tenantId, topic, tone } = body

    if (!tenantId || !topic) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check token balance
    const balanceCheck = await checkAiTokenBalance(tenantId)
    if (!balanceCheck.success || !balanceCheck.hasBalance) {
      return NextResponse.json({ 
        error: balanceCheck.error || "Saldo AI Token tidak mencukupi. Silakan top up atau gunakan API Key sendiri." 
      }, { status: 402 })
    }

    // Get AI Provider
    const aiResult = await getAiProvider(tenantId)
    if (!aiResult.success || !aiResult.provider) {
      return NextResponse.json({ error: aiResult.error }, { status: 500 })
    }

    const provider = aiResult.provider

    // Generate content using AI
    const systemPrompt = `Anda adalah seorang jurnalis dan praktisi humas profesional yang bekerja untuk sebuah sekolah di Indonesia. 
Tugas Anda adalah mengubah poin-poin singkat yang diberikan menjadi sebuah artikel liputan atau berita sekolah yang utuh, profesional, dan inspiratif.

Aturan penulisan:
1. Gunakan gaya bahasa: ${tone === 'pengumuman' ? 'Instruksional, lugas, tegas, dan berwibawa (layaknya surat edaran resmi instansi).' : tone === 'formal' ? 'Formal, lugas, dan jurnalistik (layaknya berita koran).' : 'Santai, ramah, dan inspiratif (cocok untuk dibaca orang tua murid).'}
2. Gunakan bahasa Indonesia baku (PUEBI) namun tetap mengalir dan enak dibaca.
3. Buatkan judul (title) yang menarik (maksimal 60 karakter).
4. Buatkan ringkasan SEO (seoDesc) maksimal 150 karakter.
5. Format isi artikel (content) WAJIB MENGGUNAKAN HTML (hanya gunakan tag <p>, <h2>, <strong>, <ul>, <li>). JANGAN gunakan Markdown (tanpa \`\`\`html atau **tebal**).
6. Artikel harus terdiri dari 3-5 paragraf. Paragraf pertama adalah pembuka (lead), lalu isi utama, dan selalu ditutup dengan paragraf harapan atau motivasi ke depannya.`

    const { object } = await generateObject({
      model: provider('gpt-4o-mini'),
      system: systemPrompt,
      prompt: `Topik / Poin Singkat Artikel:\n${topic}`,
      schema: z.object({
        title: z.string().describe("Judul artikel yang menarik, maksimal 60 karakter"),
        seoTitle: z.string().describe("Judul SEO friendly, maksimal 60 karakter"),
        seoDesc: z.string().describe("Deskripsi meta SEO, ringkasan 1-2 kalimat, maksimal 150 karakter"),
        content: z.string().describe("Isi artikel utuh berformat HTML murni (<p>, <h2>, dll). Tanpa markdown.")
      })
    })

    // Deduct token
    await deductAiToken(tenantId, TOKEN_COST_PER_ARTICLE, session.user.id, "generate_post")

    return NextResponse.json({ success: true, data: object })

  } catch (error: any) {
    logger.error("Failed to generate AI post", error, { path: "/api/tenant/ai/generate-post" })
    return NextResponse.json({ error: error.message || "Failed to generate content" }, { status: 500 })
  }
}
