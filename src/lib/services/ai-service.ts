import { createOpenAI } from "@ai-sdk/openai"
import { generateText, generateObject } from "ai"
import { db } from "@/lib/db"

export async function getAiProvider(tenantId: string) {
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
    throw new Error("OpenAI API Key not configured. Please setup your API Key in Settings.")
  }

  return createOpenAI({ apiKey })
}

export async function deductAiToken(tenantId: string, tokensUsed: number, userId: string, feature: string) {
  const tenant = await db.tenant.findUnique({ where: { id: tenantId } })
  if (!tenant) return

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
}

export async function checkAiTokenBalance(tenantId: string): Promise<boolean> {
  const tenant = await db.tenant.findUnique({ where: { id: tenantId } })
  if (!tenant) return false
  
  if (tenant.useCustomApiKey) return true // Bypass if using own key
  return tenant.aiTokens > 0 // Need at least 1 token
}
