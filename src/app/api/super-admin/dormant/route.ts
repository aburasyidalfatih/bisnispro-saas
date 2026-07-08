import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const dormantTenants = await db.tenant.findMany({
      where: {
        auditLogs: {
          none: { action: { contains: "login", mode: "insensitive" } }
        }
      },
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
    });

    return NextResponse.json(dormantTenants);
  } catch (error) {
    console.error("Error fetching dormant tenants:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
