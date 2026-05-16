import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { postSchema } from "@/lib/validations/post"
import { parseBody, requireTenantMembership } from "@/lib/api-utils"
import { z } from "zod"
import { invalidatePublicTenantCache } from "@/lib/services/tenant-public"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  const type = url.searchParams.get("type")

  if (!tenantId) return NextResponse.json({ error: "tenantId harus diisi" }, { status: 400 })

  const { session, error } = await requireTenantMembership(tenantId)
  if (error) return error

  const whereClause: any = { tenantId }
  
  if (type) {
    if (type === "PENGUMUMAN_GTK") {
      whereClause.type = { in: ["PENGUMUMAN_GTK", "PENGUMUMAN_SEMUA"] }
    } else if (type === "PENGUMUMAN_ORTU") {
      whereClause.type = { in: ["PENGUMUMAN_ORTU", "PENGUMUMAN_SEMUA"] }
    } else if (type === "PENGUMUMAN_SISWA") {
      whereClause.type = { in: ["PENGUMUMAN_SISWA", "PENGUMUMAN_SEMUA"] }
    } else if (type === "INTERNAL_ANNOUNCEMENTS") {
      whereClause.type = { in: ["PENGUMUMAN_SEMUA", "PENGUMUMAN_GTK", "PENGUMUMAN_ORTU", "PENGUMUMAN_SISWA"] }
    } else {
      whereClause.type = type
    }
  } else {
    // Default Artikel & Pos: Jangan tampilkan pengumuman apapun
    whereClause.type = { notIn: ["PENGUMUMAN", "PENGUMUMAN_GTK", "PENGUMUMAN_ORTU", "PENGUMUMAN_SISWA", "PENGUMUMAN_SEMUA"] }
  }

  const posts = await db.post.findMany({
    where: whereClause,
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
  let userRole = "orangtua"
  if (!isSuperAdmin) {
    const tu = await db.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId, userId: session.user.id } },
    })
    const allowedRoles = ["owner", "admin", "teacher", "operator", "guru"]
    if (!tu || !allowedRoles.includes(tu.role)) {
      return NextResponse.json({ error: "Tidak punya izin untuk membuat artikel" }, { status: 403 })
    }
    userRole = tu.role
  }

  // Jika authorId tidak dikirim dari FE, ambil dari session user
  const authorId = session.user.id

  // Guru tidak bisa mempublikasikan langsung (wajib approval)
  let finalStatus = data.status || "PUBLISHED"
  if (userRole === "guru") {
    finalStatus = "PENDING"
  }

  const post = await db.post.create({
    data: {
      ...data,
      tenantId,
      authorId,
      status: finalStatus
    }
  })

  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) await invalidatePublicTenantCache(tenant.slug)

  // TRIGGER GAMIFICATION
  try {
    const { inngest } = await import("@/lib/inngest/client")
    await inngest.send({
      name: "gamification.point.added",
      data: {
        tenantId,
        userId: session.user.id,
        type: ["EDITORIAL", "BLOG_GURU"].includes(data.type as string) ? "ARTIKEL" : "PENGUMUMAN",
        points: ["EDITORIAL", "BLOG_GURU"].includes(data.type as string) ? 20 : 5,
        description: `Membuat postingan: ${data.title}`
      }
    })
  } catch (error) {
    console.error("Failed to trigger gamification event", error)
  }

  return NextResponse.json({ message: "Artikel berhasil dibuat", post })
}
