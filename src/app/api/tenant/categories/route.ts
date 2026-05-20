import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { categorySchema } from "@/features/post/schemas/category.schema"
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

    const { listCategories } = await import("@/features/post/services/content.service")
    const categories = await listCategories(tenantId)
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

    const { createCategory } = await import("@/features/post/services/content.service")
    const category = await createCategory({
      tenantId,
      userId: session.user.id,
      isSuperAdmin: session.user.isSuperAdmin,
      data
    })
    return NextResponse.json({ message: "Kategori berhasil dibuat", category })
  } catch (error: any) {
    if (error.message?.includes("izin")) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    if (error.message?.includes("sudah digunakan")) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    logger.error("POST Categories Error", error, { path: "/api/tenant/categories" })
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
