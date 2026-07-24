import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

import { Prisma } from "@prisma/client"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = new URL(req.url)
  const search = url.searchParams.get("search") || ""

  let whereClause: Prisma.UserWhereInput = {}
  if (search) {
    whereClause = {
      OR: [
        { name: { contains: search } },
        { email: { contains: search } }
      ]
    }
  }

  const stream = new ReadableStream({
    async start(controller) {
      const header = ["ID", "Nama", "Email", "Role", "Bisnis", "Tanggal Bergabung"]
      controller.enqueue(header.join(",") + "\n")

      const BATCH_SIZE = 1000
      let cursor: string | undefined = undefined
      let hasMore = true

      try {
        while (hasMore) {
          const users: any[] = await db.user.findMany({
            where: whereClause,
            take: BATCH_SIZE,
            skip: cursor ? 1 : 0,
            cursor: cursor ? { id: cursor } : undefined,
            include: {
              tenants: {
                include: {
                  tenant: true
                }
              },
              affiliateProfile: true
            },
            orderBy: { id: "asc" }
          })

          if (users.length === 0) {
            hasMore = false
            break
          }

          const rows = users.map((user: any) => {
            const roles = []
            if (user.isSuperAdmin) roles.push("Super Admin")
            if (user.affiliateProfile) roles.push("Mitra Afiliasi")
            if (user.tenants.length > 0) roles.push("Admin Tenant")
            if (roles.length === 0) roles.push("User Biasa")

            const tenants = user.tenants.map((t: any) => `${t.tenant.name} (${t.role})`).join(" | ")

            return [
              user.id,
              `"${user.name || ""}"`,
              `"${user.email || ""}"`,
              `"${roles.join(", ")}"`,
              `"${tenants}"`,
              `"${new Date(user.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}"`
            ].join(",")
          })

          controller.enqueue(rows.join("\n") + "\n")
          cursor = users[users.length - 1].id
          if (users.length < BATCH_SIZE) hasMore = false
        }
      } catch (e) {
        console.error("Export stream error:", e)
      } finally {
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="Data_Pengguna_BisnisPro_${new Date().toISOString().split('T')[0]}.csv"`
    }
  })
}
