import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function GET(req: Request) {
  const session = await auth() as any
  const headersList = await headers()
  
  let slug = headersList.get("x-tenant-slug")
  if (!slug) {
    const url = new URL(req.url)
    slug = url.searchParams.get("slug") || ""
  }
  
  const tenantUser = session?.user?.tenants?.find((t: any) => t.slug === slug || !slug)
  if (!tenantUser || !["owner", "admin"].includes(tenantUser.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "10")

  try {
    const { getAiUsageLogs } = await import("@/features/ai/services/ai-settings.service")
    const result = await getAiUsageLogs(tenantUser.id, page, limit)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal mengambil log penggunaan AI" }, { status: 500 })
  }
}
