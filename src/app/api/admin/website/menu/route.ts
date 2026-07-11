import { db, runWithTenantContext, withTenant } from "@/lib/db"
import { auth } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import { invalidatePublicTenantCache } from "@/features/tenant/services/tenant-public.service"
import { getWebsiteMenuIdentityKey, normalizeWebsiteMenuLabel, normalizeWebsiteMenuTree } from "@/features/website-menu/menu-tree"
import { removeDuplicateWebsiteMenus } from "@/features/website-menu/menu-maintenance"

export const dynamic = 'force-dynamic'

async function findDuplicateSibling(
  tenantDb: ReturnType<typeof withTenant>,
  tenantId: string,
  parentId: string | null,
  label: string,
  url: string,
  excludeId?: string
) {
  const requestedKey = getWebsiteMenuIdentityKey({ label, url })
  const siblings = await tenantDb.websiteMenu.findMany({
    where: { tenantId, parentId },
    select: { id: true, label: true, url: true },
  })

  return siblings.find((menu) => menu.id !== excludeId && getWebsiteMenuIdentityKey(menu) === requestedKey) ?? null
}

// GET: Ambil semua menu website untuk tenant ini
export async function GET(req: NextRequest) {
  const session = await auth()
  const tenantId = (session?.user as any)?.tenants?.[0]?.id

  if (!session || !tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const menus = await runWithTenantContext(tenantId, async (tx) => {
      await removeDuplicateWebsiteMenus(tx, tenantId)

      return tx.websiteMenu.findMany({
        where: { tenantId, parentId: null },
        include: {
          children: {
            where: { tenantId },
            orderBy: [{ order: "asc" }, { createdAt: "asc" }]
          }
        },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }]
      })
    })

    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true }
    })

    return NextResponse.json({
      menus: normalizeWebsiteMenuTree(menus),
      settings: tenant?.settings || {}
    })
  } catch (error) {
    console.error("[WEBSITE_MENU_GET]", error)
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}

// POST: Buat menu baru
export async function POST(req: NextRequest) {
  const session = await auth()
  const tenantId = (session?.user as any)?.tenants?.[0]?.id

  if (!session || !tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { label, url, parentId, isActive, isSystem, order, icon } = body

    const normalizedLabel = typeof label === "string" ? normalizeWebsiteMenuLabel(label) : ""
    const normalizedUrl = typeof url === "string" ? url.trim() : ""

    if (!normalizedLabel || !normalizedUrl) {
      return NextResponse.json({ error: "Label and URL are required" }, { status: 400 })
    }

    const tenantDb = withTenant(tenantId)
    const normalizedParentId = parentId || null
    if (normalizedParentId) {
      const parent = await tenantDb.websiteMenu.findFirst({ where: { id: normalizedParentId } })
      if (!parent) {
        return NextResponse.json({ error: "Parent menu not found" }, { status: 404 })
      }
    }

    const duplicate = await findDuplicateSibling(tenantDb, tenantId, normalizedParentId, normalizedLabel, normalizedUrl)
    if (duplicate) {
      return NextResponse.json({ error: "Menu dengan label dan URL yang sama sudah ada pada level ini." }, { status: 409 })
    }

    const maxOrderMenu = await tenantDb.websiteMenu.findFirst({
      where: { tenantId, parentId: normalizedParentId },
      orderBy: { order: "desc" }
    })
    const nextOrder = order !== undefined ? order : (maxOrderMenu ? maxOrderMenu.order + 1 : 0)

    const menu = await tenantDb.websiteMenu.create({
      data: {
        tenantId,
        label: normalizedLabel,
        url: normalizedUrl,
        icon: icon || null,
        parentId: normalizedParentId,
        order: nextOrder,
        isActive: isActive !== undefined ? isActive : true,
        isSystem: isSystem || false
      }
    })

    // Invalidate public cache so website reflects changes immediately
    const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
    if (tenant) await invalidatePublicTenantCache(tenant.slug)

    return NextResponse.json(menu)
  } catch (error) {
    console.error("[WEBSITE_MENU_POST]", error)
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}
