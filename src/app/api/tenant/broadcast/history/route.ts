import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  const session = await auth()
  
  const tenantId = session?.user?.tenants?.[0]?.tenantId
  const role = session?.user?.tenants?.[0]?.role
  
  if (!tenantId || (role !== "owner" && role !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get("page") || "1")
    const limit = parseInt(url.searchParams.get("limit") || "10")
    
    const skip = (page - 1) * limit

    const [data, total] = await Promise.all([
      db.waMessage.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.waMessage.count({
        where: { tenantId }
      })
    ])

    return NextResponse.json({
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    })

  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil history pesan" }, { status: 500 })
  }
}
