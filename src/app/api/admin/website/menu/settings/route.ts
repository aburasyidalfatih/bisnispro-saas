import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function PATCH(req: NextRequest) {
  const session = await auth()
  const tenantId = (session?.user as any)?.tenants?.[0]?.id

  if (!session || !tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { showLoginButton } = body

    if (showLoginButton === undefined) {
      return NextResponse.json({ error: "Missing parameter" }, { status: 400 })
    }

    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true }
    })

    const existingSettings = (tenant?.settings as Record<string, any>) || {}
    
    await db.tenant.update({
      where: { id: tenantId },
      data: {
        settings: {
          ...existingSettings,
          showLoginButton: Boolean(showLoginButton)
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[WEBSITE_MENU_SETTINGS_PATCH]", error)
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}
