import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.isSuperAdmin) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const warn30 = await db.tenant.findMany({
      where: { retentionStatus: "WARN_30" },
      select: { id: true, name: true, slug: true, email: true, whatsapp: true, lastActiveAt: true },
      orderBy: { lastActiveAt: 'asc' }
    })

    const suspend60 = await db.tenant.findMany({
      where: { retentionStatus: "SUSPENDED_60" },
      select: { id: true, name: true, slug: true, email: true, whatsapp: true, lastActiveAt: true },
      orderBy: { lastActiveAt: 'asc' }
    })

    return NextResponse.json({
      warn30,
      suspend60
    })
  } catch (error) {
    console.error("[RETENTION_HISTORY_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
