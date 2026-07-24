import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireTenantMembership } from "@/lib/api-utils"
import { invalidateDashboardCache } from "@/features/tenant/services/tenant-management.service"
import { auth } from "@/lib/auth"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    
    const tenantId = (session.user as any).tenants?.[0]?.id
    if (!tenantId) return NextResponse.json({ error: "No tenant" }, { status: 400 })
    
    await requireTenantMembership(tenantId, ["OWNER", "ADMIN", "STAFF"])
    
    const body = await req.json()
    const { title, slug, description, completedAt, clientName, category, imageUrl, projectUrl, sortOrder } = body
    
    const result = await db.portfolio.update({
      where: { id: resolvedParams.id, tenantId },
      data: {
        title, slug, description, completedAt: new Date(completedAt), clientName, category, imageUrl, projectUrl, sortOrder
      }
    })

    await invalidateDashboardCache(tenantId)
    
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    
    const tenantId = (session.user as any).tenants?.[0]?.id
    if (!tenantId) return NextResponse.json({ error: "No tenant" }, { status: 400 })
    
    await requireTenantMembership(tenantId, ["OWNER", "ADMIN", "STAFF"])
    
    await db.portfolio.delete({
      where: { id: resolvedParams.id, tenantId }
    })

    await invalidateDashboardCache(tenantId)
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
