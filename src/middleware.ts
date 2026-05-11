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
import { edgeRateLimit } from "@/lib/edge-rate-limit"

const { auth } = NextAuth(authConfig)

const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || ""

/**
 * Resolve custom domain via internal API
 */
async function resolveCustomDomain(domain: string, requestUrl: string): Promise<string | null> {
  try {
    const base = new URL(requestUrl).origin
    const res = await fetch(
      `${base}/api/internal/domain-lookup?domain=${encodeURIComponent(domain)}`,
      {
        headers: { "x-internal-secret": INTERNAL_SECRET },
        next: { revalidate: 300 },
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.slug ?? null
  } catch {
    return null
  }
}

/**
 * Keamanan Headers & CSP
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(self), microphone=(), geolocation=(self)")
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' ws: wss: https://cloudflareinsights.com https://static.cloudflareinsights.com; frame-src 'self' https://challenges.cloudflare.com https://www.openstreetmap.org https://maps.google.com; frame-ancestors 'none'"
  )
  return response
}

export default async function middleware(request: NextRequest) {
  // Gunakan X-Forwarded-Host dari Nginx jika ada, jika tidak gunakan host bawaan
  let hostname = request.headers.get("x-forwarded-host") || request.headers.get("host") || ""
  
  // Hapus port jika ada untuk memastikan deteksi domain akurat di mode development
  hostname = hostname.split(':')[0]

  // ENTERPRISE RATE LIMITING (DDoS Protection)
  const ip = (request as any).ip ?? request.headers.get("x-forwarded-for") ?? "127.0.0.1"
  const { success } = await edgeRateLimit.limit(ip)
  if (!success) {
    return new NextResponse("Too Many Requests. Enterprise DDoS Protection active.", { status: 429 })
  }
  
  let rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "schoolpro.id"
  if (hostname.endsWith("schoolpro.my.id") || hostname === "schoolpro.my.id") {
    rootDomain = "schoolpro.my.id"
  } else if (hostname.endsWith("schoolpro.id") || hostname === "schoolpro.id") {
    rootDomain = "schoolpro.id"
  }
  const { pathname } = request.nextUrl

  // 1. Lewati aset statis secara manual (Security Layer 2)
  if (
    pathname.startsWith("/_next") || 
    pathname.startsWith("/static") || 
    pathname.includes(".") && !pathname.startsWith("/api")
  ) {
    return addSecurityHeaders(NextResponse.next())
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

  // ============================================================
  // A. MAIN DOMAIN
  // ============================================================
  if (isMainDomain) {
    // Cek Affiliate Shortlink (contoh: /bdi123, /ref-abc, /mitra123)
    // Hindari rute sistem yang valid
    const systemRoutes = ["/admin", "/super-admin", "/affiliate", "/login", "/register", "/forgot-password", "/reset-password", "/daftarkan-sekolah", "/api", "/invoice", "/mitra-afiliasi", "/privacy-policy", "/panel-siswa", "/ujian"]
    const isSystemRoute = systemRoutes.some(r => pathname.startsWith(r))
    
    // Tangkap path apa saja yang bukan system route dan panjangnya antara 5-15 karakter alfanumerik (atau hyphen)
    if (!isSystemRoute && pathname.match(/^\/[a-zA-Z0-9-]{5,15}$/)) {
      const code = pathname.substring(1).toLowerCase()
      const redirectUrl = new URL("/", request.url)
      redirectUrl.searchParams.set("ref", code)
      const res = addSecurityHeaders(NextResponse.redirect(redirectUrl))
      return res
    }

    const isProtected = pathname.startsWith("/admin") || pathname.startsWith("/super-admin") || pathname.startsWith("/affiliate") || pathname.startsWith("/ortu") || pathname.startsWith("/panel-gtk") || pathname.startsWith("/panel-siswa") || pathname.startsWith("/ujian")
    const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register")

    if (isProtected && !session) {
      return addSecurityHeaders(NextResponse.redirect(new URL("/login", request.url)))
    }

    // ROLE-BASED STRICT ISOLATION
    if (session) {
      const impersonateRole = request.cookies.get("impersonate-user-role")?.value
      const isSuperAdmin = session.user?.isSuperAdmin
      const isAffiliate = session.user?.isAffiliate
      const activeRole = impersonateRole || session.user?.tenants?.[0]?.role

      if (pathname.startsWith("/admin")) {
        if (!isSuperAdmin && !isAffiliate && activeRole !== "owner" && activeRole !== "admin") {
          if (activeRole === "guru") return addSecurityHeaders(NextResponse.redirect(new URL("/panel-gtk", request.url)))
          if (activeRole === "orangtua") return addSecurityHeaders(NextResponse.redirect(new URL("/ortu", request.url)))
          if (activeRole === "siswa") return addSecurityHeaders(NextResponse.redirect(new URL("/panel-siswa", request.url)))
          return addSecurityHeaders(NextResponse.redirect(new URL("/login", request.url)))
        }
      }

      if (pathname.startsWith("/panel-gtk")) {
        if (!isSuperAdmin && activeRole !== "guru") {
          if (activeRole === "owner" || activeRole === "admin") return addSecurityHeaders(NextResponse.redirect(new URL("/admin", request.url)))
          if (activeRole === "orangtua") return addSecurityHeaders(NextResponse.redirect(new URL("/ortu", request.url)))
          if (activeRole === "siswa") return addSecurityHeaders(NextResponse.redirect(new URL("/panel-siswa", request.url)))
          return addSecurityHeaders(NextResponse.redirect(new URL("/login", request.url)))
        }
      }

      if (pathname.startsWith("/ortu")) {
        if (!isSuperAdmin && activeRole !== "orangtua") {
          if (activeRole === "owner" || activeRole === "admin") return addSecurityHeaders(NextResponse.redirect(new URL("/admin", request.url)))
          if (activeRole === "guru") return addSecurityHeaders(NextResponse.redirect(new URL("/panel-gtk", request.url)))
          if (activeRole === "siswa") return addSecurityHeaders(NextResponse.redirect(new URL("/panel-siswa", request.url)))
          return addSecurityHeaders(NextResponse.redirect(new URL("/login", request.url)))
        }
      }

      if (pathname.startsWith("/panel-siswa")) {
        if (!isSuperAdmin && activeRole !== "siswa") {
          if (activeRole === "owner" || activeRole === "admin") return addSecurityHeaders(NextResponse.redirect(new URL("/admin", request.url)))
          if (activeRole === "guru") return addSecurityHeaders(NextResponse.redirect(new URL("/panel-gtk", request.url)))
          if (activeRole === "orangtua") return addSecurityHeaders(NextResponse.redirect(new URL("/ortu", request.url)))
          return addSecurityHeaders(NextResponse.redirect(new URL("/login", request.url)))
        }
      }
    }

    if (pathname.startsWith("/super-admin") && session && !session.user?.isSuperAdmin) {
      const fallback = session.user?.isAffiliate && (!session.user?.tenants || session.user?.tenants.length === 0) ? "/affiliate" : "/admin"
      return addSecurityHeaders(NextResponse.redirect(new URL(fallback, request.url)))
    }

    if (pathname.startsWith("/affiliate") && session && !session.user?.isAffiliate) {
      return addSecurityHeaders(NextResponse.redirect(new URL(session.user?.isSuperAdmin ? "/super-admin" : "/admin", request.url)))
    }



    if (pathname.startsWith("/admin") && session && session.user?.isAffiliate && (!session.user?.tenants || session.user?.tenants.length === 0)) {
      return addSecurityHeaders(NextResponse.redirect(new URL("/affiliate", request.url)))
    }

    if (isAuthPage && session) {
      if (session.user?.isSuperAdmin) {
        return addSecurityHeaders(NextResponse.redirect(new URL("/super-admin", request.url)))
      } else if (session.user?.isAffiliate) {
        return addSecurityHeaders(NextResponse.redirect(new URL("/affiliate", request.url)))
      } else if (session.user?.tenants?.[0]?.role === "guru") {
        return addSecurityHeaders(NextResponse.redirect(new URL("/panel-gtk", request.url)))
      } else if (session.user?.tenants?.[0]?.role === "orangtua") {
        return addSecurityHeaders(NextResponse.redirect(new URL("/ortu", request.url)))
      } else if (session.user?.tenants?.[0]?.role === "siswa") {
        return addSecurityHeaders(NextResponse.redirect(new URL("/panel-siswa", request.url)))
      } else {
        return addSecurityHeaders(NextResponse.redirect(new URL("/admin", request.url)))
      }
    }

    return addSecurityHeaders(NextResponse.next())
  }

  // ============================================================
  // B. SUBDOMAIN
  // ============================================================
  if (isSubdomain) {
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
      pathname.startsWith("/panel-siswa") ||
      pathname.startsWith("/ujian")
    ) {
      const response = NextResponse.next()
      response.headers.set("x-tenant-slug", subdomain)
      return addSecurityHeaders(response)
    }

    // Rewrite ke website sekolah
    const url = request.nextUrl.clone()
    url.pathname = `/site/${subdomain}${pathname}`
    const response = NextResponse.rewrite(url)
    response.headers.set("x-tenant-slug", subdomain)
    response.headers.set("x-hostname", hostname)
    response.headers.set("x-root-domain", rootDomain)
    return addSecurityHeaders(response)
  }

  // ============================================================
  // C. CUSTOM DOMAIN
  // ============================================================
  if (isCustomDomain) {
    const slug = await resolveCustomDomain(hostname, request.url)
    if (!slug) return addSecurityHeaders(NextResponse.rewrite(new URL("/not-found", request.url)))

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
      pathname.startsWith("/panel-siswa") ||
      pathname.startsWith("/ujian")
    ) {
      const response = NextResponse.next()
      response.headers.set("x-tenant-slug", slug)
      response.headers.set("x-custom-domain", hostname)
      response.headers.set("x-hostname", hostname)
      response.headers.set("x-root-domain", rootDomain)
      return addSecurityHeaders(response)
    }

    const url = request.nextUrl.clone()
    url.pathname = `/site/${slug}${pathname}`
    const response = NextResponse.rewrite(url)
    response.headers.set("x-tenant-slug", slug)
    response.headers.set("x-custom-domain", hostname)
    response.headers.set("x-hostname", hostname)
    response.headers.set("x-root-domain", rootDomain)
    return addSecurityHeaders(response)
  }

  const response = NextResponse.next()
  response.headers.set("x-hostname", hostname)
  response.headers.set("x-root-domain", rootDomain)
  return addSecurityHeaders(response)
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
