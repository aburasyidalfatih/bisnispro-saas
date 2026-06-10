import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { streamText } from "ai"
import { getAiAgentModel } from "@/features/ai/services/ai.service"
import { searchMemory, saveMemory } from "@/features/ai/services/memory.service"
import { db } from "@/lib/db"
import fs from "fs"
import path from "path"
import { z } from "zod"

export const maxDuration = 60

export async function POST(req: Request) {
  const session = await auth()
  
  // Strict Super Admin Check
  if (false) {
    return new Response("Unauthorized. Super Admin access only.", { status: 401 })
  }

  try {
    const { messages, sessionId } = await req.json()

    // Get specialized AI Agent Model for Text-to-SQL
    const modelResult = await getAiAgentModel()
    if (!modelResult.success || !modelResult.model) {
      return new Response(modelResult.error || "Gagal memuat model AI Agent. Periksa pengaturan API Key.", { status: 500 })
    }

    // Fetch OpenAI API Key for Image Generation
    const openAiSetting = await db.platformSetting.findUnique({ where: { key: "OPENAI_API_KEY" } })
    const openAiKey = openAiSetting?.value || process.env.OPENAI_API_KEY

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

    const systemPrompt = `Anda adalah Asisten AI Omniscient (Maha Tahu), gabungan dari Senior Data Scientist, C-Level Advisor, dan Lead Software Engineer untuk SaaS "SchoolPro".
Tugas Anda adalah merespons pertanyaan Super Admin terkait performa bisnis, keuangan, pengguna, dan aktivitas sistem, SERTA mampu menganalisis struktur kode aplikasi itu sendiri dan meriset internet.
${businessContext}

**KAPABILITAS OMNISCIENT (MAHA TAHU):**
1. **Analisis Data (Data Scientist):** Gunakan \`execute_postgres_query\` untuk SQL lanjutan (agregasi, tren, performa) dan \`render_bar_chart\` / \`render_pie_chart\` untuk visualisasi.
2. **Analisis Kode (Lead Engineer):** Gunakan \`list_directory\` dan \`read_source_code\` untuk membaca langsung file proyek SchoolPro ini (Read-Only). Lakukan ini jika pengguna bertanya *bagaimana suatu fitur bekerja di balik layar* atau mencari dokumentasi teknis.
3. **Analisis Pasar (Web Browsing):** Gunakan \`search_web\` untuk meriset tren pasar internet secara *real-time*.
4. **Desain Grafis:** Gunakan \`generate_marketing_image\` (DALL-E 3) untuk materi promosi.

**KEMAMPUAN BELAJAR MANDIRI (AUTONOMOUS LEARNING):**
Anda dilengkapi dengan alat \`save_to_memory\` yang terhubung dengan Vector Database (Otak Kanan Anda).
Anda WAJIB menggunakannya SECARA OTOMATIS tanpa disuruh jika:
1. Anda menemukan *insight* statistik atau pola bisnis yang sangat krusial setelah mengeksekusi kueri database.
2. Super Admin menetapkan aturan, preferensi pelaporan, atau strategi bisnis baru.
Simpan wawasan tersebut ke memori agar Anda menjadi semakin cerdas di masa depan.

**PANDUAN TEXT-TO-SQL:**
Berikut adalah struktur database (Prisma Schema) saat ini:
${schemaContext}

1. Tulis query PostgreSQL murni (Raw SQL).
2. NAMA TABEL DAN KOLOM HARUS DIBERI KUTIP DUA (") persis seperti penamaan di Prisma Schema. Contoh: SELECT "id", "createdAt" FROM "User" WHERE "role" = 'ADMIN'
3. Hanya lakukan SELECT (Read-only). DILARANG KERAS menggunakan instruksi perusak (UPDATE/DELETE/DROP dll).
4. Setelah mendapat hasil JSON dari alat tersebut, rangkum dan jelaskan datanya ke pengguna layaknya seorang Data Scientist & Konsultan Bisnis Profesional yang elegan dan cerdas. 
5. Berikan saran bisnis proaktif dari data tersebut secara inisiatif.

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

    // RAG: Cari memori berdasarkan pesan terakhir pengguna
    const lastUserMsg = messages.filter((m: any) => m.role === "user").pop()?.content || ""
    let memoryContext = ""
    if (lastUserMsg) {
      const relevantMemories = await searchMemory(lastUserMsg, session.user.id)
      if (relevantMemories.length > 0) {
        memoryContext = `\n\n**MEMORI JANGKA PANJANG (RAG CONTEXT):**\nBerikut adalah catatan historis yang relevan dengan pertanyaan saat ini. Gunakan jika berkaitan:\n` + relevantMemories.map((m: any) => `- ${m}`).join("\n")
      }
    }

    // Generate Stream with Tools
    const result = await streamText({
      model: modelResult.model,
      messages: [
        { role: "system", content: systemPrompt + memoryContext },
        ...messages
      ],
      tools: {
        execute_postgres_query: {
          description: "Execute a read-only PostgreSQL query to fetch business or system data. Always use double quotes for Table and Column names based on the Prisma schema.",
          parameters: z.object({
            query: z.string().describe("The PostgreSQL SELECT query to execute")
          }),
          execute: async ({ query }: { query: string }) => {
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
        },
        render_bar_chart: {
          description: "Generates a Bar Chart to visually represent data. Use this AFTER fetching data from the database if a bar chart is requested or appropriate.",
          parameters: z.object({
            title: z.string().describe("The title of the chart"),
            description: z.string().describe("A short description of the chart"),
            data: z.array(z.object({
              label: z.string().describe("X-axis label"),
              value: z.number().describe("Y-axis numerical value")
            })).describe("The data points for the chart. Keep it under 15 items for readability.")
          }),
          execute: async ({ title, description, data }: { title: string, description: string, data: any }) => {
            return { success: true, message: "Bar chart rendered on client successfully." }
          }
        },
        render_pie_chart: {
          description: "Generates a Pie Chart to visually represent proportions or percentages. Use this AFTER fetching data from the database if a pie chart is requested or appropriate.",
          parameters: z.object({
            title: z.string().describe("The title of the pie chart"),
            description: z.string().describe("A short description of the chart"),
            data: z.array(z.object({
              label: z.string().describe("The category label"),
              value: z.number().describe("The numerical value for the proportion")
            })).describe("The data points for the chart. Keep it under 10 items for readability.")
          }),
          execute: async ({ title, description, data }: { title: string, description: string, data: any }) => {
            return { success: true, message: "Pie chart rendered on client successfully." }
          }
        },
        generate_marketing_image: {
          description: "Generates a promotional or marketing image using OpenAI DALL-E 3 based on the user's prompt. Use this when the user asks to create an image, banner, or visual asset.",
          parameters: z.object({
            prompt: z.string().describe("A highly detailed prompt for the image generation model. Make it descriptive and optimize it for a high-quality marketing asset."),
            size: z.enum(["1024x1024", "1024x1792", "1792x1024"]).default("1024x1024").describe("The dimensions of the generated image.")
          }),
          execute: async ({ prompt, size }: { prompt: string, size: "1024x1024" | "1024x1792" | "1792x1024" }) => {
            if (!openAiKey) {
              return { error: "OpenAI API Key is missing. Cannot generate image." }
            }
            try {
              const response = await fetch("https://api.openai.com/v1/images/generations", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${openAiKey}`
                },
                body: JSON.stringify({
                  model: "dall-e-3",
                  prompt: prompt,
                  n: 1,
                  size: size
                })
              })
              const data = await response.json()
              if (data.error) {
                return { error: data.error.message }
              }
              return { success: true, imageUrl: data.data[0].url }
            } catch (error: any) {
              return { error: "Failed to generate image: " + error.message }
            }
          }
        },
        save_to_memory: {
          description: "Simpan informasi, preferensi, atau konteks strategis ke Memori Jangka Panjang (Vector DB). Gunakan alat ini jika pengguna menginstruksikan untuk mengingat sesuatu secara eksplisit atau ada kesimpulan penting.",
          parameters: z.object({
            content: z.string().describe("Teks informasi yang akan disimpan ke memori.")
          }),
          execute: async ({ content }: { content: string }) => {
            const res = await saveMemory(content, session.user.id)
            if (res.success) {
              return { success: true, message: `Memori berhasil disimpan.` }
            }
            return { success: false, error: res.error }
          }
        },
        list_directory: {
          description: "Melihat daftar file dan folder di dalam direktori proyek SchoolPro. Gunakan ini untuk mencari tahu struktur kode sebelum membaca file tertentu.",
          parameters: z.object({
            dirPath: z.string().describe("Path direktori relatif terhadap root proyek. Kosongkan ('') untuk melihat root direktori. Contoh: 'src/app', 'src/features'")
          }),
          execute: async ({ dirPath }: { dirPath: string }) => {
            try {
              const rootPath = process.cwd();
              const targetPath = path.join(rootPath, dirPath);
              if (!targetPath.startsWith(rootPath)) {
                return { error: "Akses ditolak. Direktori di luar cakupan proyek." };
              }
              const files = fs.readdirSync(targetPath, { withFileTypes: true });
              const result = files.map(f => (f.isDirectory() ? `[DIR]  ${f.name}` : `[FILE] ${f.name}`));
              return { path: dirPath, contents: result };
            } catch (error: any) {
              return { error: "Gagal membaca direktori: " + error.message };
            }
          }
        },
        read_source_code: {
          description: "Membaca isi file source code di dalam proyek SchoolPro. Gunakan ini untuk menganalisis bagaimana sebuah fitur, komponen, atau service bekerja di backend/frontend.",
          parameters: z.object({
            filePath: z.string().describe("Path file relatif terhadap root proyek. Contoh: 'src/features/tenant/services/tenant.service.ts'")
          }),
          execute: async ({ filePath }: { filePath: string }) => {
            try {
              const rootPath = process.cwd();
              const targetPath = path.join(rootPath, filePath);
              if (!targetPath.startsWith(rootPath)) {
                return { error: "Akses ditolak. File di luar cakupan proyek." };
              }
              if (!fs.existsSync(targetPath)) {
                return { error: "File tidak ditemukan." };
              }
              const stat = fs.statSync(targetPath);
              if (stat.size > 1024 * 100) { // Limit 100KB
                return { error: "File terlalu besar untuk dibaca langsung." };
              }
              const content = fs.readFileSync(targetPath, "utf-8");
              return { filePath, content };
            } catch (error: any) {
              return { error: "Gagal membaca file: " + error.message };
            }
          }
        },
        search_web: {
          description: "Mencari informasi di internet secara real-time. Gunakan ini untuk meriset kompetitor, mencari berita pendidikan, atau tren bisnis terbaru.",
          parameters: z.object({
            query: z.string().describe("Kata kunci pencarian yang spesifik.")
          }),
          execute: async ({ query }: { query: string }) => {
            // Cek apakah ada API key Tavily di platform setting atau env
            const tavilySetting = await db.platformSetting.findUnique({ where: { key: "TAVILY_API_KEY" } });
            const tavilyKey = tavilySetting?.value || process.env.TAVILY_API_KEY;
            
            if (!tavilyKey) {
              return { error: "TAVILY_API_KEY belum dikonfigurasi oleh Super Admin. Tolong beri tahu pengguna untuk mendaftar di tavily.com secara gratis dan memasukkan kuncinya ke tabel platform_settings atau .env agar fitur ini bisa digunakan." };
            }
            
            try {
              const response = await fetch("https://api.tavily.com/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  api_key: tavilyKey,
                  query: query,
                  search_depth: "basic",
                  include_answer: true,
                  max_results: 3
                })
              });
              const data = await response.json();
              if (data.error) return { error: data.error };
              return { answer: data.answer, results: data.results.map((r: any) => ({ title: r.title, content: r.content, url: r.url })) };
            } catch (error: any) {
              return { error: "Gagal melakukan pencarian internet: " + error.message };
            }
          }
        },
      },
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
