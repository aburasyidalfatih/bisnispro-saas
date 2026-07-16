import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.isSuperAdmin) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get("page") || "1")
    const limit = parseInt(url.searchParams.get("limit") || "20")
    const search = url.searchParams.get("search") || ""
    const category = url.searchParams.get("category") || ""
    const status = url.searchParams.get("status") || ""

    const where: any = {}
    if (search) {
      where.OR = [
        { message: { contains: search, mode: "insensitive" as const } },
        { path: { contains: search, mode: "insensitive" as const } },
      ]
    }
    
    if (category) {
      where.category = category
    }
    if (status === "resolved") {
      where.isResolved = true
    } else if (status === "unresolved") {
      where.isResolved = false
    }

    const [errors, total] = await Promise.all([
      db.errorLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          tenant: { select: { name: true } },
          user: { select: { name: true, email: true } }
        }
      }),
      db.errorLog.count({ where })
    ])

    return NextResponse.json({ data: errors, total })
  } catch (error) {
    console.error("[SUPER_ADMIN_ERRORS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
