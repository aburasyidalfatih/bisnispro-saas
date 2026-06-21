import { db, runWithTenantContext, withTenant } from "@/lib/db"
import { auth } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import { invalidatePublicTenantCache } from "@/features/tenant/services/tenant-public.service"
import { getWebsiteMenuIdentityKey, normalizeWebsiteMenuLabel } from "@/features/website-menu/menu-tree"

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
    const existing = await tenantDb.websiteMenu.findFirst({ where: { id, tenantId } })
    if (!existing) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 })
    }

    const nextParentId = body.parentId !== undefined ? (body.parentId || null) : existing.parentId
    const nextLabel = body.label !== undefined ? normalizeWebsiteMenuLabel(String(body.label)) : existing.label
    const nextUrl = body.url !== undefined ? String(body.url).trim() : existing.url

    if (!nextLabel || !nextUrl) {
      return NextResponse.json({ error: "Label and URL are required" }, { status: 400 })
    }

    if (nextParentId) {
      const parent = await tenantDb.websiteMenu.findFirst({ where: { id: nextParentId, tenantId } })
      if (!parent || parent.id === id) {
        return NextResponse.json({ error: "Parent menu not found" }, { status: 404 })
      }
    }

    const requestedKey = getWebsiteMenuIdentityKey({ label: nextLabel, url: nextUrl })
    const duplicate = (await tenantDb.websiteMenu.findMany({
      where: { tenantId, parentId: nextParentId },
      select: { id: true, label: true, url: true },
    })).find((menu) => menu.id !== id && getWebsiteMenuIdentityKey(menu) === requestedKey)

    if (duplicate) {
      return NextResponse.json({ error: "Menu dengan label dan URL yang sama sudah ada pada level ini." }, { status: 409 })
    }

    const menu = await tenantDb.websiteMenu.update({
      where: { id },
      data: {
        label: nextLabel,
        url: nextUrl,
        icon: body.icon !== undefined ? body.icon : undefined,
        parentId: nextParentId,
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
    const result = await runWithTenantContext(tenantId, async (tx) => {
      const existing = await tx.websiteMenu.findFirst({
        where: { id, tenantId },
        select: { id: true, parentId: true, label: true, url: true },
      })
      if (!existing) {
        return { notFound: true, deletedCount: 0 }
      }

      const allMenus = await tx.websiteMenu.findMany({
        where: { tenantId },
        select: { id: true, parentId: true, label: true, url: true },
      })

      const targetKey = getWebsiteMenuIdentityKey(existing)
      const rootIdsToDelete = existing.parentId
        ? (() => {
            const parent = allMenus.find((menu) => menu.id === existing.parentId)
            const parentGroupIds = parent
              ? allMenus
                .filter((menu) => menu.parentId === parent.parentId && getWebsiteMenuIdentityKey(menu) === getWebsiteMenuIdentityKey(parent))
                .map((menu) => menu.id)
              : [existing.parentId]

            return allMenus
              .filter((menu) => menu.parentId !== null && parentGroupIds.includes(menu.parentId) && getWebsiteMenuIdentityKey(menu) === targetKey)
              .map((menu) => menu.id)
          })()
        : allMenus
          .filter((menu) => menu.parentId === null && getWebsiteMenuIdentityKey(menu) === targetKey)
          .map((menu) => menu.id)

      const childrenByParent = new Map<string, string[]>()

      for (const menu of allMenus) {
        if (!menu.parentId) continue
        const children = childrenByParent.get(menu.parentId) ?? []
        children.push(menu.id)
        childrenByParent.set(menu.parentId, children)
      }

      const idsToDelete: string[] = []
      const visited = new Set<string>()
      const collectDescendantsFirst = (menuId: string) => {
        if (visited.has(menuId)) return
        visited.add(menuId)

        for (const childId of childrenByParent.get(menuId) ?? []) {
          collectDescendantsFirst(childId)
        }
        idsToDelete.push(menuId)
      }
      for (const menuId of rootIdsToDelete) {
        collectDescendantsFirst(menuId)
      }

      await tx.websiteMenu.updateMany({
        where: { tenantId, id: { in: idsToDelete } },
        data: { parentId: null },
      })

      const deleted = await tx.websiteMenu.deleteMany({
        where: { tenantId, id: { in: idsToDelete } },
      })

      return { notFound: false, deletedCount: deleted.count }
    })

    if (result.notFound) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 })
    }

    const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
    if (tenant) await invalidatePublicTenantCache(tenant.slug)

    return NextResponse.json({ success: true, deletedCount: result.deletedCount })
  } catch (error) {
    console.error("[WEBSITE_MENU_DELETE]", error)
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}
