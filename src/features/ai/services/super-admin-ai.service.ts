import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { createOpenAI } from "@ai-sdk/openai"
import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { db } from "@/lib/db"

/**
 * Get AI model for Super Admin usage (no tenant context needed).
 * Reads directly from PlatformSetting.
 */
export async function getSuperAdminAiModel() {
  try {
    const settings = await db.platformSetting.findMany({
      where: {
        key: {
          in: [
            "AI_PROVIDER", "OPENAI_API_KEY", "OPENAI_MODEL",
            "GEMINI_API_KEY", "GEMINI_MODEL",
            "OPENROUTER_API_KEY", "OPENROUTER_MODEL",
          ],
        },
      },
    })

    const map: Record<string, string> = {}
    settings.forEach(s => { map[s.key] = s.value })

    const provider = map.AI_PROVIDER || "openai"

    if (provider === "gemini") {
      const apiKey = map.GEMINI_API_KEY || process.env.GEMINI_API_KEY
      if (!apiKey) return { success: false as const, error: "Gemini API Key belum dikonfigurasi." }
      const google = createGoogleGenerativeAI({ apiKey })
      const modelName = map.GEMINI_MODEL || "gemini-2.0-flash"
      return { success: true as const, model: google(modelName) }
    } else if (provider === "openrouter") {
      const apiKey = map.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY
      if (!apiKey) return { success: false as const, error: "OpenRouter API Key belum dikonfigurasi." }
      const or = createOpenRouter({ apiKey })
      const modelName = map.OPENROUTER_MODEL || "meta-llama/llama-3-8b-instruct"
      return { success: true as const, model: or(modelName) }
    } else {
      const apiKey = map.OPENAI_API_KEY || process.env.OPENAI_API_KEY
      if (!apiKey) return { success: false as const, error: "OpenAI API Key belum dikonfigurasi." }
      const openai = createOpenAI({ apiKey })
      const modelName = map.OPENAI_MODEL || "gpt-4o-mini"
      return { success: true as const, model: openai(modelName) }
    }
  } catch (error) {
    return { success: false as const, error: "Gagal menginisialisasi AI model." }
  }
}
