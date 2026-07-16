import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const url = new URL(req.url)
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"))
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "20")))
    const skip = (page - 1) * limit

    const where = {
      auditLogs: {
        none: { action: "USER_LOGIN" as const }
      }
    }

    const [dormantTenants, total] = await Promise.all([
      db.tenant.findMany({
        where,
        take: limit,
        skip,
        select: {
          id: true,
          name: true,
          slug: true,
          email: true,
          phone: true,
          createdAt: true,
          whatsapp: true,
          isActive: true,
        },
        orderBy: {
          createdAt: "desc"
        }
      }),
      db.tenant.count({ where })
    ])

    return NextResponse.json({ data: dormantTenants, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Error fetching dormant tenants:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
