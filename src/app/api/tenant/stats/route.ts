import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

import { getAdminStatsCached } from "@/features/dashboard/services/dashboard-cache.service"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  if (!tenantId) return NextResponse.json({ error: "tenantId harus diisi" }, { status: 400 })

  const { error } = await (await import("@/lib/api-utils")).requireTenantMembership(tenantId)
  if (error) return error

  const stats = await getAdminStatsCached(tenantId)

  return NextResponse.json(stats)
}
