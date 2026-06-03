import { db } from "@/lib/db"
import { getRedisClient } from "@/lib/redis"
import { cache } from "react"
import { logger } from "@/lib/logger"

const CACHE_TTL_SECONDS = 60 * 60 // 1 hour

export async function clearTenantCache(slug: string) {
  try {
    const redis = await getRedisClient()
    const suffixes = ['layout', 'home', 'alumni', 'staff', 'programs', 'facilities', 'extracurriculars', 'achievements', 'gallery', 'posts', 'profile']
    for (const suffix of suffixes) {
      await redis.del(`smp:tenant:${suffix}:${slug}`)
    }
  } catch (error) {
    logger.error(`Redis clear error in clearTenantCache`, { error: String(error) })
  }
}

async function getCachedTenantData<T>(slug: string, keySuffix: string, fetcher: () => Promise<T>): Promise<T | null> {
  const cacheKey = `smp:tenant:${keySuffix}:${slug}`;
  try {
    const redis = await getRedisClient()
    const cached = await redis.get(cacheKey)
    if (cached) return typeof cached === "string" ? JSON.parse(cached) : cached
  } catch (error) {
    logger.error(`Redis get error in getCachedTenantData (${keySuffix})`, { error: String(error) })
  }

  const data = await fetcher()

  if (data) {
    try {
      const redis = await getRedisClient()
      await redis.set(cacheKey, JSON.stringify(data), CACHE_TTL_SECONDS)
    } catch (error) {
      logger.error(`Redis set error in getCachedTenantData (${keySuffix})`, { error: String(error) })
    }
  }

  return data as T
}

export const getTenantLayoutData = cache(async (slug: string) => {
  return getCachedTenantData(slug, 'layout', async () => {
    return db.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        domain: true,
        logo: true,
        settings: true,
        theme: true,
        customThemeId: true,
        customTheme: true,
        whatsapp: true,
        phone: true,
        email: true,
        address: true,
        instagram: true,
        facebook: true,
        youtube: true,
        tiktok: true,
        isActive: true,
        tagline: true,
        description: true,
        seoTitle: true,
        seoDesc: true,
        heroImage: true,
        websiteMenus: { 
          where: { isActive: true, parentId: null },
          orderBy: { order: 'asc' },
          include: { children: { where: { isActive: true }, orderBy: { order: 'asc' } } }
        },
      }
    })
  })
})

export const getTenantHomeData = cache(async (slug: string) => {
  return getCachedTenantData(slug, 'home', async () => {
    return db.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        gallery: true,
        about: true,
        settings: true,
        customThemeId: true,
        customTheme: true,
        template: true,
        createdAt: true,
        _count: {
          select: { staff: true, programs: true, achievements: true }
        },
        staff: { orderBy: { sortOrder: 'asc' }, take: 100 },
        alumni: { orderBy: [{ sortOrder: 'asc' }, { graduationYear: 'desc' }], take: 15 },
        programs: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }], take: 10 },
        extracurriculars: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }], take: 15 },
        facilities: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }], take: 15 },
        achievements: { orderBy: [{ order: 'asc' }, { date: 'desc' }], take: 10 },
        posts: { 
          where: { status: "PUBLISHED", type: { notIn: ["PENGUMUMAN_GTK", "PENGUMUMAN_ORTU", "PENGUMUMAN_SISWA"] } }, 
          orderBy: { createdAt: 'desc' }, take: 20,
          include: { author: { select: { name: true, avatar: true } } }
        },
        events: { orderBy: { createdAt: 'desc' }, take: 6 },
        documents: { orderBy: { createdAt: 'desc' }, take: 10 },
        sliders: { where: { isActive: true }, orderBy: { sortOrder: 'asc' }, take: 5 },
        partnerships: { where: { isActive: true }, orderBy: { sortOrder: 'asc' }, take: 20 },
      }
    })
  })
})

export const getTenantAlumni = cache(async (slug: string) => {
  return getCachedTenantData(slug, 'alumni', async () => {
    return db.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        alumni: { orderBy: [{ sortOrder: 'asc' }, { graduationYear: 'desc' }] },
      }
    })
  })
})

export const getTenantStaff = cache(async (slug: string) => {
  return getCachedTenantData(slug, 'staff', async () => {
    return db.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        staff: { orderBy: { sortOrder: 'asc' } },
      }
    })
  })
})

export const getTenantPrograms = cache(async (slug: string) => {
  return getCachedTenantData(slug, 'programs', async () => {
    return db.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        programs: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] },
      }
    })
  })
})

export const getTenantFacilities = cache(async (slug: string) => {
  return getCachedTenantData(slug, 'facilities', async () => {
    return db.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        facilities: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] },
      }
    })
  })
})

export const getTenantExtracurriculars = cache(async (slug: string) => {
  return getCachedTenantData(slug, 'extracurriculars', async () => {
    return db.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        extracurriculars: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] },
      }
    })
  })
})

export const getTenantAchievements = cache(async (slug: string) => {
  return getCachedTenantData(slug, 'achievements', async () => {
    return db.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        achievements: { orderBy: [{ order: 'asc' }, { date: 'desc' }] },
      }
    })
  })
})

export const getTenantGallery = cache(async (slug: string) => {
  return getCachedTenantData(slug, 'gallery', async () => {
    return db.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        gallery: true,
      }
    })
  })
})

export const getTenantPosts = cache(async (slug: string) => {
  return getCachedTenantData(slug, 'posts', async () => {
    return db.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        posts: { 
          where: { status: "PUBLISHED", type: { notIn: ["PENGUMUMAN_GTK", "PENGUMUMAN_ORTU", "PENGUMUMAN_SISWA"] } }, 
          orderBy: { createdAt: 'desc' },
          include: { author: { select: { name: true, avatar: true } } }
        },
      }
    })
  })
})

export const getTenantProfileData = cache(async (slug: string) => {
  return getCachedTenantData(slug, 'profile', async () => {
    return db.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        about: true,
        createdAt: true,
        _count: {
          select: { staff: true, alumni: true, programs: true, extracurriculars: true }
        }
      }
    })
  })
})
