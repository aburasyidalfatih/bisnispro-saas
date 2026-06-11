import { db, withTenant } from "@/lib/db"
import { auth } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import { invalidatePublicTenantCache } from "@/features/tenant/services/tenant-public.service"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  const tenantId = (session?.user as any)?.tenants?.[0]?.id

  if (!session || !tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const tenantDb = withTenant(tenantId)
    
    // Verifikasi kepemilikan
    const existing = await tenantDb.websiteMenu.findFirst({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 })
    }

    const normalizedParentId = body.parentId !== undefined ? (body.parentId || null) : undefined
    if (normalizedParentId) {
      const parent = await tenantDb.websiteMenu.findFirst({ where: { id: normalizedParentId } })
      if (!parent || parent.id === id) {
        return NextResponse.json({ error: "Parent menu not found" }, { status: 404 })
      }
    }

    const menu = await tenantDb.websiteMenu.update({
      where: { id },
      data: {
        label: body.label,
        url: body.url,
        parentId: normalizedParentId,
        isActive: body.isActive,
        order: body.order
      }
    })

    const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
    if (tenant) await invalidatePublicTenantCache(tenant.slug)

    return NextResponse.json(menu)
  } catch (error) {
    console.error("[WEBSITE_MENU_PATCH]", error)
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  const tenantId = (session?.user as any)?.tenants?.[0]?.id

  if (!session || !tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const tenantDb = withTenant(tenantId)
    const existing = await tenantDb.websiteMenu.findFirst({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 })
    }

    if (existing.isSystem) {
      return NextResponse.json({ error: "Menu sistem tidak dapat dihapus" }, { status: 400 })
    }

    await tenantDb.websiteMenu.delete({
      where: { id }
    })

    const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
    if (tenant) await invalidatePublicTenantCache(tenant.slug)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[WEBSITE_MENU_DELETE]", error)
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}
