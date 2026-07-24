import { requireTenantMembership } from "@/lib/api-utils"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getAiModel, checkAiTokenBalance, deductAiToken, getAiTokenCosts } from "@/features/ai/services/ai.service"
import { generateObject } from "ai"
import { z } from "zod"
import { logger } from "@/lib/logger"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { tenantId, topic, tone, type = "post" } = body
  const { error: accessError } = await requireTenantMembership(tenantId as string);
  if (accessError) return accessError;

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

    // Get AI Provider & Model
    const aiResult = await getAiModel(tenantId)
    if (!aiResult.success || !aiResult.model) {
      return NextResponse.json({ error: aiResult.error }, { status: 500 })
    }

    const model = aiResult.model

    // Generate content using AI
    const systemPrompt = `Anda adalah seorang ahli konten website dan praktisi humas profesional yang bekerja untuk sebuah institusi pendidikan/perusahaan di Indonesia. 
Tugas Anda adalah mengubah instruksi atau poin-poin yang diberikan menjadi konten ${type === 'page' ? 'halaman statis website (seperti Profil, Sejarah, Visi Misi, atau Tata Tertib)' : 'artikel liputan/berita perusahaan'} yang utuh, profesional, dan SEO friendly.

Aturan penulisan:
1. Gunakan gaya bahasa: ${tone === 'pengumuman' ? 'Instruksional, jelas, tegas, dan berwibawa.' : tone === 'formal' ? 'Formal, profesional, dan terstruktur rapi.' : 'Santai, ramah, dan inspiratif (cocok untuk dibaca publik/orang tua).'}
2. Gunakan bahasa Indonesia baku (PUEBI) namun tetap mengalir dan enak dibaca.
3. Buatkan judul (title) yang menarik (maksimal 60 karakter).
4. Buatkan ringkasan SEO (seoDesc) maksimal 150 karakter.
5. Format isi artikel (content) WAJIB MENGGUNAKAN HTML murni (hanya gunakan tag <p>, <h2>, <strong>, <ul>, <li>). JANGAN gunakan Markdown (seperti \`\`\`html atau **tebal**).
6. SANGAT PENTING (KAIDAH SEO): Artikel harus komprehensif, minimal 300 kata, idealnya 400-600 kata. Bagilah artikel ke dalam beberapa paragraf yang mudah dibaca dengan menyertakan minimal satu subjudul (<h2>).
7. OPTIMASI KATA KUNCI: Pastikan kata kunci utama yang relevan dengan topik tersebar secara natural di Judul (Title), Paragraf Pembuka (Lead), dan Subjudul (H2).`

    const { object } = await generateObject({
      model,
      system: systemPrompt,
      prompt: `Topik / Poin Singkat Artikel:\n${topic}`,
      schema: z.object({
        title: z.string().describe("Judul artikel yang menarik, maksimal 60 karakter"),
        seoTitle: z.string().describe("Judul SEO friendly, maksimal 60 karakter"),
        seoDesc: z.string().describe("Deskripsi meta SEO, ringkasan 1-2 kalimat, maksimal 150 karakter"),
        content: z.string().describe("Isi artikel komprehensif berformat HTML murni (<p>, <h2>, dll). SANGAT PENTING: Minimal 300 kata (idealnya 400-600 kata), gunakan H2 untuk subjudul, dan sebar kata kunci secara natural.")
      })
    })

    // Deduct token
    const tokenCosts = await getAiTokenCosts()
    const cost = tokenCosts["post"] || 50
    await deductAiToken(tenantId, cost, session.user.id, "generate_post")

    return NextResponse.json({ success: true, data: object })

  } catch (error: any) {
    logger.error("Failed to generate AI post", error, { path: "/api/tenant/ai/generate-post" })
    return NextResponse.json({ error: error.message || "Failed to generate content" }, { status: 500 })
  }
}
