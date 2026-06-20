import { db, withTenant } from "@/lib/db"
import { invalidatePublicTenantCache } from "@/features/tenant/services/tenant-public.service"
import { generateUniqueSlug } from "@/lib/utils/slug"
import { clearTenantCache } from "@/features/tenant/services/tenant-modular.service"

// ==========================================
// Query: List Posts
// ==========================================
export async function listPosts(tenantId: string, type?: string | null) {
  const tenantDb = withTenant(tenantId)
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

  return tenantDb.post.findMany({
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
  const tenantDb = withTenant(tenantId)

  // Verifikasi peran
  let userRole = "orangtua"
  if (!isSuperAdmin) {
    const tu = await tenantDb.tenantUser.findUnique({
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

  // --- ANTI-SPAM LOGIC ---
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const todayPostCount = await tenantDb.post.count({
    where: { 
      tenantId, 
      createdAt: { gte: startOfDay },
      isEligibleForPoints: true 
    }
  })

  const stripHtml = (html: string) => html.replace(/<[^>]*>?/gm, '')
  const contentText = stripHtml(data.content || "").trim()
  
  // Hitung jumlah kata (word count)
  const wordCount = contentText.split(/\s+/).filter(word => word.length > 0).length

  let isEligible = true
  if (contentText.length < 50) isEligible = false
  if (todayPostCount >= 5) isEligible = false

  // Dinamis Poin Berdasarkan Panjang Kata
  let postPoints = ["EDITORIAL", "BLOG_GURU"].includes(data.type as string) ? 20 : 5
  if (["EDITORIAL", "BLOG_GURU"].includes(data.type as string)) {
    if (wordCount > 300) {
      postPoints = 50
    } else if (wordCount >= 150) {
      postPoints = 20
    } else {
      postPoints = 10
    }
  }

  const post = await tenantDb.post.create({
    data: {
      ...data,
      tenantId,
      authorId: userId,
      status: finalStatus,
      isEligibleForPoints: isEligible,
      points: postPoints
    } as any
  })

  // Invalidate cache and Auto-Indexing
  const tenant = await tenantDb.tenant.findUnique({ where: { id: tenantId }, select: { slug: true, domain: true, settings: true } })
  if (tenant) {
    await invalidatePublicTenantCache(tenant.slug)
    try {
      const { revalidatePath } = await import("next/cache")
      revalidatePath("/", "layout");
    if (tenant?.slug) await clearTenantCache(tenant.slug);;
    } catch (e) {
      console.error("Failed to revalidate path", e)
    }

    // [AUTO-INDEXING] Asynchronously Ping Search Engines if published
    if (finalStatus === "PUBLISHED") {
      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "schoolpro.id"
      const host = tenant.domain || `${tenant.slug}.${rootDomain}`
      const isPengumuman = typeof data.type === 'string' && data.type.includes("PENGUMUMAN")
      const postUrl = `https://${host}/${isPengumuman ? 'pengumuman' : 'berita'}/${post.slug}`
      
      const settings = tenant.settings as any || {}
      const googleIndexingCreds = settings.googleIndexingEmail && settings.googleIndexingKey 
        ? { email: settings.googleIndexingEmail, key: settings.googleIndexingKey } 
        : undefined

      Promise.allSettled([
        import("@/lib/seo/indexnow.service").then(m => m.submitToIndexNow(host, [postUrl])),
        import("@/lib/seo/google-indexing.service").then(m => m.submitToGoogleIndexing(postUrl, "URL_UPDATED", googleIndexingCreds))
      ]).catch(e => console.error("Auto-Indexing failed", e))
    }
  }

  // TRIGGER GAMIFICATION (Direct DB call) - HANYA JIKA ELIGIBLE
  if (isEligible && finalStatus === "PUBLISHED") {
    try {
      const { addGamificationPoints } = await import("@/features/gamification/services/gamification.service")
      await addGamificationPoints({
        tenantId,
        userId,
        type: ["EDITORIAL", "BLOG_GURU"].includes(data.type as string) ? "ARTIKEL" : "PENGUMUMAN",
        points: postPoints,
        description: `Membuat postingan: ${data.title}`
      })
    } catch (error) {
      console.error("Failed to trigger gamification event", error)
    }
  }

  // Audit Log
  await tenantDb.auditLog.create({
    data: {
      tenantId,
      action: "CMS_POST_CREATED",
      entity: "Post",
      newData: { postId: post.id, title: post.title }
    }
  }).catch(() => {})

  return post
}

// ==========================================
// Query: List Events
// ==========================================
export async function listEvents(tenantId: string) {
  const tenantDb = withTenant(tenantId)
  return tenantDb.event.findMany({
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
  const tenantDb = withTenant(tenantId)

  if (!isSuperAdmin) {
    const tu = await tenantDb.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
    })
    const allowedRoles = ["owner", "admin", "operator"]
    if (!tu || !allowedRoles.includes(tu.role)) {
      throw new Error("Tidak punya izin untuk membuat acara")
    }
  }

  const slug = await generateUniqueSlug(tenantDb.event, tenantId, data.title || "event")
  const event = await tenantDb.event.create({
    data: { ...data, slug, tenantId } as any
  })

  const tenant = await tenantDb.tenant.findUnique({ where: { id: tenantId }, select: { slug: true, domain: true, settings: true } })
  if (tenant) {
    await invalidatePublicTenantCache(tenant.slug)
    try {
      const { revalidatePath } = await import("next/cache")
      revalidatePath("/", "layout");
    if (tenant?.slug) await clearTenantCache(tenant.slug);;
    } catch (e) {
      console.error("Failed to revalidate path", e)
    }

    // [AUTO-INDEXING] Asynchronously Ping Search Engines for new Event
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "schoolpro.id"
    const host = tenant.domain || `${tenant.slug}.${rootDomain}`
    const eventUrl = `https://${host}/agenda/${event.id}`
    
    const settings = tenant.settings as any || {}
    const googleIndexingCreds = settings.googleIndexingEmail && settings.googleIndexingKey 
      ? { email: settings.googleIndexingEmail, key: settings.googleIndexingKey } 
      : undefined

    Promise.allSettled([
      import("@/lib/seo/indexnow.service").then(m => m.submitToIndexNow(host, [eventUrl])),
      import("@/lib/seo/google-indexing.service").then(m => m.submitToGoogleIndexing(eventUrl, "URL_UPDATED", googleIndexingCreds))
    ]).catch(e => console.error("Auto-Indexing failed", e))
  }

  // Audit Log
  await tenantDb.auditLog.create({
    data: {
      tenantId,
      action: "CMS_EVENT_CREATED",
      entity: "Event",
      newData: { eventId: event.id, title: event.title }
    }
  }).catch(() => {})

  return event
}

// ==========================================
// Query: List Categories
// ==========================================
export async function listCategories(tenantId: string) {
  const tenantDb = withTenant(tenantId)
  return tenantDb.category.findMany({
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
  const tenantDb = withTenant(tenantId)

  if (!isSuperAdmin) {
    const tu = await tenantDb.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
    })
    const allowedRoles = ["owner", "admin", "teacher", "operator"]
    if (!tu || !allowedRoles.includes(tu.role)) {
      throw new Error("Tidak punya izin untuk membuat kategori")
    }
  }

  // Check unique slug
  const existingCategory = await tenantDb.category.findFirst({
    where: { tenantId, slug: data.slug }
  })

  if (existingCategory) {
    throw new Error("Slug kategori sudah digunakan")
  }

  const cat = await tenantDb.category.create({
    data: { ...data, tenantId } as any
  })

  // Audit Log
  await tenantDb.auditLog.create({
    data: {
      tenantId,
      action: "CMS_CATEGORY_CREATED",
      entity: "Category",
      newData: { categoryId: cat.id, name: cat.name }
    }
  }).catch(() => {})

  return cat
}
