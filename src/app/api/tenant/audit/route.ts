import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getAuditLogs } from "@/features/audit/services/audit.service"
import { getAuditLogsSchema } from "@/features/audit/validations"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId") || undefined;
  
  // FSD Validation: Parse via Zod
  const queryParams = {
    tenantId,
    page: Number(url.searchParams.get("page") || "1"),
    limit: Number(url.searchParams.get("limit") || "20"),
    entity: url.searchParams.get("search") || undefined,
  }

  const parsed = getAuditLogsSchema.safeParse(queryParams);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid parameters", details: parsed.error.format() }, { status: 400 })
  }

  if (parsed.data.tenantId) {
    const { error } = await (await import("@/lib/api-utils")).requireTenantMembership(parsed.data.tenantId)
    if (error) return error
  } else {
    // Tanpa tenantId = hanya SuperAdmin yang boleh akses
    const session = await auth()
    if (!session?.user?.isSuperAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Parameter is strictly typed based on parsed.data
  const result = await getAuditLogs(parsed.data)
  return NextResponse.json(result)
}
