import { NextResponse } from "next/server"
import {
  convertToModelMessages,
  safeValidateUIMessages,
  stepCountIs,
  streamText,
  tool,
  type ToolSet,
  type UIMessage,
} from "ai"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { rateLimit } from "@/lib/rate-limit"
import { getAiAgentModel } from "@/features/ai/services/ai.service"
import { searchMemory, saveMemory } from "@/features/ai/services/memory.service"
import fs from "fs"
import path from "path"
import { z } from "zod"

export const runtime = "nodejs"
export const maxDuration = 60

const MAX_MESSAGES = 40
const MAX_SQL_ROWS = 50
const SQL_TIMEOUT_MS = 5_000
const SOURCE_READ_LIMIT_BYTES = 100 * 1024

let schemaContextCache: string | null = null

const chatRequestSchema = z.object({
  id: z.string().optional(),
  messages: z.array(z.unknown()).min(1).max(MAX_MESSAGES),
  sessionId: z.string().min(1).max(128).nullable().optional(),
  trigger: z.string().optional(),
  messageId: z.string().optional(),
})

const textFileExtensions = new Set([
  ".css",
  ".csv",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mdx",
  ".mjs",
  ".prisma",
  ".sql",
  ".ts",
  ".tsx",
  ".txt",
  ".yml",
  ".yaml",
])

const deniedPathSegments = new Set([
  ".git",
  ".next",
  ".vercel",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "private",
  "storage",
  "tmp",
  "uploads",
])

const deniedFilePatterns = [
  /^\.env(?:\.|$)/i,
  /credential/i,
  /private[-_]?key/i,
  /secret/i,
  /service[-_]?account/i,
  /\.(?:key|pem|p12|pfx)$/i,
]

function getClientIp(req: Request) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "anonymous"
  )
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

function sanitizeJson(value: unknown): unknown {
  return JSON.parse(
    JSON.stringify(value, (_key, nestedValue) => {
      if (typeof nestedValue === "bigint") return nestedValue.toString()
      if (nestedValue instanceof Date) return nestedValue.toISOString()
      return nestedValue
    })
  )
}

function extractMessageText(message: unknown): string {
  if (!message || typeof message !== "object") return ""

  const m = message as { content?: unknown; parts?: unknown }
  if (typeof m.content === "string") return m.content

  if (Array.isArray(m.parts)) {
    return m.parts
      .filter((part): part is { type: string; text?: string } => {
        return Boolean(part && typeof part === "object" && (part as any).type === "text")
      })
      .map((part) => part.text || "")
      .join("\n")
      .trim()
  }

  return ""
}

function getLastUserMessage(messages: UIMessage[]) {
  return [...messages].reverse().find((message) => message.role === "user")
}

function getTitleFromMessages(messages: UIMessage[]) {
  const firstUserMessage = messages.find((message) => message.role === "user")
  const text = extractMessageText(firstUserMessage).trim() || "Percakapan Analisis Baru"
  return text.length > 50 ? `${text.slice(0, 50)}...` : text
}

async function getSchemaContext() {
  if (schemaContextCache !== null) return schemaContextCache

  try {
    const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma")
    if (fs.existsSync(schemaPath)) {
      schemaContextCache = fs.readFileSync(schemaPath, "utf-8")
      return schemaContextCache
    }

    const { Prisma } = await import("@prisma/client")
    schemaContextCache = Prisma.dmmf.datamodel.models
      .map((model) => {
        const dbName = model.dbName ? ` @@map("${model.dbName}")` : ""
        return `model ${model.name}${dbName} { ${model.fields.map((field) => field.name).join(", ")} }`
      })
      .join("\n")
    return schemaContextCache
  } catch (error) {
    logger.warn("Could not load Prisma schema context for AI Analyst", { error: String(error) })
    schemaContextCache = "Prisma schema tidak tersedia. Gunakan tool database secara hati-hati dan hanya untuk agregasi aman."
    return schemaContextCache
  }
}

function stripSqlComments(query: string) {
  return query.replace(/--.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "").trim()
}

function validateReadOnlySql(query: string): string | null {
  const withoutComments = stripSqlComments(query)
  const withoutTrailingSemicolon = withoutComments.replace(/;\s*$/, "").trim()

  if (!withoutTrailingSemicolon) return "Query kosong."
  if (withoutTrailingSemicolon.includes(";")) {
    return "Query multi-statement tidak diperbolehkan."
  }

  const isReadOnlySelect = /^(?:WITH\b[\s\S]+?\bSELECT\b|SELECT\b)/i.test(withoutTrailingSemicolon)
  if (!isReadOnlySelect) {
    return "Hanya query SELECT atau WITH ... SELECT yang diperbolehkan."
  }

  const destructiveRegex = /\b(ALTER|CALL|COPY|CREATE|DELETE|DROP|EXEC|GRANT|INSERT|MERGE|REINDEX|REVOKE|TRUNCATE|UPDATE|VACUUM)\b/i
  if (destructiveRegex.test(withoutTrailingSemicolon)) {
    return "Operasi mutasi, DDL, atau perintah administratif dilarang."
  }

  const dangerousFunctionRegex = /\b(dblink|lo_export|lo_import|pg_read_file|pg_sleep|pg_stat_file|pg_write_file)\b/i
  if (dangerousFunctionRegex.test(withoutTrailingSemicolon)) {
    return "Fungsi PostgreSQL berisiko tinggi tidak diperbolehkan."
  }

  const systemCatalogRegex = /\b(information_schema|pg_catalog|pg_toast)\b/i
  if (systemCatalogRegex.test(withoutTrailingSemicolon)) {
    return "Akses ke katalog sistem database tidak diperbolehkan."
  }

  const blockedTablesRegex = /\b(accounts|ai_memories|audit_logs|platform_settings|sessions|verification_tokens)\b/i
  if (blockedTablesRegex.test(withoutTrailingSemicolon)) {
    return "Tabel sensitif tidak boleh dibaca melalui AI Analyst."
  }

  const sensitiveColumnsRegex = /\b(accessToken|apiKey|api_key|email|password|phone|privateKey|private_key|refreshToken|secret|sessionToken|twoFactorSecret|verificationToken|whatsapp)\b/i
  if (sensitiveColumnsRegex.test(withoutTrailingSemicolon)) {
    return "Kolom PII atau secret tidak boleh dipilih. Gunakan agregasi non-PII."
  }

  const selectStarRegex = /\bSELECT\s+\*/i
  if (selectStarRegex.test(withoutTrailingSemicolon)) {
    return "SELECT * tidak diperbolehkan. Pilih kolom agregasi atau kolom non-sensitif secara eksplisit."
  }

  return null
}

function withSqlRowLimit(query: string) {
  const cleaned = stripSqlComments(query).replace(/;\s*$/, "").trim()
  return `SELECT * FROM (${cleaned}) AS ai_analyst_result LIMIT ${MAX_SQL_ROWS}`
}

function resolveProjectPath(relativePath: string) {
  const rootPath = process.cwd()
  const targetPath = path.resolve(rootPath, relativePath || ".")
  const isInsideRoot = targetPath === rootPath || targetPath.startsWith(rootPath + path.sep)

  if (!isInsideRoot) {
    return { error: "Akses ditolak. Path berada di luar root proyek." }
  }

  const relative = path.relative(rootPath, targetPath)
  const segments = relative.split(path.sep).filter(Boolean)
  const deniedSegment = segments.find((segment) => deniedPathSegments.has(segment))
  if (deniedSegment) {
    return { error: `Akses ditolak. Direktori ${deniedSegment} tidak boleh dibaca.` }
  }

  const basename = path.basename(targetPath)
  if (deniedFilePatterns.some((pattern) => pattern.test(basename))) {
    return { error: "Akses ditolak. File sensitif tidak boleh dibaca." }
  }

  return { targetPath, relativePath: relative }
}

async function enforceToolRateLimit(userId: string, toolName: string, limit: number, windowMs: number) {
  const result = await rateLimit(`ai-analyst:tool:${toolName}:${userId}`, limit, windowMs)
  if (!result.success) {
    return `Rate limit tool ${toolName} tercapai. Coba lagi beberapa saat.`
  }
  return null
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

function createAnalystTools(userId: string, openAiKey?: string | null): ToolSet {
  return {
    execute_postgres_query: tool({
      description:
        "Execute a safe read-only PostgreSQL analytics query. Use aggregate, non-PII SELECT queries only. Never select secrets, PII columns, or use SELECT *.",
      inputSchema: z.object({
        query: z.string().min(1).max(8_000).describe("A PostgreSQL SELECT query for aggregate analytics."),
      }),
      execute: async ({ query }) => {
        const limited = await enforceToolRateLimit(userId, "sql", 12, 60_000)
        if (limited) return { error: limited }

        const validationError = validateReadOnlySql(query)
        if (validationError) return { error: validationError }

        try {
          const safeQuery = withSqlRowLimit(query)
          const data = await db.$transaction(
            async (tx) => {
              await tx.$executeRawUnsafe(`SET LOCAL statement_timeout = '${SQL_TIMEOUT_MS}ms'`)
              return tx.$queryRawUnsafe(safeQuery)
            },
            { timeout: SQL_TIMEOUT_MS + 2_000 }
          )

          const results = Array.isArray(data) ? data : [data]
          return {
            results: sanitizeJson(results),
            note:
              results.length >= MAX_SQL_ROWS
                ? `Hasil dibatasi maksimal ${MAX_SQL_ROWS} baris di tingkat SQL.`
                : undefined,
          }
        } catch (error: any) {
          logger.warn("AI Analyst SQL tool failed", { error: error?.message })
          return { error: "Gagal menjalankan query aman: " + (error?.message || "unknown error") }
        }
      },
    }),

    render_bar_chart: tool({
      description: "Generate a bar chart after data has been fetched. Keep labels short and values numeric.",
      inputSchema: z.object({
        title: z.string().min(1).max(120),
        description: z.string().max(300),
        data: z.array(z.object({ label: z.string().max(80), value: z.number() })).max(15),
      }),
      execute: async () => ({ success: true, message: "Bar chart rendered on client successfully." }),
    }),

    render_pie_chart: tool({
      description: "Generate a pie chart for proportions after data has been fetched.",
      inputSchema: z.object({
        title: z.string().min(1).max(120),
        description: z.string().max(300),
        data: z.array(z.object({ label: z.string().max(80), value: z.number() })).max(10),
      }),
      execute: async () => ({ success: true, message: "Pie chart rendered on client successfully." }),
    }),

    generate_marketing_image: tool({
      description: "Generate a promotional or marketing image. Use sparingly because this tool has direct cost.",
      inputSchema: z.object({
        prompt: z.string().min(20).max(1_500),
        size: z.enum(["1024x1024", "1024x1792", "1792x1024"]).default("1024x1024"),
      }),
      execute: async ({ prompt, size }) => {
        const limited = await enforceToolRateLimit(userId, "image", 3, 60 * 60_000)
        if (limited) return { error: limited }
        if (!openAiKey) return { error: "OpenAI API Key belum dikonfigurasi untuk image generation." }

        try {
          const response = await fetchWithTimeout(
            "https://api.openai.com/v1/images/generations",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${openAiKey}`,
              },
              body: JSON.stringify({
                model: "dall-e-3",
                prompt,
                n: 1,
                size,
              }),
            },
            30_000
          )

          const data = await response.json()
          if (!response.ok || data.error) {
            return { error: data.error?.message || "Gagal membuat gambar." }
          }

          const imageUrl = data.data?.[0]?.url
          if (!imageUrl) return { error: "Provider tidak mengembalikan URL gambar." }

          return { success: true, imageUrl }
        } catch (error: any) {
          return { error: "Gagal membuat gambar: " + (error?.message || "request timeout") }
        }
      },
    }),

    save_to_memory: tool({
      description:
        "Simpan insight strategis non-rahasia ke memori jangka panjang. Jangan simpan PII, secret, token, atau kredensial.",
      inputSchema: z.object({
        content: z.string().min(10).max(2_000),
      }),
      execute: async ({ content }) => {
        const limited = await enforceToolRateLimit(userId, "memory", 20, 60 * 60_000)
        if (limited) return { success: false, error: limited }

        const hasSensitiveText = /\b(password|secret|api[_-]?key|token|credential|email|phone|whatsapp)\b/i.test(content)
        if (hasSensitiveText) {
          return { success: false, error: "Memori tidak boleh menyimpan PII, secret, token, atau kredensial." }
        }

        const result = await saveMemory(content, userId)
        if (result.success) return { success: true, message: "Memori berhasil disimpan." }
        return { success: false, error: result.error }
      },
    }),

    list_directory: tool({
      description: "List non-sensitive files and folders inside the SchoolPro project. Use before reading source files.",
      inputSchema: z.object({
        dirPath: z.string().max(300).default("").describe("Project-relative directory path."),
      }),
      execute: async ({ dirPath }) => {
        const limited = await enforceToolRateLimit(userId, "list_directory", 30, 60_000)
        if (limited) return { error: limited }

        try {
          const resolved = resolveProjectPath(dirPath)
          if ("error" in resolved) return { error: resolved.error }

          const files = fs.readdirSync(resolved.targetPath, { withFileTypes: true })
          const contents = files
            .filter((entry) => !deniedPathSegments.has(entry.name))
            .filter((entry) => !deniedFilePatterns.some((pattern) => pattern.test(entry.name)))
            .map((entry) => (entry.isDirectory() ? `[DIR]  ${entry.name}` : `[FILE] ${entry.name}`))

          return { path: resolved.relativePath || ".", contents }
        } catch (error: any) {
          return { error: "Gagal membaca direktori: " + (error?.message || "unknown error") }
        }
      },
    }),

    read_source_code: tool({
      description:
        "Read a non-sensitive text source file inside the SchoolPro project for code analysis. Do not read env, credential, build, or upload files.",
      inputSchema: z.object({
        filePath: z.string().min(1).max(300).describe("Project-relative source file path."),
      }),
      execute: async ({ filePath }) => {
        const limited = await enforceToolRateLimit(userId, "read_source_code", 20, 60_000)
        if (limited) return { error: limited }

        try {
          const resolved = resolveProjectPath(filePath)
          if ("error" in resolved) return { error: resolved.error }
          if (!fs.existsSync(resolved.targetPath)) return { error: "File tidak ditemukan." }

          const stat = fs.statSync(resolved.targetPath)
          if (!stat.isFile()) return { error: "Path bukan file." }
          if (stat.size > SOURCE_READ_LIMIT_BYTES) {
            return { error: "File terlalu besar untuk dibaca langsung." }
          }

          const extension = path.extname(resolved.targetPath).toLowerCase()
          const basename = path.basename(resolved.targetPath).toLowerCase()
          const isAllowedConfig =
            basename === "package.json" ||
            basename === "tsconfig.json" ||
            basename.startsWith("next.config") ||
            basename.startsWith("tailwind.config")

          if (!textFileExtensions.has(extension) && !isAllowedConfig) {
            return { error: "Hanya file teks/source yang boleh dibaca." }
          }

          const content = fs.readFileSync(resolved.targetPath, "utf-8")
          return { filePath: resolved.relativePath, content }
        } catch (error: any) {
          return { error: "Gagal membaca file: " + (error?.message || "unknown error") }
        }
      },
    }),

    search_web: tool({
      description: "Search the web for market research or education business trends. Use concise, specific queries.",
      inputSchema: z.object({
        query: z.string().min(3).max(200),
      }),
      execute: async ({ query }) => {
        const limited = await enforceToolRateLimit(userId, "search_web", 10, 60_000)
        if (limited) return { error: limited }

        const tavilySetting = await db.platformSetting.findUnique({ where: { key: "TAVILY_API_KEY" } })
        const tavilyKey = tavilySetting?.value || process.env.TAVILY_API_KEY
        if (!tavilyKey) return { error: "TAVILY_API_KEY belum dikonfigurasi." }

        try {
          const response = await fetchWithTimeout(
            "https://api.tavily.com/search",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                api_key: tavilyKey,
                query,
                search_depth: "basic",
                include_answer: true,
                max_results: 3,
              }),
            },
            12_000
          )

          const data = await response.json()
          if (!response.ok || data.error) return { error: data.error || "Pencarian web gagal." }

          return {
            answer: data.answer,
            results: (data.results || []).map((result: any) => ({
              title: result.title,
              content: result.content,
              url: result.url,
            })),
          }
        } catch (error: any) {
          return { error: "Gagal melakukan pencarian internet: " + (error?.message || "request timeout") }
        }
      },
    }),
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return jsonError("Unauthorized", 401)
  if (!session.user.isSuperAdmin) return jsonError("Forbidden", 403)

  const ip = getClientIp(req)
  const [userLimit, ipLimit] = await Promise.all([
    rateLimit(`ai-analyst:user:${session.user.id}`, 20, 60_000),
    rateLimit(`ai-analyst:ip:${ip}`, 60, 60_000),
  ])

  if (!userLimit.success || !ipLimit.success) {
    return NextResponse.json(
      { error: "Terlalu banyak request AI Analyst. Coba lagi sebentar." },
      {
        status: 429,
        headers: {
          "Retry-After": "60",
          "X-RateLimit-Remaining": String(Math.min(userLimit.remaining, ipLimit.remaining)),
        },
      }
    )
  }

  try {
    const parsedBody = chatRequestSchema.safeParse(await req.json())
    if (!parsedBody.success) {
      return jsonError(parsedBody.error.errors.map((error) => error.message).join(", "), 400)
    }

    const { messages, sessionId } = parsedBody.data
    const modelResult = await getAiAgentModel()
    if (!modelResult.success || !modelResult.model) {
      return jsonError(modelResult.error || "Gagal memuat model AI Agent. Periksa pengaturan API Key.", 500)
    }

    const openAiSetting = await db.platformSetting.findUnique({ where: { key: "OPENAI_API_KEY" } })
    const openAiKey = openAiSetting?.value || process.env.OPENAI_API_KEY
    const analystTools = createAnalystTools(session.user.id, openAiKey)

    const validation = await safeValidateUIMessages<UIMessage>({
      messages,
      tools: analystTools as any,
    })

    if (!validation.success) {
      logger.warn("AI Analyst received invalid UI messages", { error: validation.error.message })
      return jsonError("Format pesan chat tidak valid.", 400)
    }

    const validatedMessages = validation.data
    const currentSessionId = sessionId || null

    let persistedSessionId = currentSessionId
    if (persistedSessionId) {
      const existingSession = await db.aiChatSession.findUnique({
        where: { id: persistedSessionId },
        select: { id: true, userId: true },
      })

      if (!existingSession) return jsonError("Sesi chat tidak ditemukan.", 404)
      if (existingSession.userId !== session.user.id) return jsonError("Forbidden", 403)
    } else {
      const newSession = await db.aiChatSession.create({
        data: {
          userId: session.user.id,
          title: "[Analyst] " + getTitleFromMessages(validatedMessages),
          messages: [],
        },
        select: { id: true },
      })
      persistedSessionId = newSession.id
    }

    const schemaContext = await getSchemaContext()
    const businessContext = `
**KONTEKS BISNIS SCHOOLPRO:**
1. Harga Paket: Free (Gratis), Lite (Rp 150.000/bln), Pro (Rp 300.000/bln).
2. Fokus Bisnis saat ini: Mendorong konversi dari Free ke Lite/Pro, dan menurunkan tingkat churn tenant.
3. Target Pasar Utama: SD, SMP, SMA, SMK, dan Pesantren di Indonesia.
4. Fitur Unggulan: PPDB Online, E-Kantin, Ujian CBT, Presensi, dan AI Guru.
Berikan saran strategis berbasis data yang relevan dengan konteks bisnis ini.`

    const systemPrompt = `Anda adalah AI Business Analyst untuk SaaS SchoolPro, gabungan Senior Data Scientist, C-Level Advisor, dan Lead Software Engineer.
Tugas Anda adalah menjawab pertanyaan Super Admin tentang performa bisnis, keuangan, pengguna, aktivitas sistem, kode aplikasi, dan riset pasar.
${businessContext}

**ATURAN KEAMANAN ABSOLUT:**
1. Jangan tampilkan PII, secret, token, password, API key, session, atau data kredensial.
2. Untuk database, gunakan query agregasi SELECT yang aman. Jangan gunakan SELECT *.
3. Jika membutuhkan data pengguna, ambil hitungan, tren, segmentasi, atau agregasi non-PII.
4. Jika tool menolak query karena keamanan, jelaskan alasannya dan tawarkan query agregasi yang lebih aman.

**KAPABILITAS:**
1. execute_postgres_query untuk agregasi data bisnis dan sistem.
2. render_bar_chart/render_pie_chart untuk visualisasi setelah data tersedia.
3. list_directory/read_source_code untuk analisis kode non-sensitif.
4. search_web untuk riset pasar.
5. generate_marketing_image hanya ketika pengguna meminta aset visual.
6. save_to_memory hanya untuk insight strategis non-rahasia.

**PANDUAN SQL:**
Berikut struktur database Prisma saat ini:
${schemaContext}

Gunakan nama tabel PostgreSQL sesuai mapping database (contoh model User biasanya memiliki @@map("users")). Jawab dalam bahasa Indonesia rapi dengan Markdown dan sertakan batasan data jika tool membatasi hasil.`

    const lastUserMessage = getLastUserMessage(validatedMessages)
    const lastUserText = extractMessageText(lastUserMessage)
    let memoryContext = ""

    if (lastUserText) {
      const relevantMemories = await searchMemory(lastUserText, session.user.id)
      if (relevantMemories.length > 0) {
        memoryContext =
          "\n\n**MEMORI JANGKA PANJANG (RAG CONTEXT):**\n" +
          relevantMemories.map((memory) => `- ${memory}`).join("\n")
      }
    }

    const modelMessages = await convertToModelMessages(validatedMessages)

    const result = await streamText({
      model: modelResult.model,
      messages: [
        { role: "system", content: systemPrompt + memoryContext },
        ...modelMessages,
      ],
      tools: analystTools,
      stopWhen: stepCountIs(5),
    })

    return result.toUIMessageStreamResponse<UIMessage>({
      headers: {
        "x-session-id": persistedSessionId,
      },
      originalMessages: validatedMessages,
      onFinish: async ({ messages: finishedMessages }) => {
        try {
          await db.aiChatSession.update({
            where: { id: persistedSessionId },
            data: { messages: sanitizeJson(finishedMessages) as any },
          })
        } catch (error) {
          logger.error("Failed to save AI Analyst chat session", error, {
            sessionId: persistedSessionId,
            userId: session.user.id,
          })
        }
      },
    })
  } catch (error: any) {
    logger.error("AI Analyst Error", error, { userId: session.user.id })
    return jsonError(error?.message || "Terjadi kesalahan server", 500)
  }
}
