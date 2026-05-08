import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getAuditLogs } from "@/lib/services/audit"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  const page = Number(url.searchParams.get("page") || "1")
  const limit = Number(url.searchParams.get("limit") || "20")
  const entity = url.searchParams.get("search") || undefined

  if (tenantId) {
    const { error } = await (await import("@/lib/api-utils")).requireTenantMembership(tenantId)
    if (error) return error
  } else {
    // Tanpa tenantId = hanya SuperAdmin yang boleh akses
    const session = await auth()
    if (!session?.user?.isSuperAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const result = await getAuditLogs({ tenantId: tenantId || undefined, entity, page, limit })
  return NextResponse.json(result)
}
