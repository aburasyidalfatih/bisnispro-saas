import { db } from "@/lib/db"
import { invalidatePublicTenantCache } from "./tenant-public.service"
import { getRedis } from "@/lib/redis"
import { clearTenantCache } from "@/features/tenant/services/tenant-modular.service"

const DASHBOARD_CACHE_PREFIX = "dashboard:website:"
const DASHBOARD_CACHE_TTL = 900 // 15 minutes

// ==========================================
// Query: Data Website Tenant (Dashboard CMS)
// ==========================================
export async function getWebsiteData(tenantId: string) {
  // Try Redis cache first
  try {
    const redis = getRedis()
    if (redis) {
      const cached = await redis.get(`${DASHBOARD_CACHE_PREFIX}${tenantId}`)
      if (cached) {
        return JSON.parse(cached)
      }
    }
  } catch (e) {
    // Cache miss or error, continue to DB
  }

  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true, name: true, slug: true, tagline: true, description: true,
      about: true, logo: true, heroImage: true, address: true, phone: true,
      email: true, website: true, whatsapp: true, instagram: true,
      facebook: true, youtube: true, tiktok: true, gallery: true, settings: true,
      seoTitle: true, seoDesc: true, googleClientId: true, googleClientSecret: true,
      plan: true,
      subscriptionPlan: {
        select: { maxStorage: true }
      },
      _count: {
        select: {
          posts: true,
          documents: true,
          facilities: true,
          staff: true,
          achievements: true,
          alumni: true,
          extracurriculars: true,
          programs: true,
          popups: true,
          sliders: true,
          events: true,
          partnerships: true,
          contactSubmissions: {
            where: { isRead: false }
          },
        }
      },
      tenantScore: true
    },
  })

  if (!tenant) throw new Error("Tenant tidak ditemukan")

  const diskStats = await db.fileUpload.aggregate({
    where: { tenantId },
    _sum: { size: true }
  })

  let maxStorage = tenant.subscriptionPlan?.maxStorage
  if (maxStorage === undefined) {
    maxStorage = tenant.plan === "free" ? 200 : 1024 // Fallback
  }

  const resultData = {
    ...tenant,
    diskUsage: diskStats._sum.size || 0,
    maxStorage: maxStorage * 1024 * 1024
  }

  // Cache in Redis
  try {
    const redis = getRedis()
    if (redis) {
      await redis.setex(`${DASHBOARD_CACHE_PREFIX}${tenantId}`, DASHBOARD_CACHE_TTL, JSON.stringify(resultData))
    }
  } catch (e) {
    // Non-critical
  }

  return resultData
}

/**
 * Invalidate dashboard cache for a tenant (called after mutations)
 */
export async function invalidateDashboardCache(tenantId: string) {
  try {
    const redis = getRedis()
    if (redis) {
      await redis.del(`${DASHBOARD_CACHE_PREFIX}${tenantId}`)
    }
  } catch (e) {
    // Non-critical
  }
}

// ==========================================
// Mutation: Update Data Website
// ==========================================
export async function updateWebsiteData(tenantId: string, data: Record<string, any>, userId: string, isSuperAdmin: boolean) {
  // Cek izin — hanya owner/admin
  if (!isSuperAdmin) {
    const tu = await db.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
    })
    if (!tu || !["owner", "admin"].includes(tu.role)) {
      throw new Error("Tidak punya izin")
    }
  }

  const updated = await db.tenant.update({
    where: { id: tenantId },
    data,
  })

  if (data.settings) {
    const settings = data.settings as Record<string, any>
    if (settings.studentCount !== undefined) {
      try {
        await db.tenantApplication.update({
          where: { businessSlug: updated.slug },
          data: { studentCount: Number(settings.studentCount) }
        })
      } catch (error) {
        console.error("[website service] Gagal sync studentCount ke application:", error)
      }
    }
  }

  // Invalidate Redis cache so public site reflects changes immediately
  await invalidatePublicTenantCache(updated.slug)
  await invalidateDashboardCache(tenantId)
  try {
    const { revalidatePath } = await import("next/cache")
    revalidatePath("/", "layout");
    if (updated?.slug) await clearTenantCache(updated.slug);
  } catch (e) {
    console.error("Failed to revalidate path", e)
  }

  return updated
}

// ==========================================
// Query: Tenant Settings
// ==========================================
export async function getTenantSettings(tenantId: string, userId: string, isSuperAdmin: boolean) {
  if (!isSuperAdmin) {
    const tu = await db.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
    })
    if (!tu || !["owner", "admin"].includes(tu.role)) {
      throw new Error("Tidak punya izin")
    }
  }

  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true },
  })

  return (tenant?.settings as Record<string, any>) || {}
}

// ==========================================
// Mutation: Update Tenant Settings (Merge)
// ==========================================
export async function updateTenantSettings(tenantId: string, settings: Record<string, any>, userId: string, isSuperAdmin: boolean) {
  if (!isSuperAdmin) {
    const tu = await db.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
    })
    if (!tu || !["owner", "admin"].includes(tu.role)) {
      throw new Error("Tidak punya izin")
    }
  }

  const existing = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true },
  })
  const existingSettings = (existing?.settings as Record<string, any>) || {}
  const merged = { ...existingSettings, ...settings }

  const updated = await db.tenant.update({
    where: { id: tenantId },
    data: { settings: merged },
    select: { slug: true }
  })

  await invalidatePublicTenantCache(updated.slug)
  await invalidateDashboardCache(tenantId)
  try {
    const { revalidatePath } = await import("next/cache")
    revalidatePath("/", "layout");
    if (updated?.slug) await clearTenantCache(updated.slug);
  } catch (e) {
    console.error("Failed to revalidate path", e)
  }

  return { message: "Pengaturan disimpan" }
}

// ==========================================
// Mutation: Ganti Subdomain (1x Only)
// ==========================================
export async function changeSubdomain(tenantId: string, newSlug: string, userId: string, isSuperAdmin: boolean) {
  const tu = await db.tenantUser.findUnique({
    where: { tenantId_userId: { tenantId, userId } },
  })
  
  if (!isSuperAdmin && (!tu || !["owner", "admin"].includes(tu.role))) {
    throw new Error("Tidak punya izin")
  }

  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { slug: true, settings: true },
  })
  
  if (!tenant) throw new Error("Tenant tidak ditemukan")

  const settings = (tenant.settings as Record<string, any>) || {}
  
  if (settings.hasChangedSubdomain) {
    throw new Error("Anda sudah pernah mengganti subdomain. Penggantian hanya diperbolehkan 1 kali.")
  }

  if (tenant.slug === newSlug) {
    throw new Error("Subdomain baru harus berbeda dengan yang lama.")
  }

  const reservedSlugs = ["admin", "superadmin", "api", "auth", "static", "assets", "dashboard", "site", "schoolpro"]
  if (reservedSlugs.includes(newSlug)) {
    throw new Error("Subdomain ini tidak dapat digunakan.")
  }

  const existing = await db.tenant.findUnique({ where: { slug: newSlug } })
  if (existing) {
    throw new Error("Subdomain sudah digunakan oleh sekolah lain. Silakan pilih yang berbeda.")
  }

  await db.tenant.update({
    where: { id: tenantId },
    data: {
      slug: newSlug,
      settings: {
        ...settings,
        hasChangedSubdomain: true
      }
    }
  })

  if (tenant.slug) {
    await invalidatePublicTenantCache(tenant.slug)
  }
  await invalidatePublicTenantCache(newSlug)
  try {
    const { revalidatePath } = await import("next/cache")
    revalidatePath("/", "layout");
    if (tenant?.slug) await clearTenantCache(tenant.slug);
    await clearTenantCache(newSlug);
  } catch (e) {
    console.error("Failed to revalidate path", e)
  }

  return { message: "Subdomain berhasil diubah" }
}

