import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { logger } from "@/lib/logger"
import { requireTenantMembership } from "@/lib/api-utils"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const tenantId = searchParams.get("tenantId")
  if (!tenantId) return NextResponse.json({ error: "Missing tenantId" }, { status: 400 })
  const { error: accessError } = await requireTenantMembership(tenantId)
  if (accessError) return accessError

  try {
    const { getAiSettings } = await import("@/features/ai/services/ai-settings.service")
    const result = await getAiSettings(tenantId)
    return NextResponse.json(result)
  } catch (error) {
    logger.error("Failed to fetch AI settings", error, { tenantId })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

