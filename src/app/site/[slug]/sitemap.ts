import { MetadataRoute } from "next"
import { db } from "@/lib/db"
import { getPublicSitemapData } from "@/features/tenant/services/tenant-public-queries.service"
import { headers } from "next/headers"

export const revalidate = 3600 // Edge Caching ISR (1 jam)

export default async function sitemap({ params }: { params: Promise<{ slug: string }> }): Promise<MetadataRoute.Sitemap> {
  const { slug } = await params
  
  // Get tenant data
  const tenant = await db.tenant.findUnique({
    where: { slug },
    select: { id: true, isActive: true }
  })
  if (!tenant || !tenant.isActive) return []

  // Determine base URL dynamically based on headers
  const headerList = await headers()
  const protocol = headerList.get("x-forwarded-proto") || "https"
  const host = headerList.get("x-forwarded-host") || headerList.get("host") || "schoolpro.id"
  const domainUrl = `${protocol}://${host}`
  
  // Base path logic for subdirectories (if on schoolpro.id/site/[slug])
  // Wait, if it's accessed via custom domain, the base path is just ""
  // But if accessed via schoolpro.id/site/demo, the base path is /site/demo
  const isMainDomain = host === "schoolpro.id" || host === "www.schoolpro.id" || host.startsWith("localhost")
  const basePath = isMainDomain ? `/site/${slug}` : ""

  const baseUrl = `${domainUrl}${basePath}`

  // Static routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/profil`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/program`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/berita`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/agenda`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/prestasi`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/fasilitas`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/ekstrakurikuler`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/gtk`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/alumni`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/gallery`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
  ]

  const { posts, achievements, programs, facilities, extracurriculars, events } = await getPublicSitemapData(tenant.id);

  if (posts.length > 0) {
    posts.forEach((post: any) => {
      const typePath = post.type?.includes("PENGUMUMAN") ? "pengumuman" : "berita";
      routes.push({
        url: `${baseUrl}/${typePath}/${post.slug || post.id}`,
        lastModified: post.updatedAt || post.createdAt,
        changeFrequency: "weekly",
        priority: 0.7,
      })
    })
  }

  // Dynamic routes: Prestasi
  if (achievements.length > 0) {
    achievements.forEach((achievement: any) => {
      routes.push({
        url: `${baseUrl}/prestasi/${achievement.slug || achievement.id}`,
        lastModified: achievement.updatedAt || achievement.createdAt,
        changeFrequency: "yearly",
        priority: 0.6,
      })
    })
  }

  // Dynamic routes: Program
  if (programs.length > 0) {
    programs.forEach((program: any) => {
      routes.push({
        url: `${baseUrl}/program/${program.slug || program.id}`,
        lastModified: program.updatedAt || program.createdAt,
        changeFrequency: "yearly",
        priority: 0.6,
      })
    })
  }

  // Dynamic routes: Fasilitas
  if (facilities.length > 0) {
    facilities.forEach((facility: any) => {
      routes.push({
        url: `${baseUrl}/fasilitas/${facility.slug || facility.id}`,
        lastModified: facility.updatedAt || facility.createdAt,
        changeFrequency: "yearly",
        priority: 0.5,
      })
    })
  }

  // Dynamic routes: Ekstrakurikuler
  if (extracurriculars.length > 0) {
    extracurriculars.forEach((extra: any) => {
      routes.push({
        url: `${baseUrl}/ekstrakurikuler/${extra.slug || extra.id}`,
        lastModified: extra.updatedAt || extra.createdAt,
        changeFrequency: "yearly",
        priority: 0.5,
      })
    })
  }

  // Dynamic routes: Agenda
  if (events.length > 0) {
    events.forEach((event: any) => {
      routes.push({
        url: `${baseUrl}/agenda/${event.slug || event.id}`,
        lastModified: event.updatedAt || event.createdAt,
        changeFrequency: "weekly",
        priority: 0.7,
      })
    })
  }

  return routes
}
