import { createOpenAI } from "@ai-sdk/openai"
import { db } from "@/lib/db"

export type AiProviderResult = {
  success: boolean
  provider?: ReturnType<typeof createOpenAI>
  error?: string
}

export async function getAiProvider(tenantId: string): Promise<AiProviderResult> {
  try {
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: { customOpenAiKey: true, useCustomApiKey: true }
    })

    // Determine which key to use
    let apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      const globalKey = await db.platformSetting.findUnique({ where: { key: "OPENAI_API_KEY" } })
      if (globalKey) apiKey = globalKey.value
    }

    if (tenant?.useCustomApiKey && tenant?.customOpenAiKey) {
      apiKey = tenant.customOpenAiKey
    }

    if (!apiKey) {
      return { success: false, error: "OpenAI API Key not configured. Please setup your API Key in Settings." }
    }

    const provider = createOpenAI({ apiKey })
    return { success: true, provider }
  } catch (error) {
    return { success: false, error: "Failed to initialize AI provider" }
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

    // Deduct tokens ONLY IF not using custom API key
    if (!tenant.useCustomApiKey) {
      await db.tenant.update({
        where: { id: tenantId },
        data: { aiTokens: { decrement: tokensUsed } }
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
    if (!tenant) return { success: false, hasBalance: false, error: "Tenant not found" }
    
    if (tenant.useCustomApiKey) {
      return { success: true, hasBalance: true } // Bypass if using own key
    }
    
    return { success: true, hasBalance: tenant.aiTokens > 0 } // Need at least 1 token
  } catch (error) {
    return { success: false, hasBalance: false, error: "Failed to check balance" }
  }
}
