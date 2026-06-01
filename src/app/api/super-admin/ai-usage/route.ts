import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const url = new URL(req.url)
  const page = Number(url.searchParams.get("page") || "1")
  const limit = Number(url.searchParams.get("limit") || "10")

  try {
    const skip = (page - 1) * limit
    
    const [data, total] = await Promise.all([
      db.aiUsageLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          tenant: { select: { name: true, slug: true } },
          user: { select: { name: true } }
        }
      }),
      db.aiUsageLog.count()
    ])

    return NextResponse.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error: any) {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
