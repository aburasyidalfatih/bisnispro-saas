import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { postSchema } from "@/lib/validations/post"
import { parseBody } from "@/lib/api-utils"
import { z } from "zod"
import { invalidatePublicTenantCache } from "@/lib/services/tenant-public"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  if (!tenantId) return NextResponse.json({ error: "tenantId harus diisi" }, { status: 400 })

  const posts = await db.post.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    include: {
      author: {
        select: { id: true, name: true, email: true, avatar: true }
      },
      category: {
        select: { id: true, name: true }
      }
    }
  })

  return NextResponse.json(posts)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const schema = z.object({
    tenantId: z.string().min(1),
  }).and(postSchema)

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
      return NextResponse.json({ error: "Tidak punya izin untuk membuat artikel" }, { status: 403 })
    }
  }

  // Jika authorId tidak dikirim dari FE, ambil dari session user
  const authorId = session.user.id

  const post = await db.post.create({
    data: {
      ...data,
      tenantId,
      authorId
    }
  })

  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) await invalidatePublicTenantCache(tenant.slug)

  return NextResponse.json({ message: "Artikel berhasil dibuat", post })
}
