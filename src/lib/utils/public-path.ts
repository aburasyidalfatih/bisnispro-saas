import { headers } from "next/headers"

/**
 * Menentukan base path yang benar untuk link di website tenant.
 * 
 * - Jika diakses via subdomain (demo.schoolpro.my.id) → base = ""
 *   sehingga link jadi "/agenda", "/berita", dll.
 * - Jika diakses via custom domain (sekolahanda.com) → base = ""
 * - Jika diakses via main domain path (schoolpro.id/site/demo) → base = "/site/demo"
 */
export async function getPublicBasePath(slug: string): Promise<string> {
  const headerList = await headers()
  const hostname = headerList.get("x-hostname") || headerList.get("host") || ""
  const rootDomain = headerList.get("x-root-domain") || process.env.NEXT_PUBLIC_ROOT_DOMAIN || "schoolpro.id"

  const cleanHostname = hostname.split(":")[0]
  const isMainDomain =
    cleanHostname === rootDomain ||
    cleanHostname === `www.${rootDomain}` ||
    cleanHostname === "localhost" ||
    cleanHostname.startsWith("localhost") ||
    cleanHostname === "127.0.0.1"

  const isSubdomain = cleanHostname.endsWith(`.${rootDomain}`) && !isMainDomain
  const isCustomDomain = !isMainDomain && !isSubdomain

  // Jika akses via subdomain atau custom domain, middleware sudah handle rewrite
  // URL browser user tetap clean tanpa prefix /site/slug
  if (isSubdomain || isCustomDomain) {
    return ""
  }

  // Jika akses via main domain direct path, perlu prefix
  return `/site/${slug}`
}
