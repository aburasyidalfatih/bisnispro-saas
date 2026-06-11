import { db, runWithTenantContext } from "@/lib/db"
import { auth } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import { invalidatePublicTenantCache } from "@/features/tenant/services/tenant-public.service"

export async function POST(req: NextRequest) {
  const session = await auth()
  const tenantId = (session?.user as any)?.tenants?.[0]?.id

  if (!session || !tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { items } = await req.json()
    // items is an array of { id, order, parentId }

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 })
    }

    await runWithTenantContext(tenantId, async (tx) => {
      for (const item of items) {
        if (item.parentId) {
          const parent = await tx.websiteMenu.findFirst({
            where: { id: item.parentId, tenantId },
            select: { id: true },
          })
          if (!parent || parent.id === item.id) {
            throw new Error("Invalid parent menu")
          }
        }

        await tx.websiteMenu.update({
          where: { id: item.id, tenantId },
          data: { 
            order: item.order,
            parentId: item.parentId || null
          }
        })
      }
    })

    // Invalidate public tenant cache
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: { slug: true }
    })
    if (tenant) {
      await invalidatePublicTenantCache(tenant.slug)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[WEBSITE_MENU_REORDER]", error)
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}
