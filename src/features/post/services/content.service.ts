import { db } from "@/lib/db"
import { invalidatePublicTenantCache } from "@/features/tenant/services/tenant-public.service"

// ==========================================
// Query: List Posts
// ==========================================
export async function listPosts(tenantId: string, type?: string | null) {
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

  return db.post.findMany({
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
}

// ==========================================
// Mutation: Create Post
// ==========================================
export async function createPost(params: {
  tenantId: string
  userId: string
  isSuperAdmin: boolean
  data: Record<string, any>
}) {
  const { tenantId, userId, isSuperAdmin, data } = params

  // Verifikasi peran
  let userRole = "orangtua"
  if (!isSuperAdmin) {
    const tu = await db.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
    })
    const allowedRoles = ["owner", "admin", "teacher", "operator", "guru"]
    if (!tu || !allowedRoles.includes(tu.role)) {
      throw new Error("Tidak punya izin untuk membuat artikel")
    }
    userRole = tu.role
  }

  // Guru tidak bisa mempublikasikan langsung (wajib approval)
  let finalStatus = data.status || "PUBLISHED"
  if (userRole === "guru") {
    finalStatus = "PENDING"
  }

  const post = await db.post.create({
    data: {
      ...data,
      tenantId,
      authorId: userId,
      status: finalStatus
    } as any
  })

  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) await invalidatePublicTenantCache(tenant.slug)

  // TRIGGER GAMIFICATION (Direct DB call)
  try {
    const { addGamificationPoints } = await import("@/features/gamification/services/gamification.service")
    await addGamificationPoints({
      tenantId,
      userId,
      type: ["EDITORIAL", "BLOG_GURU"].includes(data.type as string) ? "ARTIKEL" : "PENGUMUMAN",
      points: ["EDITORIAL", "BLOG_GURU"].includes(data.type as string) ? 20 : 5,
      description: `Membuat postingan: ${data.title}`
    })
  } catch (error) {
    console.error("Failed to trigger gamification event", error)
  }

  return post
}

// ==========================================
// Query: List Events
// ==========================================
export async function listEvents(tenantId: string) {
  return db.event.findMany({
    where: { tenantId },
    orderBy: { startDate: 'asc' },
  })
}

// ==========================================
// Mutation: Create Event
// ==========================================
export async function createEvent(params: {
  tenantId: string
  userId: string
  isSuperAdmin: boolean
  data: Record<string, any>
}) {
  const { tenantId, userId, isSuperAdmin, data } = params

  if (!isSuperAdmin) {
    const tu = await db.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
    })
    const allowedRoles = ["owner", "admin", "operator"]
    if (!tu || !allowedRoles.includes(tu.role)) {
      throw new Error("Tidak punya izin untuk membuat acara")
    }
  }

  const event = await db.event.create({
    data: { ...data, tenantId } as any
  })

  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) await invalidatePublicTenantCache(tenant.slug)

  return event
}

// ==========================================
// Query: List Categories
// ==========================================
export async function listCategories(tenantId: string) {
  return db.category.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  })
}

// ==========================================
// Mutation: Create Category
// ==========================================
export async function createCategory(params: {
  tenantId: string
  userId: string
  isSuperAdmin: boolean
  data: Record<string, any>
}) {
  const { tenantId, userId, isSuperAdmin, data } = params

  if (!isSuperAdmin) {
    const tu = await db.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
    })
    const allowedRoles = ["owner", "admin", "teacher", "operator"]
    if (!tu || !allowedRoles.includes(tu.role)) {
      throw new Error("Tidak punya izin untuk membuat kategori")
    }
  }

  // Check unique slug
  const existingCategory = await db.category.findFirst({
    where: { tenantId, slug: data.slug }
  })

  if (existingCategory) {
    throw new Error("Slug kategori sudah digunakan")
  }

  return db.category.create({
    data: { ...data, tenantId } as any
  })
}
