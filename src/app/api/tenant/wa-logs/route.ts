import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "20")
  const search = searchParams.get("search") || ""

  // Wajib dibatasi hanya data milik tenant ini!
  const where: any = {
    tenantId: session.user.tenantId
  }

  if (search) {
    where.OR = [
      { targetNumber: { contains: search, mode: "insensitive" } },
      { message: { contains: search, mode: "insensitive" } }
    ]
  }

  const [logs, total] = await Promise.all([
    db.waQueueLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      // Tidak perlu include tenant karena sudah pasti milik tenant ini
    }),
    db.waQueueLog.count({ where }),
  ])

  return NextResponse.json({ data: logs, total })
}
