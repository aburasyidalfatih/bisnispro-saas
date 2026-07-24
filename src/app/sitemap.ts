import { MetadataRoute } from "next"
import { headers } from "next/headers"
import { db } from "@/lib/db"
import { resolveDomainToSlug } from "@/features/tenant/services/domain.service"

// export const dynamic = "force-dynamic";
export const revalidate = 3600 // Edge Caching ISR (1 jam)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headerList = await headers()
  const protocol = headerList.get("x-forwarded-proto") || "https"
  let host = headerList.get("x-forwarded-host") || headerList.get("host") || "bisnispro.id"
  host = host.split(':')[0] // remove port if any

  let rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "bisnispro.id"
  if (host.endsWith("bisnispro.my.id") || host === "bisnispro.my.id") {
    rootDomain = "bisnispro.my.id"
  } else if (host.endsWith("bisnispro.id") || host === "bisnispro.id") {
    rootDomain = "bisnispro.id"
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
        url: `${domainUrl}/daftarkan-perusahaan`,
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

  const tenant = await db.tenant.findUnique({
    where: { slug },
    select: { id: true, isActive: true }
  })
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
      url: `${domainUrl}/layanan`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${domainUrl}/artikel`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${domainUrl}/portofolio`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${domainUrl}/tim`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${domainUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
  ]

  // Dynamic routes: Berita & Pengumuman
  const posts = await db.post.findMany({
    where: { tenantId: tenant.id, status: "PUBLISHED" },
    select: { id: true, slug: true, type: true, updatedAt: true, createdAt: true },
    take: 500
  })
  if (posts.length > 0) {
    posts.forEach((post) => {
      const isPengumuman = post.type?.includes("PENGUMUMAN")
      const prefix = isPengumuman ? "pengumuman" : "artikel"
      routes.push({
        url: `${domainUrl}/${prefix}/${post.slug || post.id}`,
        lastModified: post.updatedAt || post.createdAt,
        changeFrequency: "weekly",
        priority: 0.7,
      })
    })
  }

  // Dynamic routes: Portofolio
  const portfolios = await db.portfolio.findMany({
    where: { tenantId: tenant.id },
    select: { id: true, slug: true, updatedAt: true, createdAt: true },
    take: 500
  })
  if (portfolios.length > 0) {
    portfolios.forEach((portfolio) => {
      routes.push({
        url: `${domainUrl}/portofolio/${portfolio.slug || portfolio.id}`,
        lastModified: portfolio.updatedAt || portfolio.createdAt,
        changeFrequency: "yearly",
        priority: 0.6,
      })
    })
  }

  // Dynamic routes: Layanan
  const services = await db.service.findMany({
    where: { tenantId: tenant.id },
    select: { id: true, slug: true, updatedAt: true, createdAt: true },
    take: 500
  })
  if (services.length > 0) {
    services.forEach((service) => {
      routes.push({
        url: `${domainUrl}/layanan/${service.slug || service.id}`,
        lastModified: service.updatedAt || service.createdAt,
        changeFrequency: "yearly",
        priority: 0.6,
      })
    })
  }

  // Dynamic routes: Tim
  const teamMembers = await db.teamMember.findMany({
    where: { tenantId: tenant.id },
    select: { id: true, name: true, updatedAt: true, createdAt: true },
    take: 500
  })
  if (teamMembers.length > 0) {
    teamMembers.forEach((member) => {
      const slugifiedName = member.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      routes.push({
        url: `${domainUrl}/tim/${slugifiedName}`,
        lastModified: member.updatedAt || member.createdAt,
        changeFrequency: "yearly",
        priority: 0.5,
      })
    })
  }

  return routes
}
