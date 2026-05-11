import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const tenantId = searchParams.get("tenantId")

  if (!tenantId) return NextResponse.json({ error: "Missing tenantId" }, { status: 400 })

  try {
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: { aiTokens: true, useCustomApiKey: true, customOpenAiKey: true }
    })

    if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 })

    return NextResponse.json({
      aiTokens: tenant.aiTokens,
      useCustomApiKey: tenant.useCustomApiKey,
      customOpenAiKey: tenant.customOpenAiKey || ""
    })
  } catch (error) {
    logger.error("Failed to fetch AI settings", error, { tenantId })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const tenantId = searchParams.get("tenantId")

  if (!tenantId) return NextResponse.json({ error: "Missing tenantId" }, { status: 400 })

  try {
    const body = await req.json()
    const { useCustomApiKey, customOpenAiKey } = body

    await db.tenant.update({
      where: { id: tenantId },
      data: {
        useCustomApiKey: Boolean(useCustomApiKey),
        customOpenAiKey: customOpenAiKey || null
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("Failed to update AI settings", error, { tenantId })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
