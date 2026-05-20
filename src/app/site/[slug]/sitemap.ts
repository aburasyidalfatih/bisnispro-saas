import { MetadataRoute } from "next"
import { getPublicTenantBySlug } from "@/features/tenant/services/tenant-public.service"
import { getPublicBasePath } from "@/lib/utils/public-path"
import { headers } from "next/headers"

export const revalidate = 3600 // Edge Caching ISR (1 jam)

export default async function sitemap({ params }: { params: Promise<{ slug: string }> }): Promise<MetadataRoute.Sitemap> {
  const { slug } = await params
  
  // Get tenant data
  const tenant = await getPublicTenantBySlug(slug)
  if (!tenant) return []

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

  // Dynamic routes: Berita
  if (tenant.posts) {
    tenant.posts.forEach((post: any) => {
      routes.push({
        url: `${baseUrl}/berita/${post.id}`,
        lastModified: post.updatedAt || post.createdAt,
        changeFrequency: "weekly",
        priority: 0.7,
      })
    })
  }

  // Dynamic routes: Prestasi
  if (tenant.achievements) {
    tenant.achievements.forEach((achievement: any) => {
      routes.push({
        url: `${baseUrl}/prestasi/${achievement.id}`,
        lastModified: new Date(),
        changeFrequency: "yearly",
        priority: 0.6,
      })
    })
  }

  // Dynamic routes: Program
  if (tenant.programs) {
    tenant.programs.forEach((program: any) => {
      routes.push({
        url: `${baseUrl}/program/${program.id}`,
        lastModified: new Date(),
        changeFrequency: "yearly",
        priority: 0.6,
      })
    })
  }

  return routes
}
