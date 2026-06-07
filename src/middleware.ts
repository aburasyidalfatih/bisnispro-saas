/**
 * Next.js Multi-Tenant Middleware
 * Menangani routing untuk:
 * 1. Main domain (schoolpro.id / schoolpro.my.id)
 * 2. Subdomain (tenant.schoolpro.id)
 * 3. Custom domain (sekolahanda.com)
 */

import NextAuth from "next-auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { authConfig } from "@/lib/auth.config"
import { edgeRateLimit, tenantRateLimit } from "@/lib/edge-rate-limit"
import { Redis } from "@upstash/redis"

const { auth } = NextAuth(authConfig)

const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || ""

const redis = process.env.UPSTASH_REDIS_REST_URL ? Redis.fromEnv() : null

/**
 * Resolve custom domain via internal API with Edge Redis Cache
 */
async function resolveCustomDomain(domain: string, requestUrl: string): Promise<string | null> {
  try {
    if (redis) {
      const cached = await redis.get(`domain:${domain}`)
      if (cached) return cached as string
    }

    // Edge-Safe: Fetch from local Node.js API instead of importing database TCP Sockets directly
    const port = process.env.PORT || "3000"
    const res = await fetch(
      `http://127.0.0.1:${port}/api/internal/domain-lookup?domain=${encodeURIComponent(domain)}`,
      {
        headers: {
          "x-internal-secret": INTERNAL_SECRET,
        },
      }
    )

    if (!res.ok) return null
    const data = await res.json()
    const slug = data.slug

    if (redis && slug) {
      await redis.set(`domain:${domain}`, slug, { ex: 300 })
    }

    return slug
  } catch {
    return null
  }
}

/**
 * Resolve tenant slug via internal API with Edge Redis Cache
 */
async function getCustomDomainForSlug(slug: string, requestUrl: string): Promise<string | null> {
  try {
    if (redis) {
      const cached = await redis.get(`smp:slug-domain:${slug}`)
      if (cached) return cached as string
    }

    const port = process.env.PORT || "3000"
    const res = await fetch(
      `http://127.0.0.1:${port}/api/internal/slug-lookup?slug=${encodeURIComponent(slug)}`,
      {
        headers: {
          "x-internal-secret": INTERNAL_SECRET,
        },
      }
    )

    if (!res.ok) return null
    const data = await res.json()
    const domain = data.domain

    if (redis && domain) {
      await redis.set(`smp:slug-domain:${slug}`, domain, { ex: 300 })
    }

    return domain
  } catch {
    return null
  }
}

function addSecurityHeaders(response: NextResponse, routeType: "public" | "protected" | "static" = "public"): NextResponse {
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(self), microphone=(), geolocation=(self)")
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' ws: wss: https://cloudflareinsights.com https://static.cloudflareinsights.com; frame-src 'self' https://challenges.cloudflare.com https://www.openstreetmap.org https://maps.google.com https://www.google.com https://www.youtube.com https://youtube.com https://youtu.be; frame-ancestors 'none'"
  )

  // Aggressive SEO Indexing Header & Edge Caching for public pages
  if (routeType === "public") {
    response.headers.set("X-Robots-Tag", "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1")
    // Enable CDN Edge Caching: Cache at edge for 60 seconds, serve stale while revalidating for up to 5 minutes
    // Removed aggressive caching to allow instant updates. Redis handles performance.
    response.headers.set("Cache-Control", "public, max-age=0, must-revalidate")
  } else if (routeType === "protected" || routeType === "static") {
    response.headers.set("X-Robots-Tag", "noindex, nofollow")
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
  }

  return response
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Lewati aset statis secara manual (Security Layer 2)
  // LAKUKAN INI SEBELUM RATE LIMITING untuk menghindari pengurasan kuota Redis!
  if (
    pathname.startsWith("/_next") || 
    pathname.startsWith("/static") || 
    pathname.includes(".") && !pathname.startsWith("/api")
  ) {
    return addSecurityHeaders(NextResponse.next(), "static")
  }

  // Gunakan X-Forwarded-Host dari Nginx jika ada, jika tidak gunakan host bawaan
  let hostname = request.headers.get("x-forwarded-host") || request.headers.get("host") || ""
  
  // Hapus port jika ada untuk memastikan deteksi domain akurat di mode development
  hostname = hostname.split(':')[0]

  const ip = request.headers.get("x-forwarded-for") || (request as any).ip || "127.0.0.1"

  // ==========================================
  // PERSISTENT IP BAN CHECK
  // ==========================================
  if (redis) {
    try {
      const isBanned = await redis.get(`banned_ip:${ip}`)
      if (isBanned) {
        return new NextResponse("Your IP has been permanently banned for violating our security policies.", { status: 403 })
      }
    } catch (e) {
      // Ignore redis errors to prevent taking down the site if redis fails
    }
  }

  // ==========================================
  // DDoS PROTECTION (EDGE RATE LIMIT)
  // ==========================================
  const { success } = await edgeRateLimit.limit(ip)
  if (!success) {
    return new NextResponse("Too Many Requests. Enterprise DDoS Protection active.", { status: 429 })
  }

  // ==========================================
  // WEB APPLICATION FIREWALL (WAF) & IDS
  // ==========================================
  const urlParams = request.nextUrl.searchParams.toString().toLowerCase()
  const decodedPath = decodeURIComponent(pathname).toLowerCase()
  const payloadString = `${decodedPath}?${urlParams}`

  const sqliPattern = /(\b(union|select|insert|update|delete|drop|alter|truncate)\b)|(--\s)|(\b(or|and)\b\s+\d+=\d+)|(%27)|(\bexec\b)/i
  const xssPattern = /(<script>)|(javascript:)|(onerror=)|(onload=)|(<iframe)/i
  const lfiPattern = /(\.\.\/)|(\.\.\\)/i

  let attackType = null
  if (sqliPattern.test(payloadString)) attackType = "SQLi"
  else if (xssPattern.test(payloadString)) attackType = "XSS"
  else if (lfiPattern.test(payloadString)) attackType = "LFI/Path Traversal"

  if (attackType) {
    const port = process.env.PORT || "3000"
    const userAgent = request.headers.get("user-agent") || ""
    fetch(`http://127.0.0.1:${port}/api/internal/security-alert`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": INTERNAL_SECRET,
      },
      body: JSON.stringify({
        ipAddress: ip,
        path: request.nextUrl.pathname,
        payload: payloadString,
        attackType,
        userAgent,
      })
    }).catch(() => {})

    return new NextResponse(`WAF Blocked: Malicious payload detected (${attackType})`, { status: 403 })
  }
  
  let rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "schoolpro.id"
  if (hostname.endsWith("schoolpro.my.id") || hostname === "schoolpro.my.id") {
    rootDomain = "schoolpro.my.id"
  } else if (hostname.endsWith("schoolpro.id") || hostname === "schoolpro.id") {
    rootDomain = "schoolpro.id"
  }

  // 2. Bypass middleware completely for internal APIs to prevent infinite loops
  if (pathname.startsWith("/api/internal/")) {
    return NextResponse.next()
  }

  // Validasi Session
  const session = await auth()

  // KLASIFIKASI HOST
  const isMainDomain =
    hostname === rootDomain ||
    hostname === `www.${rootDomain}` ||
    hostname === "localhost" ||
    hostname.startsWith("localhost:") ||
    hostname === "127.0.0.1"

  const subdomain = hostname.endsWith(`.${rootDomain}`)
    ? hostname.replace(`.${rootDomain}`, "")
    : ""

  const isSubdomain = !isMainDomain && subdomain !== "" && subdomain !== "www"
  const isCustomDomain = !isMainDomain && !isSubdomain

  let resolvedCustomSlug: string | null = null;
  if (isCustomDomain) {
    resolvedCustomSlug = await resolveCustomDomain(hostname, request.url);
    if (!resolvedCustomSlug) return addSecurityHeaders(NextResponse.rewrite(new URL("/not-found", request.url)));
  }

  // ============================================================
  // GLOBAL AUTHORIZATION & ROLE ISOLATION
  // ============================================================
  const isProtected = pathname.startsWith("/admin") || pathname.startsWith("/super-admin") || pathname.startsWith("/affiliate") || pathname.startsWith("/ortu") || pathname.startsWith("/panel-gtk") || pathname.startsWith("/siswa") || pathname.startsWith("/ujian")
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register")

  if (isProtected && !session) {
    return addSecurityHeaders(NextResponse.redirect(new URL("/login", request.url)))
  }

  // ROLE-BASED STRICT ISOLATION
  if (session) {
    const impersonateRole = request.cookies.get("impersonate-user-role")?.value
    const isSuperAdmin = session.user?.isSuperAdmin
    const isAffiliate = session.user?.isAffiliate
    
    // Temukan role berdasarkan tenant yang sedang diakses (untuk mencegah role collision)
    const currentSlug = isSubdomain ? subdomain : resolvedCustomSlug;
    const currentTenant = currentSlug ? session.user?.tenants?.find((t: any) => t.slug === currentSlug) : null;
    const activeRole = impersonateRole || currentTenant?.role || session.user?.tenants?.[0]?.role

    if (pathname.startsWith("/admin")) {
      if (!isSuperAdmin && !isAffiliate && activeRole !== "owner" && activeRole !== "admin") {
        if (activeRole === "guru") return addSecurityHeaders(NextResponse.redirect(new URL("/panel-gtk", request.url)))
        if (activeRole === "orangtua") return addSecurityHeaders(NextResponse.redirect(new URL("/ortu", request.url)))
        if (activeRole === "siswa") return addSecurityHeaders(NextResponse.redirect(new URL("/siswa", request.url)))
        return addSecurityHeaders(NextResponse.redirect(new URL("/login", request.url)))
      }
    }

    if (pathname.startsWith("/panel-gtk")) {
      if (!isSuperAdmin && activeRole !== "guru") {
        if (activeRole === "owner" || activeRole === "admin") return addSecurityHeaders(NextResponse.redirect(new URL("/admin", request.url)))
        if (activeRole === "orangtua") return addSecurityHeaders(NextResponse.redirect(new URL("/ortu", request.url)))
        if (activeRole === "siswa") return addSecurityHeaders(NextResponse.redirect(new URL("/siswa", request.url)))
        return addSecurityHeaders(NextResponse.redirect(new URL("/login", request.url)))
      }
    }

    if (pathname.startsWith("/ortu")) {
      if (!isSuperAdmin && activeRole !== "orangtua") {
        if (activeRole === "owner" || activeRole === "admin") return addSecurityHeaders(NextResponse.redirect(new URL("/admin", request.url)))
        if (activeRole === "guru") return addSecurityHeaders(NextResponse.redirect(new URL("/panel-gtk", request.url)))
        if (activeRole === "siswa") return addSecurityHeaders(NextResponse.redirect(new URL("/siswa", request.url)))
        return addSecurityHeaders(NextResponse.redirect(new URL("/login", request.url)))
      }
    }

    if (pathname.startsWith("/siswa")) {
      if (!isSuperAdmin && activeRole !== "siswa") {
        if (activeRole === "owner" || activeRole === "admin") return addSecurityHeaders(NextResponse.redirect(new URL("/admin", request.url)))
        if (activeRole === "guru") return addSecurityHeaders(NextResponse.redirect(new URL("/panel-gtk", request.url)))
        if (activeRole === "orangtua") return addSecurityHeaders(NextResponse.redirect(new URL("/ortu", request.url)))
        return addSecurityHeaders(NextResponse.redirect(new URL("/login", request.url)))
      }
    }

    if (pathname.startsWith("/super-admin") && !isSuperAdmin) {
      const fallback = isAffiliate && (!session.user?.tenants || session.user?.tenants.length === 0) ? "/affiliate" : "/admin"
      return addSecurityHeaders(NextResponse.redirect(new URL(fallback, request.url)))
    }

    if (pathname.startsWith("/affiliate") && !isAffiliate) {
      return addSecurityHeaders(NextResponse.redirect(new URL(isSuperAdmin ? "/super-admin" : "/admin", request.url)))
    }

    if (pathname.startsWith("/admin") && isAffiliate && (!session.user?.tenants || session.user?.tenants.length === 0)) {
      return addSecurityHeaders(NextResponse.redirect(new URL("/affiliate", request.url)))
    }

    if (isAuthPage) {
      // Prioritize school roles if they are on a school domain
      if (isSubdomain || isCustomDomain) {
        if (activeRole === "guru") return addSecurityHeaders(NextResponse.redirect(new URL("/panel-gtk", request.url)))
        if (activeRole === "orangtua") return addSecurityHeaders(NextResponse.redirect(new URL("/ortu", request.url)))
        if (activeRole === "siswa") return addSecurityHeaders(NextResponse.redirect(new URL("/siswa", request.url)))
        if (activeRole === "owner" || activeRole === "admin") return addSecurityHeaders(NextResponse.redirect(new URL("/admin", request.url)))
      }

      if (isSuperAdmin) {
        return addSecurityHeaders(NextResponse.redirect(new URL("/super-admin", request.url)))
      } else if (isAffiliate && (!session.user?.tenants || session.user?.tenants.length === 0 || isMainDomain)) {
        return addSecurityHeaders(NextResponse.redirect(new URL("/affiliate", request.url)))
      } else if (activeRole === "guru") {
        return addSecurityHeaders(NextResponse.redirect(new URL("/panel-gtk", request.url)))
      } else if (activeRole === "orangtua") {
        return addSecurityHeaders(NextResponse.redirect(new URL("/ortu", request.url)))
      } else if (activeRole === "siswa") {
        return addSecurityHeaders(NextResponse.redirect(new URL("/siswa", request.url)))
      } else {
        return addSecurityHeaders(NextResponse.redirect(new URL("/admin", request.url)))
      }
    }
  }

  // ============================================================
  // A. MAIN DOMAIN
  // ============================================================
  if (isMainDomain) {
    // REDIRECT: Cegah akses langsung ke route internal /site/[slug] demi SEO
    if (pathname.startsWith("/site/")) {
      const parts = pathname.split("/")
      if (parts.length > 2 && parts[2]) {
        const slug = parts[2]
        const restPath = parts.slice(3).join("/")
        const redirectUrl = `https://${slug}.${rootDomain}/${restPath}${request.nextUrl.search}`
        return addSecurityHeaders(NextResponse.redirect(redirectUrl, 301))
      }
    }

    // Cek Affiliate Shortlink (contoh: /bdi123, /ref-abc, /mitra123)
    // Hindari rute sistem yang valid
    const systemRoutes = ["/admin", "/super-admin", "/affiliate", "/login", "/register", "/forgot-password", "/reset-password", "/daftarkan-sekolah", "/api", "/invoice", "/mitra-afiliasi", "/privacy-policy", "/siswa", "/ujian"]
    const isSystemRoute = systemRoutes.some(r => pathname.startsWith(r))
    
    // Tangkap path apa saja yang bukan system route dan panjangnya antara 5-15 karakter alfanumerik (atau hyphen)
    if (!isSystemRoute && pathname.match(/^\/[a-zA-Z0-9-]{5,15}$/)) {
      const code = pathname.substring(1).toLowerCase()
      const redirectUrl = new URL("/", request.url)
      redirectUrl.searchParams.set("ref", code)
      const res = addSecurityHeaders(NextResponse.redirect(redirectUrl))
      return res
    }

    return addSecurityHeaders(NextResponse.next(), "public")
  }

  // ============================================================
  // B. SUBDOMAIN
  // ============================================================
  if (isSubdomain) {
    // Cek apakah subdomain memiliki custom domain
    const customDomain = await getCustomDomainForSlug(subdomain, request.url)
    if (customDomain) {
      const redirectUrl = `https://${customDomain}${pathname}${request.nextUrl.search}`
      return addSecurityHeaders(NextResponse.redirect(redirectUrl, 301))
    }

    // Per-Tenant Rate Limiting (Task 3.4)
    const { success: tenantSuccess } = await tenantRateLimit.limit(`rl:tenant:${subdomain}`)
    if (!tenantSuccess) {
      return new NextResponse("Too Many Requests for this Tenant. Rate Limit exceeded.", { status: 429 })
    }

    // Jangan rewrite rute Dashboard/Login di subdomain
    if (
      pathname.startsWith("/admin") ||
      pathname.startsWith("/ortu") ||
      pathname.startsWith("/login") ||
      pathname.startsWith("/register") ||
      pathname.startsWith("/forgot-password") ||
      pathname.startsWith("/reset-password") ||
      pathname.startsWith("/invite") ||
      pathname.startsWith("/api") ||
      pathname.startsWith("/invoice") ||
      pathname.startsWith("/panel-gtk") ||
      pathname.startsWith("/siswa") ||
      pathname.startsWith("/ujian") ||
      pathname.startsWith("/affiliate") ||
      pathname.startsWith("/super-admin")
    ) {
      const response = NextResponse.next()
      response.headers.set("x-tenant-slug", subdomain)
      return addSecurityHeaders(response, "protected")
    }

    // Rewrite ke website sekolah
    const url = request.nextUrl.clone()
    url.pathname = `/site/${subdomain}${pathname}`
    const response = NextResponse.rewrite(url)
    response.headers.set("x-tenant-slug", subdomain)
    response.headers.set("x-hostname", hostname)
    response.headers.set("x-root-domain", rootDomain)
    return addSecurityHeaders(response, "public")
  }

  // ============================================================
  // C. CUSTOM DOMAIN
  // ============================================================
  if (isCustomDomain && resolvedCustomSlug) {
    const slug = resolvedCustomSlug;

    // Per-Tenant Rate Limiting (Task 3.4)
    const { success: tenantSuccess } = await tenantRateLimit.limit(`rl:tenant:${slug}`)
    if (!tenantSuccess) {
      return new NextResponse("Too Many Requests for this Tenant. Rate Limit exceeded.", { status: 429 })
    }

    if (
      pathname.startsWith("/admin") ||
      pathname.startsWith("/ortu") ||
      pathname.startsWith("/login") ||
      pathname.startsWith("/register") ||
      pathname.startsWith("/forgot-password") ||
      pathname.startsWith("/reset-password") ||
      pathname.startsWith("/invite") ||
      pathname.startsWith("/api") ||
      pathname.startsWith("/invoice") ||
      pathname.startsWith("/panel-gtk") ||
      pathname.startsWith("/siswa") ||
      pathname.startsWith("/ujian") ||
      pathname.startsWith("/affiliate") ||
      pathname.startsWith("/super-admin")
    ) {
      const response = NextResponse.next()
      response.headers.set("x-tenant-slug", slug)
      response.headers.set("x-custom-domain", hostname)
      response.headers.set("x-hostname", hostname)
      response.headers.set("x-root-domain", rootDomain)
      return addSecurityHeaders(response, "protected")
    }

    const url = request.nextUrl.clone()
    url.pathname = `/site/${slug}${pathname}`
    const response = NextResponse.rewrite(url)
    response.headers.set("x-tenant-slug", slug)
    response.headers.set("x-custom-domain", hostname)
    response.headers.set("x-hostname", hostname)
    response.headers.set("x-root-domain", rootDomain)
    return addSecurityHeaders(response, "public")
  }

  const response = NextResponse.next()
  response.headers.set("x-hostname", hostname)
  response.headers.set("x-root-domain", rootDomain)
  return addSecurityHeaders(response, "public")
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * 1. /api (API routes)
     * 2. /_next (Next.js internals)
     * 3. /static (inside /public)
     * 4. all root files (favicon.ico, sitemap.xml, robots.txt, etc.)
     */
    "/((?!api|_next|static|[\\w-]+\\.\\w+).*)",
  ],
}
