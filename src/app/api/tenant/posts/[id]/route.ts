import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { postSchema } from "@/features/post/schemas/post.schema"
import { parseBody } from "@/lib/api-utils"
import { z } from "zod"
import { invalidatePublicTenantCache } from "@/features/tenant/services/tenant-public.service"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  if (!tenantId) return NextResponse.json({ error: "tenantId harus diisi" }, { status: 400 })

  const { error } = await (await import("@/lib/api-utils")).requireTenantMembership(tenantId)
  if (error) return error

  const post = await db.post.findFirst({
    where: { id, tenantId },
    include: {
      author: {
        select: { id: true, name: true, email: true, avatar: true }
      }
    }
  })

  if (!post) return NextResponse.json({ error: "Artikel tidak ditemukan" }, { status: 404 })

  return NextResponse.json(post)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const schema = z.object({
    tenantId: z.string().min(1),
  }).and(postSchema)

  const parsed = await parseBody(req, schema)
  if (parsed.error) return parsed.error
  const { tenantId, autoShare, ...data } = parsed.data

  // Verifikasi peran
  const isSuperAdmin = session.user.isSuperAdmin
  if (!isSuperAdmin) {
    const tu = await db.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId, userId: session.user.id } },
    })
    const allowedRoles = ["owner", "admin", "teacher", "operator"]
    if (!tu || !allowedRoles.includes(tu.role)) {
      return NextResponse.json({ error: "Tidak punya izin untuk mengubah artikel" }, { status: 403 })
    }
  }

  // SCHEDULED PLAN VALIDATION
  if (data.status === "SCHEDULED") {
    const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { plan: true } })
    if (!tenant || tenant.plan === "free") {
      return NextResponse.json({ error: "Fitur jadwal posting hanya tersedia untuk paket Lite dan Pro" }, { status: 403 })
    }
    if (!data.publishedAt) {
      return NextResponse.json({ error: "Tanggal tayang harus diisi untuk postingan yang dijadwalkan" }, { status: 400 })
    }
  }

  const post = await db.post.updateMany({
    where: { id, tenantId },
    data
  })

  if (post.count === 0) {
     return NextResponse.json({ error: "Artikel tidak ditemukan atau gagal diupdate" }, { status: 404 })
  }

  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) {
    await invalidatePublicTenantCache(tenant.slug)
    try {
      const { revalidatePath } = await import("next/cache")
      revalidatePath("/", "layout")
    } catch (e) {}
  }

  return NextResponse.json({ message: "Artikel berhasil diperbarui" })
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
      return NextResponse.json({ error: "Tidak punya izin untuk menghapus artikel" }, { status: 403 })
    }
  }

  const postToDelete = await db.post.findFirst({
    where: { id, tenantId }
  })

  if (!postToDelete) {
    return NextResponse.json({ error: "Artikel tidak ditemukan" }, { status: 404 })
  }

  const result = await db.post.deleteMany({
    where: { id, tenantId }
  })

  // [ANTI-FARMING] Deduct points when post is deleted
  try {
    const { addGamificationPoints } = await import("@/features/gamification/services/gamification.service")
    const isArticle = ["EDITORIAL", "BLOG_GURU"].includes(postToDelete.type as string)
    await addGamificationPoints({
      tenantId,
      userId: session.user.id,
      type: isArticle ? "ARTIKEL" : "PENGUMUMAN",
      points: isArticle ? -20 : -5,
      description: `Menghapus postingan: ${postToDelete.title}`
    })
  } catch (error) {
    console.error("Failed to deduct gamification points", error)
  }

  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) {
    await invalidatePublicTenantCache(tenant.slug)
    try {
      const { revalidatePath } = await import("next/cache")
      revalidatePath("/", "layout")
    } catch (e) {}
  }

  return NextResponse.json({ message: "Artikel berhasil dihapus" })
}
