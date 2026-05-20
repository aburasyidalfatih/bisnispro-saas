import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getAiProvider, checkAiTokenBalance, deductAiToken } from "@/features/ai/services/ai.service"
import { generateObject } from "ai"
import { z } from "zod"
import { logger } from "@/lib/logger"

const TOKEN_COST = 25

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { tenantId, promptType, inputs } = body

    if (!tenantId || !promptType || !inputs) {
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

    let systemPrompt = ""
    let userPrompt = ""

    switch (promptType) {
      case "vision-mission":
        systemPrompt = `Anda adalah ahli branding dan tata bahasa profesional untuk lembaga pendidikan di Indonesia. 
Tugas Anda adalah merapikan, memperjelas, dan membuat visi & misi sekolah menjadi lebih inspiratif dan modern tanpa mengubah inti tujuannya.
Format hasilnya menggunakan HTML murni (gunakan tag <p>, <ul>, <li>, <strong>). Jangan gunakan Markdown.`
        userPrompt = `Poles Visi dan Misi berikut:\n${inputs.text}`
        break
      case "about":
        systemPrompt = `Anda adalah humas profesional untuk sekolah di Indonesia. 
Ubah poin-poin singkat menjadi cerita "Tentang Kami" atau Sejarah Sekolah yang membanggakan, profesional, dan mengalir (storytelling).
Format hasilnya menggunakan HTML murni (tag <p>, <h2>, <strong>). Jangan gunakan Markdown.`
        userPrompt = `Buat cerita profil sekolah dari fakta berikut:\n${inputs.text}`
        break
      case 'principal-speech':
        systemPrompt = `Anda adalah penulis pidato (speechwriter) untuk Kepala Sekolah di Indonesia.
Buatlah kata sambutan resmi untuk di halaman depan website sekolah yang berwibawa, hangat, dan visioner (sekitar 3-4 paragraf).
Format hasilnya menggunakan HTML murni (tag <p>, <strong>). Jangan gunakan Markdown.`
        userPrompt = `Nama Kepala Sekolah: ${inputs?.name || 'Kepala Sekolah'}
Pesan / Fokus / Harapan utama: ${inputs?.text || ''}`
        break
      case 'program':
        systemPrompt = `Anda adalah seorang *copywriter* pendidikan profesional. Tugas Anda adalah mengubah poin-poin fokus pembelajaran dan prospek jurusan menjadi sebuah paragraf deskripsi program unggulan atau jurusan yang sangat menarik dan persuasif bagi calon siswa.
Hasilkan 2 paragraf maksimal. Paragraf pertama fokus pada keunggulan program, paragraf kedua fokus pada peluang masa depan (prospek karir/lanjutan). Jangan gunakan tag HTML, kembalikan plain text saja.`
        userPrompt = `Nama Program: ${inputs?.name || ''}
Fokus / Keunggulan: ${inputs?.text || ''}`
        break
      case 'facility':
        systemPrompt = `Anda adalah seorang *copywriter* pendidikan profesional. Tugas Anda adalah mengubah poin-poin tentang kondisi sebuah fasilitas sekolah menjadi paragraf deskripsi yang menarik. Tujuannya adalah meyakinkan calon siswa dan orang tua bahwa sekolah memiliki fasilitas yang modern, memadai, dan sangat mendukung kegiatan belajar.
Hasilkan 1-2 paragraf pendek. Jangan gunakan tag HTML, kembalikan plain text saja.`
        userPrompt = `Nama Fasilitas: ${inputs?.name || ''}
Kondisi / Kelengkapan: ${inputs?.text || ''}`
        break
      case "teacher-bio":
        systemPrompt = `Anda adalah copywriter profesional. Buatlah profil/biodata singkat (maksimal 2 paragraf) untuk seorang guru.
Gunakan bahasa yang profesional namun hangat, menunjukkan bahwa guru ini kompeten dan peduli pada siswa.
Format hasilnya menggunakan HTML murni (tag <p>, <strong>). Jangan gunakan Markdown.`
        userPrompt = `Nama: ${inputs.name}\nJabatan/Pelajaran: ${inputs.role}\nInformasi Tambahan (Hobi/Karakter/Pengalaman): ${inputs.text}`
        break
      case "extracurricular":
        systemPrompt = `Anda adalah humas sekolah yang jago membuat konten marketing. 
Buatlah deskripsi promosi yang menarik untuk ekstrakurikuler sekolah agar siswa baru tertarik untuk bergabung. Jelaskan manfaat dan nilai positifnya.
Format hasilnya menggunakan HTML murni (tag <p>, <ul>, <li>, <strong>). Jangan gunakan Markdown.`
        userPrompt = `Nama Ekstrakurikuler: ${inputs.name}\nPoin-poin kegiatan/tujuan: ${inputs.text}`
        break
      case 'event':
        systemPrompt = `Anda adalah penulis konten profesional. Tugas Anda adalah membuat deskripsi acara/agenda (event) sekolah yang menarik dan informatif berdasarkan poin-poin yang diberikan.
Tujuannya agar pembaca (siswa/orang tua) tertarik untuk hadir atau berpartisipasi.
Hasilkan 1-2 paragraf pendek. Jangan gunakan tag HTML, kembalikan plain text saja.`
        userPrompt = `Judul Acara: ${inputs?.name || ''}
Detail/Poin Acara: ${inputs?.text || ''}`
        break
      case 'achievement':
        systemPrompt = `Anda adalah penulis konten profesional. Tugas Anda adalah membuat deskripsi prestasi sekolah atau siswa yang membanggakan dan menginspirasi berdasarkan poin-poin yang diberikan.
Hasilkan 1-2 paragraf pendek yang menunjukkan kebanggaan dan apresiasi. Jangan gunakan tag HTML, kembalikan plain text saja.`
        userPrompt = `Judul Prestasi: ${inputs?.name || ''}
Detail Prestasi: ${inputs?.text || ''}`
        break
      case 'alumni':
        systemPrompt = `Anda adalah penulis *copywriter*. Tugas Anda adalah membuat draf testimoni alumni yang natural, positif, dan menginspirasi berdasarkan kata kunci yang diberikan. 
Testimoni harus menonjolkan bagaimana sekolah/kampus membantu karir/studi mereka saat ini.
Hasilkan 1 paragraf singkat bergaya kutipan (quote). Jangan gunakan tag HTML, kembalikan plain text saja.`
        userPrompt = `Status Saat Ini: ${inputs?.name || ''}
Kata Kunci Testimoni: ${inputs?.text || ''}`
        break
      default:
        return NextResponse.json({ error: "Invalid prompt type" }, { status: 400 })
    }

    const { object } = await generateObject({
      model: provider('gpt-4o-mini'),
      system: systemPrompt,
      prompt: userPrompt,
      schema: z.object({
        result: z.string().describe("Hasil teks atau HTML sesuai instruksi")
      })
    })

    // Deduct token
    await deductAiToken(tenantId, TOKEN_COST, session.user.id, `generate_${promptType}`)

    return NextResponse.json({ success: true, data: object })

  } catch (error: any) {
    logger.error("Failed to generate AI content", error, { path: "/api/tenant/ai/generate-content" })
    return NextResponse.json({ error: error.message || "Failed to generate content" }, { status: 500 })
  }
}
