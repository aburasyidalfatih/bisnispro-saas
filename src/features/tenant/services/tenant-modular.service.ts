import { db } from "@/lib/db"
import { unstable_cache } from "next/cache"
import { revalidateTag } from "next/cache"
import { normalizeWebsiteMenuTree } from "@/features/website-menu/menu-tree"

const CACHE_TTL_SECONDS = 60 * 60 // 1 hour

function normalizeInactiveCustomTheme<T extends { customThemeId: string | null; customTheme: any; template?: string }>(tenant: T | null): T | null {
  if (!tenant) return null
  if (tenant.customThemeId && (!tenant.customTheme || tenant.customTheme.isActive === false)) {
    return {
      ...tenant,
      customThemeId: null,
      customTheme: null,
      template: tenant.template === "custom" ? "default" : tenant.template,
    }
  }
  return tenant
}

export async function clearTenantCache(slug: string, tag?: string) {
  try {
    // @ts-ignore
    revalidateTag(`tenant-${slug}`)
    if (tag) {
      // @ts-ignore
      revalidateTag(tag)
    }
  } catch (error) {
    console.error(`Error in clearTenantCache`, String(error))
  }
}

export const getTenantLayoutData = async (slug: string) => {
  return unstable_cache(
    async () => {
      const tenantLayout = await db.tenant.findUnique({
        where: { slug },
        select: {
          id: true,
          name: true,
          slug: true,
          domain: true,
          logo: true,
          plan: true,
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
          retentionStatus: true,
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

      return normalizeInactiveCustomTheme(tenantLayout ? {
        ...tenantLayout,
        websiteMenus: normalizeWebsiteMenuTree(tenantLayout.websiteMenus),
      } : null)
    },
    [`tenant-layout-${slug}`],
    { tags: [`tenant-${slug}`], revalidate: CACHE_TTL_SECONDS }
  )()
}

export const getTenantHomeData = async (slug: string) => {
  return unstable_cache(
    async () => {
      try {
        const tenantHome = await db.tenant.findUnique({
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
          },
        })
        return normalizeInactiveCustomTheme(tenantHome)
      } catch (error) {
        return null
      }
    },
    [`tenant-home-${slug}`],
    { tags: [`tenant-${slug}`], revalidate: CACHE_TTL_SECONDS }
  )()
}

export const getTenantPosts = async (slug: string) => {
  return unstable_cache(
    async () => {
      return db.tenant.findUnique({
        where: { slug },
        select: {
          id: true,
          posts: { 
            where: { status: "PUBLISHED" }, 
            orderBy: { createdAt: 'desc' },
            include: { 
              author: { 
                select: { 
                  name: true, 
                  avatar: true, 
                  bio: true,
                  id: true
                }
              }, 
              category: true 
            }
          },
        }
      })
    },
    [`tenant-posts-${slug}`],
    { tags: [`tenant-${slug}`], revalidate: CACHE_TTL_SECONDS }
  )()
}

export const getTenantProfileData = async (slug: string) => {
  return unstable_cache(
    async () => {
      return db.tenant.findUnique({
        where: { slug },
        select: {
          id: true,
          slug: true,
          name: true,
          about: true,
          createdAt: true,
          _count: {
            select: { }
          }
        }
      })
    },
    [`tenant-profile-${slug}`],
    { tags: [`tenant-${slug}`], revalidate: CACHE_TTL_SECONDS }
  )()
}




