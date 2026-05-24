import { db } from "@/lib/db"
import { getPublicTenantBySlug } from "@/features/tenant/services/tenant-public.service"
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
import Script from "next/script"
import { Suspense } from "react"

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getPublicTenantBySlug(slug)
  if (!tenant) return {}

  const canonicalDomain = tenant.domain 
    ? `https://${tenant.domain}` 
    : `https://${tenant.slug}.schoolpro.id`

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
  const headerList = await headers()
  
  const hostname = headerList.get("x-hostname") || headerList.get("host") || ""
  const rootDomain = headerList.get("x-root-domain") || process.env.NEXT_PUBLIC_ROOT_DOMAIN || "schoolpro.id"
  
  const isMainDomain = hostname === rootDomain || hostname === `www.${rootDomain}` || hostname.startsWith("localhost")
  const isSubdomain = hostname.endsWith(`.${rootDomain}`) && !isMainDomain
  const isCustomDomain = !isMainDomain && !isSubdomain

  const tenant = await getPublicTenantBySlug(slug)

  if (!tenant || !tenant.isActive) notFound()

  // Get active popup
  const activePopup = await getActivePopup(tenant.id)

  const routingValue = {
    isSubdomain,
    isCustomDomain,
    hostname,
    rootDomain,
    basePath: `/site/${slug}`
  }

  return (
    <RoutingProvider value={routingValue}>
      <div className="min-h-screen flex flex-col overflow-x-hidden w-full max-w-[100vw]">
        {/* JSON-LD Structured Data untuk Rich Snippets */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "EducationalOrganization",
              "name": tenant.name,
              "url": `https://${tenant.domain || tenant.slug + '.schoolpro.id'}`,
              "logo": tenant.logo || "https://schoolpro.id/logo-schoolpro.png",
              "telephone": tenant.phone || "",
              "email": tenant.email || "",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": tenant.address || "",
                "addressCountry": "ID"
              }
            })
          }}
        />

        <ThemeInjector theme={tenant.theme} settings={tenant.settings} />
        
        {/* Render Navbar hanya jika tidak menggunakan Custom Theme */}
        {!tenant.customThemeId && <WebsiteNavbar tenant={tenant} />}
        
        <main className="flex-1">{children}</main>
        
        {/* Render Footer hanya jika tidak menggunakan Custom Theme */}
        {!tenant.customThemeId && <WebsiteFooter tenant={tenant} />}
        
        {activePopup && <PopupRenderer popup={activePopup} />}
        <PwaInstaller tenantName={tenant.name} tenantLogo={normalizeImageUrl(tenant.logo) || tenant.logo} />
        <Suspense fallback={null}>
          <PageTracker tenantId={tenant.id} />
        </Suspense>
        

      </div>
    </RoutingProvider>
  )
}
