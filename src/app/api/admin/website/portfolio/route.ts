import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireTenantMembership } from "@/lib/api-utils"
import { invalidateDashboardCache } from "@/features/tenant/services/tenant-management.service"
import { auth } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    
    const tenantId = (session.user as any).tenants?.[0]?.id
    if (!tenantId) return NextResponse.json({ error: "No tenant" }, { status: 400 })

    const data = await db.portfolio.findMany({
      where: { tenantId },
      orderBy: { completedAt: 'desc' }
    })
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    
    const tenantId = (session.user as any).tenants?.[0]?.id
    if (!tenantId) return NextResponse.json({ error: "No tenant" }, { status: 400 })
    
    await requireTenantMembership(tenantId, ["OWNER", "ADMIN", "STAFF"])
    
    const body = await req.json()
    const { title, slug, description, completedAt, clientName, category, imageUrl, projectUrl, sortOrder } = body
    
    if (!title || !slug || !completedAt) return NextResponse.json({ error: "Judul, slug, dan tanggal wajib diisi" }, { status: 400 })

    const existing = await db.portfolio.findFirst({
      where: { tenantId, slug }
    })
    if (existing) return NextResponse.json({ error: "Slug sudah digunakan" }, { status: 400 })

    const result = await db.portfolio.create({
      data: {
        tenantId,
        title,
        slug,
        description,
        completedAt: new Date(completedAt),
        clientName: clientName || "Rahasia",
        category: category || "Umum",
        imageUrl,
        projectUrl,
        sortOrder: sortOrder || 0
      }
    })

    await invalidateDashboardCache(tenantId)
    
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
