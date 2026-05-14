import { MetadataRoute } from "next"
import { headers } from "next/headers"
import { getPublicTenantBySlug } from "@/lib/services/tenant-public"
import { resolveDomainToSlug } from "@/lib/services/domain"

export const revalidate = 3600 // Edge Caching ISR (1 jam)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headerList = await headers()
  const protocol = headerList.get("x-forwarded-proto") || "https"
  let host = headerList.get("x-forwarded-host") || headerList.get("host") || "schoolpro.id"
  host = host.split(':')[0] // remove port if any

  let rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "schoolpro.id"
  if (host.endsWith("schoolpro.my.id") || host === "schoolpro.my.id") {
    rootDomain = "schoolpro.my.id"
  } else if (host.endsWith("schoolpro.id") || host === "schoolpro.id") {
    rootDomain = "schoolpro.id"
  }

  const isMainDomain =
    host === rootDomain ||
    host === `www.${rootDomain}` ||
    host === "localhost" ||
    host === "127.0.0.1"

  const subdomain = host.endsWith(`.${rootDomain}`)
    ? host.replace(`.${rootDomain}`, "")
    : ""

  const isSubdomain = !isMainDomain && subdomain !== "" && subdomain !== "www"
  const isCustomDomain = !isMainDomain && !isSubdomain

  const domainUrl = `${protocol}://${host}`

  // ==========================================
  // 1. MAIN DOMAIN SITEMAP
  // ==========================================
  if (isMainDomain) {
    return [
      {
        url: `${domainUrl}`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 1,
      },
      {
        url: `${domainUrl}/daftarkan-sekolah`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.8,
      },
      {
        url: `${domainUrl}/mitra-afiliasi`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.8,
      },
      {
        url: `${domainUrl}/login`,
        lastModified: new Date(),
        changeFrequency: "yearly",
        priority: 0.5,
      },
      {
        url: `${domainUrl}/register`,
        lastModified: new Date(),
        changeFrequency: "yearly",
        priority: 0.5,
      },
    ]
  }

  // ==========================================
  // 2. TENANT SITEMAP (Subdomain / Custom Domain)
  // ==========================================
  let slug = ""

  if (isSubdomain) {
    slug = subdomain
  } else if (isCustomDomain) {
    // Resolve custom domain
    try {
      const resolvedSlug = await resolveDomainToSlug(host)
      if (resolvedSlug) {
        slug = resolvedSlug
      }
    } catch (e) {
      // ignore
    }
  }

  if (!slug) return []

  const tenant = await getPublicTenantBySlug(slug)
  if (!tenant || !tenant.isActive) return []

  // Static routes for tenant
  const routes: MetadataRoute.Sitemap = [
    {
      url: `${domainUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${domainUrl}/profil`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${domainUrl}/program`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${domainUrl}/berita`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${domainUrl}/agenda`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${domainUrl}/prestasi`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${domainUrl}/fasilitas`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${domainUrl}/ekstrakurikuler`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${domainUrl}/gtk`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${domainUrl}/alumni`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${domainUrl}/gallery`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${domainUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
  ]

  // Dynamic routes: Berita & Pengumuman
  if (tenant.posts) {
    tenant.posts.forEach((post: any) => {
      routes.push({
        url: `${domainUrl}/berita/${post.slug}`,
        lastModified: post.updatedAt || post.createdAt,
        changeFrequency: "yearly",
        priority: 0.7,
      })
    })
  }

  // Dynamic routes: Prestasi
  if (tenant.achievements) {
    tenant.achievements.forEach((achievement: any) => {
      routes.push({
        url: `${domainUrl}/prestasi/${achievement.id}`,
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
        url: `${domainUrl}/program/${program.id}`,
        lastModified: new Date(),
        changeFrequency: "yearly",
        priority: 0.6,
      })
    })
  }

  return routes
}
