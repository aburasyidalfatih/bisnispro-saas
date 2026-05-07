import { MetadataRoute } from "next"
import { headers } from "next/headers"

export const dynamic = "force-dynamic"

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headerList = await headers()
  const protocol = headerList.get("x-forwarded-proto") || "https"
  const host = headerList.get("x-forwarded-host") || headerList.get("host") || "schoolpro.id"
  const domainUrl = `${protocol}://${host}`

  // For multi-tenant setup, we point to the root sitemap which will be resolved to the tenant's sitemap
  // Wait, if it's accessed via a tenant custom domain (e.g. sman1.sch.id), their sitemap is at sman1.sch.id/sitemap.xml
  // But wait! Next.js requires the sitemap to be in the same route segment to automatically map it.
  // We created `app/site/[slug]/sitemap.ts`, so for a custom domain, the middleware rewrites to `/site/[slug]`.
  // Therefore, a request to `sman1.sch.id/sitemap.xml` will be rewritten to `/site/[slug]/sitemap.xml`.
  
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard/", "/super-admin/"],
    },
    sitemap: `${domainUrl}/sitemap.xml`,
  }
}
