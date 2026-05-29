import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    const [total, data] = await Promise.all([
      db.dripLog.count(),
      db.dripLog.findMany({
        skip,
        take: limit,
        orderBy: { sentAt: 'desc' },
        include: {
          campaign: true,
          tenant: { select: { name: true, domain: true, slug: true } }
        }
      })
    ])

    return NextResponse.json({
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: "Gagal mengambil data email edukasi" }, { status: 500 })
  }
}
