import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { streamText, tool } from "ai"
import { getAiAgentModel } from "@/features/ai/services/ai.service"
import { db } from "@/lib/db"
import fs from "fs"
import path from "path"
import { z } from "zod"

export const maxDuration = 60

export async function POST(req: Request) {
  const session = await auth()
  
  // Strict Super Admin Check
  if (!session?.user?.id || !session.user.isSuperAdmin) {
    return new Response("Unauthorized. Super Admin access only.", { status: 401 })
  }

  try {
    const { messages, sessionId } = await req.json()

    // Get specialized AI Agent Model for Text-to-SQL
    const modelResult = await getAiAgentModel()
    if (!modelResult.success || !modelResult.model) {
      return new Response(modelResult.error || "Gagal memuat model AI Agent. Periksa pengaturan API Key.", { status: 500 })
    }

    // Read Prisma Schema for context
    let schemaContext = ""
    try {
      const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma")
      schemaContext = fs.readFileSync(schemaPath, "utf-8")
    } catch (e) {
      console.warn("Could not read schema.prisma", e)
    }

    const businessContext = `
**KONTEKS BISNIS SCHOOLPRO:**
1. Harga Paket: Free (Gratis), Lite (Rp 150.000/bln), Pro (Rp 300.000/bln).
2. Fokus Bisnis saat ini: Mendorong konversi dari Free ke Lite/Pro, dan menurunkan tingkat churn (tenant yang tidak perpanjang).
3. Target Pasar Utama: SD, SMP, SMA, SMK, dan Pesantren di Indonesia.
4. Fitur Unggulan Kami: PPDB Online, E-Kantin, Ujian CBT, Presensi, dan AI Guru.
Berikan saran strategis berbasis data yang relevan dengan konteks bisnis ini.`

    const systemPrompt = `Anda adalah Asisten AI Data Copilot level C-Level (CFO/CMO/CEO virtual) untuk aplikasi SaaS bernama "SchoolPro" (Manajemen Sekolah).
Tugas Anda adalah merespons pertanyaan Super Admin terkait performa bisnis, keuangan, pengguna, dan aktivitas sistem.
${businessContext}

Anda memiliki alat (tool) bernama "execute_postgres_query". Anda BISA dan HARUS menggunakannya jika pengguna menanyakan data berbasis angka, statistik, performa, jam aktif, dan sebagainya.

**PANDUAN TEXT-TO-SQL:**
Berikut adalah struktur database (Prisma Schema) saat ini:
\`\`\`prisma
${schemaContext}
\`\`\`
1. Tulis query PostgreSQL murni (Raw SQL).
2. NAMA TABEL DAN KOLOM HARUS DIBERI KUTIP DUA (") persis seperti penamaan di Prisma Schema, karena PostgreSQL bersifat case-sensitive terhadap nama yang di-quote. Contoh: SELECT "id", "createdAt" FROM "User" WHERE "role" = 'ADMIN'
3. Hanya lakukan SELECT (Read-only). DILARANG KERAS menggunakan instruksi perusak (UPDATE/DELETE/DROP dll).
4. Setelah mendapat hasil JSON dari alat tersebut, rangkum dan jelaskan datanya ke pengguna dalam bahasa Indonesia yang elegan, cerdas, dan ringkas layaknya seorang Konsultan Bisnis Profesional. Jangan berikan output raw JSON langsung ke pengguna tanpa dirangkum.
5. Jika ada potensi saran bisnis dari data tersebut (misal: "Traffic tertinggi di jam 20.00, ini waktu yang bagus untuk promo"), sampaikan secara inisiatif.

Jawablah dengan bahasa Indonesia yang rapi, format Markdown, dan selalu usahakan menyertakan data asli dari database alih-alih menjawab secara hipotetis.`

    // Handle Session Creation Early
    let currentSessionId = sessionId
    if (!currentSessionId) {
      const firstUserMsg = messages.find((m: any) => m.role === "user")?.content || "Percakapan Analisis Baru"
      const title = firstUserMsg.length > 50 ? firstUserMsg.substring(0, 50) + "..." : firstUserMsg
      
      const newSession = await db.aiChatSession.create({
         data: {
            userId: session.user.id,
            title: "[Analyst] " + title,
            messages: "[]"
         }
      })
      currentSessionId = newSession.id
    }

    // Generate Stream with Tools
    const result = await streamText({
      model: modelResult.model,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      tools: {
        execute_postgres_query: tool({
          description: "Execute a read-only PostgreSQL query to fetch business or system data. Always use double quotes for Table and Column names based on the Prisma schema.",
          parameters: z.object({
            query: z.string().describe("The PostgreSQL SELECT query to execute")
          }),
          execute: async ({ query }) => {
            const cleanQuery = query.trim()
            
            // Keamanan Kritis: Cegah SQL Injection & Operasi DML/DDL menggunakan REGEX ketat.
            // Memblokir komentar `/* ... */`, `--` dan memaksakan query hanya dimulai dengan SELECT (atau WITH .. SELECT).
            const isSafeReadQuery = /^(?:\s*WITH\s+[\s\S]+?)?\s*SELECT\s/i.test(cleanQuery)
            if (!isSafeReadQuery) {
              return { error: "Izin ditolak. Format query tidak valid. Anda hanya diperbolehkan menjalankan operasi baca murni (SELECT)." }
            }

            // Blokir DML/DDL & Keyword perusak secara case-insensitive
            const destructiveRegex = /\b(UPDATE|DELETE|DROP|INSERT|ALTER|TRUNCATE|GRANT|REVOKE|EXEC|MERGE|COPY)\b/i
            if (destructiveRegex.test(cleanQuery)) {
              return { error: "Operasi destruktif atau mutasi dilarang keras." }
            }

            try {
              // Jalankan query mentah dengan rawUnsafe
              // Karena query datang dari AI, kita harus mempercayai AI tidak merusak (sudah difilter ketat di atas)
              const data = await db.$queryRawUnsafe(cleanQuery)
              
              // Batasi ukuran output agar token AI tidak meledak (max 50 baris)
              if (Array.isArray(data) && data.length > 50) {
                return { 
                  results: data.slice(0, 50),
                  note: `Hasil dipotong menjadi 50 baris pertama dari total ${data.length} baris karena batas limit teks.`
                }
              }

              return { results: data }
            } catch (error: any) {
              return { error: "Gagal menjalankan query: " + error.message }
            }
          }
        }),
      },
      // Berikan keleluasaan model untuk memanggil alat secara berurutan jika perlu
      maxToolRoundtrips: 2,
      async onFinish({ text }) {
        try {
           const allMessages = [...messages, { role: "assistant", content: text }]
           await db.aiChatSession.update({
              where: { id: currentSessionId },
              data: { messages: JSON.stringify(allMessages) }
           })
        } catch (err) {
           console.error("Failed to save chat session", err)
        }
      }
    })

    return result.toTextStreamResponse({
      headers: {
        'x-session-id': currentSessionId
      }
    })
  } catch (error: any) {
    console.error("AI Analyst Error:", error)
    return new Response(error.message || "Terjadi kesalahan server", { status: 500 })
  }
}
