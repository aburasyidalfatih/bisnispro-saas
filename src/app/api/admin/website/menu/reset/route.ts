import { db, runWithTenantContext } from "@/lib/db"
import { auth } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import { invalidatePublicTenantCache } from "@/features/tenant/services/tenant-public.service"
import { createDefaultWebsiteMenus } from "@/features/website-menu/default-menus"

export async function POST(req: NextRequest) {
  const session = await auth()
  const tenantId = (session?.user as any)?.tenants?.[0]?.id

  if (!session || !tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await runWithTenantContext(tenantId, async (tx) => {
      await tx.websiteMenu.updateMany({
        where: { tenantId },
        data: { parentId: null },
      })

      await tx.websiteMenu.deleteMany({
        where: { tenantId },
      })

      await createDefaultWebsiteMenus(tx, tenantId)
    })

    const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
    if (tenant) await invalidatePublicTenantCache(tenant.slug)

    return NextResponse.json({ success: true, message: "Menu berhasil direset ke default." })
  } catch (error) {
    console.error("[WEBSITE_MENU_RESET]", error)
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}
