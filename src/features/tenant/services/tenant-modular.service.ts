import { db } from "@/lib/db"
import { unstable_cache } from "next/cache"
import { revalidateTag } from "next/cache"

const CACHE_TTL_SECONDS = 60 * 60 // 1 hour

export async function clearTenantCache(slug: string) {
  try {
    revalidateTag(`tenant-${slug}`)
  } catch (error) {
    console.error(`Error in clearTenantCache`, String(error))
  }
}

export const getTenantLayoutData = async (slug: string) => {
  return unstable_cache(
    async () => {
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
    },
    [`tenant-layout-${slug}`],
    { tags: [`tenant-${slug}`], revalidate: CACHE_TTL_SECONDS }
  )()
}

export const getTenantHomeData = async (slug: string) => {
  return unstable_cache(
    async () => {
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
    },
    [`tenant-home-${slug}`],
    { tags: [`tenant-${slug}`], revalidate: CACHE_TTL_SECONDS }
  )()
}

export const getTenantAlumni = async (slug: string) => {
  return unstable_cache(
    async () => {
      return db.tenant.findUnique({
        where: { slug },
        select: {
          id: true,
          alumni: { orderBy: [{ sortOrder: 'asc' }, { graduationYear: 'desc' }] },
        }
      })
    },
    [`tenant-alumni-${slug}`],
    { tags: [`tenant-${slug}`], revalidate: CACHE_TTL_SECONDS }
  )()
}

export const getTenantStaff = async (slug: string) => {
  return unstable_cache(
    async () => {
      return db.tenant.findUnique({
        where: { slug },
        select: {
          id: true,
          staff: { orderBy: { sortOrder: 'asc' } },
        }
      })
    },
    [`tenant-staff-${slug}`],
    { tags: [`tenant-${slug}`], revalidate: CACHE_TTL_SECONDS }
  )()
}

export const getTenantPrograms = async (slug: string) => {
  return unstable_cache(
    async () => {
      return db.tenant.findUnique({
        where: { slug },
        select: {
          id: true,
          programs: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] },
        }
      })
    },
    [`tenant-programs-${slug}`],
    { tags: [`tenant-${slug}`], revalidate: CACHE_TTL_SECONDS }
  )()
}

export const getTenantFacilities = async (slug: string) => {
  return unstable_cache(
    async () => {
      return db.tenant.findUnique({
        where: { slug },
        select: {
          id: true,
          facilities: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] },
        }
      })
    },
    [`tenant-facilities-${slug}`],
    { tags: [`tenant-${slug}`], revalidate: CACHE_TTL_SECONDS }
  )()
}

export const getTenantExtracurriculars = async (slug: string) => {
  return unstable_cache(
    async () => {
      return db.tenant.findUnique({
        where: { slug },
        select: {
          id: true,
          extracurriculars: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] },
        }
      })
    },
    [`tenant-extracurriculars-${slug}`],
    { tags: [`tenant-${slug}`], revalidate: CACHE_TTL_SECONDS }
  )()
}

export const getTenantAchievements = async (slug: string) => {
  return unstable_cache(
    async () => {
      return db.tenant.findUnique({
        where: { slug },
        select: {
          id: true,
          achievements: { orderBy: [{ order: 'asc' }, { date: 'desc' }] },
        }
      })
    },
    [`tenant-achievements-${slug}`],
    { tags: [`tenant-${slug}`], revalidate: CACHE_TTL_SECONDS }
  )()
}

export const getTenantGallery = async (slug: string) => {
  return unstable_cache(
    async () => {
      return db.tenant.findUnique({
        where: { slug },
        select: {
          id: true,
          gallery: true,
        }
      })
    },
    [`tenant-gallery-${slug}`],
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
            where: { status: "PUBLISHED", type: { notIn: ["PENGUMUMAN_GTK", "PENGUMUMAN_ORTU", "PENGUMUMAN_SISWA"] } }, 
            orderBy: { createdAt: 'desc' },
            include: { author: { select: { name: true, avatar: true } } }
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
            select: { staff: true, alumni: true, programs: true, extracurriculars: true }
          }
        }
      })
    },
    [`tenant-profile-${slug}`],
    { tags: [`tenant-${slug}`], revalidate: CACHE_TTL_SECONDS }
  )()
}
