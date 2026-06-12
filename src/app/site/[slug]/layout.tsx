import { db, withTenant } from "@/lib/db"
import { getTenantLayoutData } from "@/features/tenant/services/tenant-modular.service"
import { notFound } from "next/navigation"
import { WebsiteNavbar } from "./_components/navbar"
import { WebsiteFooter } from "./_components/footer"
import { ThemeInjector } from "./_components/theme-injector"
import { RoutingProvider } from "@/components/providers/routing-provider"
import { headers } from "next/headers"
import { getActivePopup } from "@/features/popup/actions/popup.action"
import { PopupRenderer } from "./_components/popup-renderer"
import { normalizeImageUrl } from "@/lib/utils"
import { PwaInstaller } from "@/components/pwa/pwa-installer"
import { PageTracker } from "@/components/shared/page-tracker"
import { FloatingWhatsApp } from "./_components/floating-whatsapp"
import { Suspense } from "react"
import { normalizeWebsiteMenuTree } from "@/features/website-menu/menu-tree"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getTenantLayoutData(slug)
  if (!tenant) return {}

  const headerList = await headers()
  const rootDomain = headerList.get("x-root-domain") || process.env.NEXT_PUBLIC_ROOT_DOMAIN || "schoolpro.id"

  const canonicalDomain = tenant.domain 
    ? `https://${tenant.domain}` 
    : `https://${tenant.slug}.${rootDomain}`

  const ogImageBase = tenant.heroImage || tenant.logo || "https://schoolpro.id/default-og.jpg"
  // Fix: Proxy OG image through custom og-proxy to convert WebP to JPEG for Facebook/WhatsApp
  const ogImageUrl = `${canonicalDomain}/api/og-proxy?url=${encodeURIComponent(ogImageBase)}&ext=.jpg`

  const normalizedLogo = tenant.logo ? (normalizeImageUrl(tenant.logo) || tenant.logo) : null;

  return {
    metadataBase: new URL(canonicalDomain),
    title: {
      template: `%s | ${tenant.name}`,
      default: tenant.seoTitle || tenant.name,
    },
    alternates: {},
    icons: normalizedLogo ? { 
      icon: normalizedLogo, 
      shortcut: normalizedLogo, 
      apple: normalizedLogo 
    } : undefined,
    openGraph: {
      title: {
        template: `%s | ${tenant.name}`,
        default: tenant.seoTitle || tenant.name,
      },
      description: tenant.seoDesc || tenant.description || `Website resmi ${tenant.name}`,
      siteName: tenant.name,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: tenant.name }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: {
        template: `%s | ${tenant.name}`,
        default: tenant.seoTitle || tenant.name,
      },
      description: tenant.seoDesc || tenant.description || `Website resmi ${tenant.name}`,
      images: [ogImageUrl],
    }
  }
}

export default async function WebsiteLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const [headerList, tenant] = await Promise.all([
    headers(),
    getTenantLayoutData(slug),
  ])
  
  const hostname = headerList.get("x-hostname") || headerList.get("host") || ""
  const rootDomain = headerList.get("x-root-domain") || process.env.NEXT_PUBLIC_ROOT_DOMAIN || "schoolpro.id"
  
  const isMainDomain = hostname === rootDomain || hostname === `www.${rootDomain}` || hostname.startsWith("localhost")
  const isSubdomain = hostname.endsWith(`.${rootDomain}`) && !isMainDomain
  const isCustomDomain = !isMainDomain && !isSubdomain

  if (!tenant) notFound()

  if (!tenant.isActive) {
    if (tenant.retentionStatus?.startsWith("SUSPENDED")) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center p-6">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-lg border border-red-100">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Website Ditangguhkan</h1>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Website sekolah ini sedang dalam keadaan ditangguhkan (Suspend) karena tidak ada aktivitas masuk (login) oleh pengelola selama lebih dari 60 hari.
            </p>
            <p className="text-sm text-gray-500 mb-8 p-4 bg-gray-50 rounded-xl">
              Jika Anda adalah pengelola website ini, segera masuk (login) ke Dasbor Admin SchoolPro untuk mengaktifkannya kembali sebelum data dihapus secara permanen.
            </p>
            <a href="https://schoolpro.id/login" className="inline-block bg-primary text-white font-medium py-3 px-8 rounded-xl hover:opacity-90 transition-opacity">
              Login ke Dasbor
            </a>
          </div>
        </div>
      )
    }
    notFound()
  }

  // Fetch website menus dynamically (uncached) to bypass next.js unstable_cache replication/sync issues
  const tenantDb = withTenant(tenant.id)
  const freshMenus = normalizeWebsiteMenuTree(await tenantDb.websiteMenu.findMany({
    where: { tenantId: tenant.id, parentId: null, isActive: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: {
      children: {
        where: { tenantId: tenant.id, isActive: true },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }]
      }
    }
  }))

  const tenantWithFreshMenus = {
    ...tenant,
    websiteMenus: freshMenus
  }

  // Get active popup
  const activePopup = await getActivePopup(tenant.id)

  const routingValue = {
    isSubdomain,
    isCustomDomain,
    hostname,
    rootDomain,
    basePath: `/site/${slug}`
  }
  const structuredData = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": tenant.name,
    "url": `https://${tenant.domain || tenant.slug + '.' + rootDomain}`,
    "logo": tenant.logo || "https://schoolpro.id/logo-schoolpro.png",
    "telephone": tenant.phone || "",
    "email": tenant.email || "",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": tenant.address || "",
      "addressCountry": "ID"
    }
  }).replace(/</g, "\\u003c")

  return (
    <RoutingProvider value={routingValue}>
      <div className="min-h-screen flex flex-col overflow-x-hidden w-full max-w-[100vw]">
        {/* JSON-LD Structured Data untuk Rich Snippets */}
        <script type="application/ld+json">{structuredData}</script>

        <ThemeInjector theme={tenant.theme} settings={tenant.settings} />
        
        {/* Render Navbar hanya jika tidak menggunakan Custom Theme */}
        {!tenant.customThemeId && <WebsiteNavbar tenant={tenantWithFreshMenus as any} />}
        
        <main className="flex-1">{children}</main>
        
        {/* Render Footer hanya jika tidak menggunakan Custom Theme */}
        {!tenant.customThemeId && <WebsiteFooter tenant={tenantWithFreshMenus as any} />}
        
        {activePopup && <PopupRenderer popup={activePopup} />}
        
        {/* Floating WhatsApp Widget */}
        {tenant.whatsapp && !tenant.customThemeId && (
          <FloatingWhatsApp whatsappNumber={tenant.whatsapp} message={`Halo Admin ${tenant.name}, saya ingin bertanya mengenai info di website.`} />
        )}

        <PwaInstaller tenantName={tenant.name} tenantLogo={normalizeImageUrl(tenant.logo) || tenant.logo} />
        <Suspense fallback={null}>
          <PageTracker tenantId={tenant.id} />
        </Suspense>
      </div>
    </RoutingProvider>
  )
}
