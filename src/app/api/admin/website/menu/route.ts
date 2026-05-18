import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import { invalidatePublicTenantCache } from "@/lib/services/tenant-public"

// GET: Ambil semua menu website untuk tenant ini
export async function GET(req: NextRequest) {
  const session = await auth()
  const tenantId = (session?.user as any)?.tenants?.[0]?.id

  if (!session || !tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const menus = await db.websiteMenu.findMany({
      where: { tenantId },
      include: {
        children: {
          orderBy: { order: "asc" }
        }
      },
      orderBy: { order: "asc" }
    })
    
    // Filter out children from the root level to prevent duplicates in the tree
    const rootMenus = menus.filter(m => m.parentId === null)
    
    return NextResponse.json(rootMenus)
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
    const { label, url, parentId, isActive, isSystem, order } = body

    if (!label || url === undefined) {
      return NextResponse.json({ error: "Label and URL are required" }, { status: 400 })
    }

    const maxOrderMenu = await db.websiteMenu.findFirst({
      where: { tenantId, parentId: parentId || null },
      orderBy: { order: "desc" }
    })
    const nextOrder = order !== undefined ? order : (maxOrderMenu ? maxOrderMenu.order + 1 : 0)

    const menu = await db.websiteMenu.create({
      data: {
        tenantId,
        label,
        url,
        parentId: parentId || null,
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
