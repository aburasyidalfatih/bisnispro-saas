import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tenantId = session.user.tenants?.[0]?.id
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant not found in session" }, { status: 400 })
    }

    // Verify role
    const tenantUser = await db.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId, userId: session.user.id } }
    })
    
    if (!tenantUser || !["owner", "admin"].includes(tenantUser.role)) {
      if (!session.user.isSuperAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    const { marqueeText, piketSettings } = await req.json()

    // Get current tenant settings
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true, slug: true }
    })

    const currentSettings = (tenant?.settings as Record<string, any>) || {}
    
    const updatedSettings = {
      ...currentSettings,
      marqueeText: marqueeText !== undefined ? marqueeText : currentSettings.marqueeText,
      piketSettings: piketSettings !== undefined ? piketSettings : currentSettings.piketSettings,
    }

    const updated = await db.tenant.update({
      where: { id: tenantId },
      data: {
        settings: updatedSettings
      },
      select: { slug: true }
    })

    // Invalidate Cache
    try {
      const { invalidatePublicTenantCache } = await import("@/features/tenant/services/tenant-public.service")
      await invalidatePublicTenantCache(updated.slug)
    } catch {}

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[TV_SETTINGS_PUT_ERROR]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
