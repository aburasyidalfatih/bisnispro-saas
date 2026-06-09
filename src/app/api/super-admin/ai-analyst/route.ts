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
      if (fs.existsSync(schemaPath)) {
        schemaContext = fs.readFileSync(schemaPath, "utf-8")
      } else {
        // Fallback untuk Vercel Production jika file tidak ditemukan di root CWD
        const { Prisma } = require("@prisma/client")
        schemaContext = Prisma.dmmf.datamodel.models.map((m: any) => `model ${m.name} { ${m.fields.map((f:any)=>f.name).join(', ')} }`).join('\n')
      }
    } catch (e) {
      console.warn("Could not load schema context", e)
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
Selain itu, Anda memiliki tool "render_bar_chart" dan "render_pie_chart". Jika pengguna meminta visualisasi grafik, atau jika Anda merasa data akan lebih mudah dipahami dalam bentuk grafik, silakan panggil tool grafik tersebut *SETELAH* Anda mendapatkan data dari database.

**PANDUAN TEXT-TO-SQL:**
Berikut adalah struktur database (Prisma Schema) saat ini:
```prisma
${schemaContext}
```
1. Tulis query PostgreSQL murni (Raw SQL).
2. NAMA TABEL DAN KOLOM HARUS DIBERI KUTIP DUA (") persis seperti penamaan di Prisma Schema, karena PostgreSQL bersifat case-sensitive terhadap nama yang di-quote. Contoh: SELECT "id", "createdAt" FROM "User" WHERE "role" = 'ADMIN'
3. Hanya lakukan SELECT (Read-only). DILARANG KERAS menggunakan instruksi perusak (UPDATE/DELETE/DROP dll).
4. Setelah mendapat hasil JSON dari alat tersebut, rangkum dan jelaskan datanya ke pengguna dalam bahasa Indonesia yang elegan, cerdas, dan ringkas layaknya seorang Konsultan Bisnis Profesional. Jangan berikan output raw JSON langsung ke pengguna tanpa dirangkum. Jika Anda memanggil tool grafik, informasikan pengguna bahwa grafik telah ditampilkan.
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
            // Bersihkan komentar agar regex pendeteksi SELECT tidak terkecoh
            const queryWithoutComments = cleanQuery.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').trim()
            
            const isSafeReadQuery = /^(?:\s*WITH\s+[\s\S]+?)?\s*SELECT\s/i.test(queryWithoutComments)
            if (!isSafeReadQuery) {
              return { error: "Izin ditolak. Format query tidak valid. Anda hanya diperbolehkan menjalankan operasi baca murni (SELECT)." }
            }

            // Blokir DML/DDL & Keyword perusak secara case-insensitive
            const destructiveRegex = /\b(UPDATE|DELETE|DROP|INSERT|ALTER|TRUNCATE|GRANT|REVOKE|EXEC|MERGE|COPY)\b/i
            if (destructiveRegex.test(queryWithoutComments)) {
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
        render_bar_chart: tool({
          description: "Generates a Bar Chart to visually represent data. Use this AFTER fetching data from the database if a bar chart is requested or appropriate.",
          parameters: z.object({
            title: z.string().describe("The title of the chart"),
            description: z.string().describe("A short description of the chart"),
            data: z.array(z.object({
              label: z.string().describe("X-axis label"),
              value: z.number().describe("Y-axis numerical value")
            })).describe("The data points for the chart. Keep it under 15 items for readability.")
          }),
          execute: async ({ title, description, data }) => {
            return { success: true, message: "Bar chart rendered on client successfully." }
          }
        }),
        render_pie_chart: tool({
          description: "Generates a Pie Chart to visually represent proportions or percentages. Use this AFTER fetching data from the database if a pie chart is requested or appropriate.",
          parameters: z.object({
            title: z.string().describe("The title of the pie chart"),
            description: z.string().describe("A short description of the chart"),
            data: z.array(z.object({
              label: z.string().describe("The category label"),
              value: z.number().describe("The numerical value for the proportion")
            })).describe("The data points for the chart. Keep it under 10 items for readability.")
          }),
          execute: async ({ title, description, data }) => {
            return { success: true, message: "Pie chart rendered on client successfully." }
          }
        }),
      },
      // Berikan keleluasaan model untuk memanggil alat secara berurutan jika perlu (misal: query DB lalu render chart)
      maxSteps: 3,
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

    return result.toDataStreamResponse({
      headers: {
        'x-session-id': currentSessionId
      }
    })
  } catch (error: any) {
    console.error("AI Analyst Error:", error)
    return new Response(error.message || "Terjadi kesalahan server", { status: 500 })
  }
}
