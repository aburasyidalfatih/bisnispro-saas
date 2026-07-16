import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.isSuperAdmin) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const [warn30, suspend60, churned90] = await Promise.all([
      db.tenant.findMany({
        where: { retentionStatus: "WARN_30" },
        select: { id: true, name: true, slug: true, email: true, whatsapp: true, lastActiveAt: true },
        orderBy: { lastActiveAt: 'asc' },
        take: 50,
      }),
      db.tenant.findMany({
        where: { retentionStatus: "SUSPENDED_60" },
        select: { id: true, name: true, slug: true, email: true, whatsapp: true, lastActiveAt: true },
        orderBy: { lastActiveAt: 'asc' },
        take: 50,
      }),
      db.tenant.findMany({
        where: { retentionStatus: "CHURNED" },
        select: { id: true, name: true, slug: true, email: true, whatsapp: true, lastActiveAt: true },
        orderBy: { lastActiveAt: 'asc' },
        take: 50,
      }),
    ])

    return NextResponse.json({
      warn30,
      suspend60,
      churned90
    })
  } catch (error) {
    console.error("[RETENTION_HISTORY_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
