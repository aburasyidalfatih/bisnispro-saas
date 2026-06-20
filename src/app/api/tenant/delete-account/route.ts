import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { tenantId } = body

    if (!tenantId) {
      return NextResponse.json({ error: "Missing tenantId" }, { status: 400 })
    }

    // Verify user is an owner or admin of this tenant
    const tenantUser = await db.tenantUser.findFirst({
      where: {
        tenantId,
        userId: session.user.id,
        role: { in: ["owner", "admin"] }
      }
    })

    if (!tenantUser && !session.user.isSuperAdmin) {
      return NextResponse.json({ error: "Forbidden: Not an owner or admin" }, { status: 403 })
    }

    // Process deletion
    await db.$transaction(async (tx) => {
      // 1. Delete the entire tenant
      // Cascade rules in schema will delete posts, facilities, etc.
      await tx.tenant.delete({
        where: { id: tenantId }
      })

      // 2. Delete the user's account entirely to remove their personal data
      await tx.user.delete({
        where: { id: session.user.id }
      })
    })

    // 3. Remove the tenant from Redis Leaderboard Cache if exists
    try {
      const { getRedis } = await import("@/lib/redis")
      const redis = getRedis()
      if (redis) {
        await redis.zrem("leaderboard:global", tenantId)
      }
    } catch (e) {
      console.error("Failed to remove tenant from redis cache", e)
    }

    return NextResponse.json({ success: true, message: "Account and website deleted successfully" })
  } catch (error: any) {
    console.error("Delete account error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
