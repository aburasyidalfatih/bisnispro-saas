import { createOpenAI } from "@ai-sdk/openai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { db } from "@/lib/db"

export type AiModelResult = {
  success: boolean
  model?: any
  error?: string
}

export const DEFAULT_AI_TOKEN_COSTS: Record<string, number> = {
  "vision-mission": 15,
  "about": 30,
  "principal-speech": 25,
  "program": 15,
  "facility": 10,
  "teacher-bio": 10,
  "extracurricular": 15,
  "event": 10,
  "achievement": 10,
  "alumni": 5,
  "post": 50,
}

export async function getAiTokenCosts(): Promise<Record<string, number>> {
  const setting = await db.platformSetting.findUnique({ where: { key: "AI_TOKEN_RATES" } })
  if (setting && setting.value) {
    try {
      return { ...DEFAULT_AI_TOKEN_COSTS, ...JSON.parse(setting.value) }
    } catch(e) {}
  }
  return DEFAULT_AI_TOKEN_COSTS
}

export async function getAiModel(tenantId: string): Promise<AiModelResult> {
  try {
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true }
    })

    // Fetch global AI settings
    const settings = await db.platformSetting.findMany({
      where: { key: { in: ["AI_PROVIDER", "OPENAI_API_KEY", "OPENAI_MODEL", "GEMINI_API_KEY", "GEMINI_MODEL", "OPENROUTER_API_KEY", "OPENROUTER_MODEL"] } }
    })
    
    const settingsMap: Record<string, string> = {}
    settings.forEach(s => { settingsMap[s.key] = s.value })

    const aiProvider = settingsMap.AI_PROVIDER || "openai"
    
    if (aiProvider === "gemini") {
      const apiKey = settingsMap.GEMINI_API_KEY || process.env.GEMINI_API_KEY
      if (!apiKey) return { success: false, error: "Gemini API Key not configured." }
      
      const provider = createGoogleGenerativeAI({ apiKey })
      const modelName = settingsMap.GEMINI_MODEL || "gemini-1.5-flash"
      return { success: true, model: provider(modelName) }
    } else if (aiProvider === "openrouter") {
      const apiKey = settingsMap.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY
      if (!apiKey) return { success: false, error: "OpenRouter API Key not configured." }
      
      const provider = createOpenRouter({ apiKey })
      const modelName = settingsMap.OPENROUTER_MODEL || "meta-llama/llama-3-8b-instruct"
      return { success: true, model: provider(modelName) }
    } else {
      const apiKey = settingsMap.OPENAI_API_KEY || process.env.OPENAI_API_KEY
      if (!apiKey) return { success: false, error: "OpenAI API Key not configured." }
      
      const provider = createOpenAI({ apiKey })
      const modelName = settingsMap.OPENAI_MODEL || "gpt-4o-mini"
      return { success: true, model: provider(modelName) }
    }
  } catch (error) {
    return { success: false, error: "Failed to initialize AI model" }
  }
}

export async function deductAiToken(tenantId: string, tokensUsed: number, userId: string, feature: string) {
  try {
    const tenant = await db.tenant.findUnique({ where: { id: tenantId } })
    if (!tenant) return { success: false, error: "Tenant not found" }

    // Log usage
    await db.aiUsageLog.create({
      data: {
        tenantId,
        userId,
        feature,
        tokens: tokensUsed
      }
    })

    // Deduct tokens
    if (tenant.aiTokens >= tokensUsed) {
      await db.tenant.update({
        where: { id: tenantId },
        data: { aiTokens: { decrement: tokensUsed } }
      })
    } else {
      const remainingToDeduct = tokensUsed - tenant.aiTokens
      await db.tenant.update({
        where: { id: tenantId },
        data: { 
          aiTokens: 0,
          aiAddonTokens: { decrement: remainingToDeduct }
        }
      })
    }
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to deduct AI token" }
  }
}

export async function checkAiTokenBalance(tenantId: string) {
  try {
    const tenant = await db.tenant.findUnique({ where: { id: tenantId } })
    if (!tenant) return { success: false, hasBalance: false, balance: 0, error: "Tenant not found" }
    
    const totalTokens = tenant.aiTokens + tenant.aiAddonTokens
    // Require at least 50 tokens buffer to start a request
    return { success: true, hasBalance: totalTokens >= 50, balance: totalTokens }
  } catch (error) {
    return { success: false, hasBalance: false, balance: 0, error: "Failed to check balance" }
  }
}
