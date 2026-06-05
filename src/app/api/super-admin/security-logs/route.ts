import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.isSuperAdmin) {
      return new NextResponse("Unauthorized", { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get("limit") || "10")

    const logs = await db.securityLog.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(logs)
  } catch (error) {
    console.error("[SECURITY_LOGS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
