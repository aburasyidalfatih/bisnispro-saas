import { db } from "@/lib/db"
import { getRedisClient } from "@/lib/redis"
import { cache } from "react"
import { logger } from "@/lib/logger"

const CACHE_TTL_SECONDS = 60 * 60 // 1 hour
export const TENANT_PUBLIC_CACHE_PREFIX = "smp:tenant:public:"

export const getPublicTenantBySlug = cache(async (slug: string) => {
  const cacheKey = `${TENANT_PUBLIC_CACHE_PREFIX}${slug}`
  
  try {
    const redis = await getRedisClient()
    
    // 1. Try to get from Redis
    const cached = await redis.get(cacheKey)
    if (cached) {
      // redis.get returns string if found
      return typeof cached === "string" ? JSON.parse(cached) : cached
    }
  } catch (error) {
    logger.error("Redis get error in getPublicTenantBySlug", { error: String(error) })
  }

  // 2. Fallback to DB
  const tenant = await db.tenant.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      tagline: true,
      description: true,
      about: true,
      services: true,
      heroImage: true,
      gallery: true,
      phone: true,
      whatsapp: true,
      address: true,
      email: true,
      logo: true,
      seoTitle: true,
      seoDesc: true,
      theme: true,
      isActive: true,
      instagram: true,
      facebook: true,
      youtube: true,
      staff: { orderBy: { sortOrder: 'asc' } },
      alumni: { orderBy: { graduationYear: 'desc' } },
      programs: true,
      extracurriculars: true,
      facilities: true,
      achievements: { orderBy: { createdAt: 'desc' } },
      posts: { where: { status: "PUBLISHED" }, orderBy: { createdAt: 'desc' } },
      events: { orderBy: { startDate: 'asc' } },
      documents: { orderBy: { createdAt: 'desc' } },
      sliders: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
      settings: true,
    },
  })

  // 3. Save to Redis
  if (tenant) {
    try {
      const redis = await getRedisClient()
      // Match the interface: set(key, value, exSeconds?)
      await redis.set(cacheKey, JSON.stringify(tenant), CACHE_TTL_SECONDS)
    } catch (error) {
      logger.error("Redis set error in getPublicTenantBySlug", { error: String(error) })
    }
  }

  return tenant
})

export async function invalidatePublicTenantCache(slug: string) {
  try {
    const redis = await getRedisClient()
    const cacheKey = `${TENANT_PUBLIC_CACHE_PREFIX}${slug}`
    await redis.del(cacheKey)
  } catch (error) {
    logger.error("Redis del error in invalidatePublicTenantCache", { error: String(error) })
  }
}
