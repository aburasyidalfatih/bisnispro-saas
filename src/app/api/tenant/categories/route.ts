import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { categorySchema } from "@/lib/validations/category"
import { parseBody } from "@/lib/api-utils"
import { z } from "zod"
import { logger } from "@/lib/logger"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const tenantId = url.searchParams.get("tenantId")
    if (!tenantId) return NextResponse.json({ error: "tenantId harus diisi" }, { status: 400 })

    const { error } = await (await import("@/lib/api-utils")).requireTenantMembership(tenantId)
    if (error) return error

    const categories = await db.category.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(categories)
  } catch (error) {
    logger.error("GET Categories Error", error, { path: "/api/tenant/categories" })
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const schema = z.object({
      tenantId: z.string().min(1),
    }).and(categorySchema)

    const parsed = await parseBody(req, schema)
    if (parsed.error) return parsed.error
    const { tenantId, ...data } = parsed.data

    // Verifikasi peran
    const isSuperAdmin = session.user.isSuperAdmin
    if (!isSuperAdmin) {
      const tu = await db.tenantUser.findUnique({
        where: { tenantId_userId: { tenantId, userId: session.user.id } },
      })
      const allowedRoles = ["owner", "admin", "teacher", "operator"]
      if (!tu || !allowedRoles.includes(tu.role)) {
        return NextResponse.json({ error: "Tidak punya izin untuk membuat kategori" }, { status: 403 })
      }
    }

    // Check unique slug
    const existingCategory = await db.category.findFirst({
      where: { tenantId, slug: data.slug }
    })

    if (existingCategory) {
      return NextResponse.json({ error: "Slug kategori sudah digunakan" }, { status: 400 })
    }

    const category = await db.category.create({
      data: {
        ...data,
        tenantId,
      }
    })

    return NextResponse.json({ message: "Kategori berhasil dibuat", category })
  } catch (error) {
    logger.error("POST Categories Error", error, { path: "/api/tenant/categories" })
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

