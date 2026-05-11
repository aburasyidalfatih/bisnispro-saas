import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
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
    const [logs, total] = await Promise.all([
      db.aiUsageLog.findMany({
        where: { tenantId: tenantUser.id },
        include: {
          user: { select: { name: true, email: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.aiUsageLog.count({
        where: { tenantId: tenantUser.id }
      })
    ])

    return NextResponse.json({
      data: logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal mengambil log penggunaan AI" }, { status: 500 })
  }
}
