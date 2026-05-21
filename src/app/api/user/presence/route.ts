import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth.config"
import { getRedis } from "@/lib/redis"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id || !session.user.tenantId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const redis = getRedis()
    if (!redis) {
      return NextResponse.json({ success: false, error: "Redis unavailable" }, { status: 503 })
    }

    const key = `online_users:${session.user.tenantId}:${session.user.id}`
    // Set expiry to 3 minutes (180 seconds)
    await redis.setex(key, 180, "1")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[PRESENCE_API]", error)
    return NextResponse.json({ success: false, error: "Internal Error" }, { status: 500 })
  }
}
