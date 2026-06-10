import { db } from "@/lib/db"
import { createOpenAI } from "@ai-sdk/openai"
import { embed } from "ai"

// Inisialisasi Provider Embedding
async function getEmbeddingModel() {
  const openAiSetting = await db.platformSetting.findUnique({ where: { key: "OPENAI_API_KEY" } })
  const openAiKey = openAiSetting?.value || process.env.OPENAI_API_KEY

  if (!openAiKey) {
    throw new Error("OpenAI API Key is missing. Cannot generate embeddings.")
  }

  const openai = createOpenAI({ apiKey: openAiKey })
  return openai.embedding("text-embedding-3-small")
}

/**
 * Menyimpan teks ingatan ke Vector Database
 */
export async function saveMemory(content: string, userId?: string, tenantId?: string, metadata?: any) {
  try {
    const embeddingModel = await getEmbeddingModel()
    
    // Generate Vector
    const { embedding } = await embed({
      model: embeddingModel,
      value: content,
    })

    // Konversi array vektor menjadi format string yang bisa dibaca pgvector: '[0.1, 0.2, ...]'
    const embeddingString = `[${embedding.join(',')}]`

    // Karena tipe Unsupported("vector") tidak bisa di-insert via Prisma standard create,
    // kita harus menggunakan raw query
    await db.$executeRawUnsafe(`
      INSERT INTO ai_memories ("id", "content", "embedding", "userId", "tenantId", "metadata", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, $2::vector, $3, $4, $5::jsonb, NOW(), NOW())
    `, content, embeddingString, userId || null, tenantId || null, metadata ? JSON.stringify(metadata) : null)

    return { success: true }
  } catch (error: any) {
    console.error("Failed to save memory:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Mencari ingatan yang paling relevan (Semantic Search RAG)
 */
export async function searchMemory(query: string, userId?: string, limit = 5) {
  try {
    const embeddingModel = await getEmbeddingModel()
    
    // Generate Vector dari Query
    const { embedding } = await embed({
      model: embeddingModel,
      value: query,
    })

    const embeddingString = `[${embedding.join(',')}]`

    // Cari memori dengan jarak Cosine (<=>) paling dekat
    let memories: any[] = []
    
    if (userId) {
      memories = await db.$queryRawUnsafe(`
        SELECT content, metadata, 1 - (embedding <=> $1::vector) AS similarity
        FROM ai_memories
        WHERE "userId" = $2 OR "userId" IS NULL
        ORDER BY embedding <=> $1::vector
        LIMIT $3
      `, embeddingString, userId, limit)
    } else {
      memories = await db.$queryRawUnsafe(`
        SELECT content, metadata, 1 - (embedding <=> $1::vector) AS similarity
        FROM ai_memories
        ORDER BY embedding <=> $1::vector
        LIMIT $2
      `, embeddingString, limit)
    }

    // Filter hanya memori yang relevan (misal similarity > 0.3)
    return memories.filter(m => m.similarity > 0.3).map(m => m.content)
  } catch (error) {
    console.warn("Failed to search memory:", error)
    return []
  }
}
