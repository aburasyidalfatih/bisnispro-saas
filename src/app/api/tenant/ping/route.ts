import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id || !session.user.tenants || session.user.tenants.length === 0) {
      return NextResponse.json({ success: false }, { status: 401 })
    }

    const tenantIds = session.user.tenants.map(t => t.id)
    
    // We update lastActiveAt for all tenants this user has access to,
    // assuming logging into the dashboard means they are active.
    
    const tenants = await db.tenant.findMany({
      where: { id: { in: tenantIds } },
      select: { id: true, lastActiveAt: true }
    })

    const ONE_DAY = 24 * 60 * 60 * 1000
    const nowTime = Date.now()
    
    const tenantsToUpdate = tenants.filter(t => {
      const timeSinceLastActive = nowTime - t.lastActiveAt.getTime()
      return timeSinceLastActive > ONE_DAY
    }).map(t => t.id)

    if (tenantsToUpdate.length > 0) {
      await db.tenant.updateMany({
        where: { id: { in: tenantsToUpdate } },
        data: { lastActiveAt: new Date(), retentionStatus: "ACTIVE" }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[TENANT_PING]", error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
