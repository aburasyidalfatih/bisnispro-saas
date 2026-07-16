import { requireTenantMembership } from "@/lib/api-utils"
import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-utils"

export async function GET(req: Request) {
  const { session, error } = await requireAuth()
  if (error) return error

  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  if (!tenantId) return NextResponse.json({ error: "tenantId harus diisi" }, { status: 400 })
  const { error: accessError } = await requireTenantMembership(tenantId as string);
  if (accessError) return accessError;

  try {
    const { getUnreadCount } = await import("@/features/notification/services/inbox.service")
    const result = await getUnreadCount(tenantId, session.user.id, session.user.isSuperAdmin)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
