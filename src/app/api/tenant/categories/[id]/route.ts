import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { categorySchema } from "@/features/post/schemas/category.schema"
import { parseBody } from "@/lib/api-utils"
import { z } from "zod"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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
      return NextResponse.json({ error: "Tidak punya izin untuk mengubah kategori" }, { status: 403 })
    }
  }

  // Check unique slug (except self)
  const existingCategory = await db.category.findFirst({
    where: { 
      tenantId, 
      slug: data.slug,
      NOT: { id }
    }
  })

  if (existingCategory) {
    return NextResponse.json({ error: "Slug kategori sudah digunakan" }, { status: 400 })
  }

  const category = await db.category.updateMany({
    where: { id, tenantId },
    data
  })

  if (category.count === 0) {
     return NextResponse.json({ error: "Kategori tidak ditemukan atau gagal diupdate" }, { status: 404 })
  }

  return NextResponse.json({ message: "Kategori berhasil diperbarui" })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  if (!tenantId) return NextResponse.json({ error: "tenantId harus diisi" }, { status: 400 })

  const isSuperAdmin = session.user.isSuperAdmin
  if (!isSuperAdmin) {
    const tu = await db.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId, userId: session.user.id } },
    })
    const allowedRoles = ["owner", "admin", "teacher", "operator"]
    if (!tu || !allowedRoles.includes(tu.role)) {
      return NextResponse.json({ error: "Tidak punya izin untuk menghapus kategori" }, { status: 403 })
    }
  }

  const result = await db.category.deleteMany({
    where: { id, tenantId }
  })

  if (result.count === 0) {
    return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 })
  }

  return NextResponse.json({ message: "Kategori berhasil dihapus" })
}
