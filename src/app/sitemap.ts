import { MetadataRoute } from "next"
import { headers } from "next/headers"
import { db } from "@/lib/db"
import { resolveDomainToSlug } from "@/features/tenant/services/domain.service"

export const dynamic = "force-dynamic";
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
  const posts = await db.post.findMany({
    where: { tenantId: tenant.id, status: "PUBLISHED" },
    select: { id: true, slug: true, type: true, updatedAt: true, createdAt: true }
  })
  if (posts.length > 0) {
    posts.forEach((post) => {
      const isPengumuman = post.type?.includes("PENGUMUMAN")
      const prefix = isPengumuman ? "pengumuman" : "berita"
      routes.push({
        url: `${domainUrl}/${prefix}/${post.slug || post.id}`,
        lastModified: post.updatedAt || post.createdAt,
        changeFrequency: "weekly",
        priority: 0.7,
      })
    })
  }

  // Dynamic routes: Prestasi
  const achievements = await db.achievement.findMany({
    where: { tenantId: tenant.id },
    select: { id: true, slug: true, updatedAt: true, createdAt: true }
  })
  if (achievements.length > 0) {
    achievements.forEach((achievement) => {
      routes.push({
        url: `${domainUrl}/prestasi/${achievement.slug || achievement.id}`,
        lastModified: achievement.updatedAt || achievement.createdAt,
        changeFrequency: "yearly",
        priority: 0.6,
      })
    })
  }

  // Dynamic routes: Program
  const programs = await db.program.findMany({
    where: { tenantId: tenant.id },
    select: { id: true, slug: true, updatedAt: true, createdAt: true }
  })
  if (programs.length > 0) {
    programs.forEach((program) => {
      routes.push({
        url: `${domainUrl}/program/${program.slug || program.id}`,
        lastModified: program.updatedAt || program.createdAt,
        changeFrequency: "yearly",
        priority: 0.6,
      })
    })
  }

  // Dynamic routes: Agenda
  const events = await db.event.findMany({
    where: { tenantId: tenant.id },
    select: { id: true, slug: true, updatedAt: true, createdAt: true }
  })
  if (events.length > 0) {
    events.forEach((event) => {
      routes.push({
        url: `${domainUrl}/agenda/${event.slug || event.id}`,
        lastModified: event.updatedAt || event.createdAt,
        changeFrequency: "monthly",
        priority: 0.6,
      })
    })
  }

  // Dynamic routes: Fasilitas
  const facilities = await db.facility.findMany({
    where: { tenantId: tenant.id },
    select: { id: true, slug: true, updatedAt: true, createdAt: true }
  })
  if (facilities.length > 0) {
    facilities.forEach((facility) => {
      routes.push({
        url: `${domainUrl}/fasilitas/${facility.slug || facility.id}`,
        lastModified: facility.updatedAt || facility.createdAt,
        changeFrequency: "yearly",
        priority: 0.5,
      })
    })
  }

  // Dynamic routes: GTK (Staff)
  const staff = await db.staff.findMany({
    where: { tenantId: tenant.id },
    select: { id: true, name: true, updatedAt: true, createdAt: true }
  })
  if (staff.length > 0) {
    staff.forEach((s) => {
      const slugifiedName = s.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      routes.push({
        url: `${domainUrl}/gtk/${slugifiedName}`,
        lastModified: s.updatedAt || s.createdAt,
        changeFrequency: "yearly",
        priority: 0.5,
      })
    })
  }

  return routes
}
