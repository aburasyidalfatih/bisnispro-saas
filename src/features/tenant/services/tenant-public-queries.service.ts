import { db } from "@/lib/db"
import { unstable_cache } from "next/cache"

export const getPublicPosts = async (tenantId: string, page: number, perPage: number, whereClause: any) => {
  return unstable_cache(
    async () => {
      // FORCE tenantId injection to prevent cross-tenant leakage
      // Read-time Evaluation: Show PUBLISHED or (SCHEDULED and past publishedAt)
      const isStatusExplicit = whereClause.status !== undefined
      let safeWhere = { ...whereClause, tenantId }
      
      if (!isStatusExplicit || safeWhere.status === "PUBLISHED") {
        delete safeWhere.status
        safeWhere = {
          ...safeWhere,
          OR: [
            { status: "PUBLISHED" },
            { status: "SCHEDULED", publishedAt: { lte: new Date() } }
          ]
        }
      }

      return db.post.findMany({
        where: safeWhere,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          category: true,
          author: { select: { name: true, avatar: true } }
        }
      })
    },
    ['public-posts', tenantId, String(page), String(perPage), JSON.stringify(whereClause)],
    { tags: [`tenant-${tenantId}`] }
  )()
}

export const countPublicPosts = async (tenantId: string, whereClause: any) => {
  return unstable_cache(
    async () => {
      // FORCE tenantId injection
      const isStatusExplicit = whereClause.status !== undefined
      let safeWhere = { ...whereClause, tenantId }
      
      if (!isStatusExplicit || safeWhere.status === "PUBLISHED") {
        delete safeWhere.status
        safeWhere = {
          ...safeWhere,
          OR: [
            { status: "PUBLISHED" },
            { status: "SCHEDULED", publishedAt: { lte: new Date() } }
          ]
        }
      }
      return db.post.count({ where: safeWhere })
    },
    ['public-posts-count', tenantId, JSON.stringify(whereClause)],
    { tags: [`tenant-${tenantId}`] }
  )()
}

export const getPublicActiveCategories = async (tenantId: string, excludedTypes: string[]) => {
  return unstable_cache(
    async () => {
      return db.category.findMany({
        where: {
          tenantId,
          posts: {
            some: {
              OR: [
                { status: 'PUBLISHED' },
                { status: 'SCHEDULED', publishedAt: { lte: new Date() } }
              ],
              type: { notIn: excludedTypes }
            }
          }
        },
        select: { id: true, name: true, slug: true },
        orderBy: { name: 'asc' }
      })
    },
    ['public-active-categories', tenantId, JSON.stringify(excludedTypes)],
    { tags: [`tenant-${tenantId}`] }
  )()
}

export const getPublicEvents = async (tenantId: string) => {
  return unstable_cache(
    async () => {
      return db.event.findMany({
        where: { tenantId },
        orderBy: { startDate: 'desc' }
      })
    },
    ['public-events', tenantId],
    { tags: [`tenant-${tenantId}`] }
  )()
}

export const getPublicDocuments = async (tenantId: string) => {
  return unstable_cache(
    async () => {
      return db.document.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' }
      })
    },
    ['public-documents', tenantId],
    { tags: [`tenant-${tenantId}`] }
  )()
}

export const getPublicSitemapData = async (tenantId: string) => {
  return unstable_cache(
    async () => {
      const [posts, achievements, programs, facilities, extracurriculars, events] = await Promise.all([
        db.post.findMany({
          where: { 
            tenantId, 
            OR: [
              { status: "PUBLISHED" },
              { status: "SCHEDULED", publishedAt: { lte: new Date() } }
            ]
          },
          select: { id: true, slug: true, type: true, updatedAt: true, createdAt: true }
        }),
        db.achievement.findMany({
          where: { tenantId },
          select: { id: true, slug: true, updatedAt: true, createdAt: true }
        }),
        db.program.findMany({
          where: { tenantId },
          select: { id: true, slug: true, updatedAt: true, createdAt: true }
        }),
        db.facility.findMany({
          where: { tenantId },
          select: { id: true, slug: true, updatedAt: true, createdAt: true }
        }),
        db.extracurricular.findMany({
          where: { tenantId },
          select: { id: true, slug: true, updatedAt: true, createdAt: true }
        }),
        db.event.findMany({
          where: { tenantId },
          select: { id: true, slug: true, updatedAt: true, createdAt: true }
        })
      ]);

      return { posts, achievements, programs, facilities, extracurriculars, events };
    },
    ['public-sitemap-data', tenantId],
    { tags: [`tenant-${tenantId}`] }
  )()
}
