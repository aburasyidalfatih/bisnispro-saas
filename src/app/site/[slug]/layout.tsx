import { db } from "@/lib/db"
import { getPublicTenantBySlug } from "@/lib/services/tenant-public"
import { notFound } from "next/navigation"
import { WebsiteNavbar } from "./_components/navbar"
import { WebsiteFooter } from "./_components/footer"
import { ThemeInjector } from "./_components/theme-injector"
import { RoutingProvider } from "@/components/providers/routing-provider"
import { headers } from "next/headers"
import { getActivePopup } from "@/lib/actions/popup"
import { PopupRenderer } from "./_components/popup-renderer"
import { PwaInstaller } from "@/components/pwa/pwa-installer"
import Script from "next/script"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getPublicTenantBySlug(slug)
  if (!tenant) return {}

  const headerList = await headers()
  const protocol = headerList.get("x-forwarded-proto") || "https"
  let host = headerList.get("x-forwarded-host") || headerList.get("host") || "schoolpro.id"
  host = host.split(':')[0]
  const domainUrl = `${protocol}://${host}`

  return {
    metadataBase: new URL(domainUrl),
    title: {
      template: `%s | ${tenant.name}`,
      default: tenant.seoTitle || tenant.name,
    },
    icons: tenant.logo ? { icon: tenant.logo, shortcut: tenant.logo, apple: tenant.logo } : undefined,
    openGraph: {
      title: {
        template: `%s | ${tenant.name}`,
        default: tenant.seoTitle || tenant.name,
      },
      description: tenant.seoDesc || tenant.description || `Website resmi ${tenant.name}`,
      siteName: tenant.name,
      images: tenant.logo ? [{ url: tenant.logo, width: 800, height: 600, alt: tenant.name }] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: {
        template: `%s | ${tenant.name}`,
        default: tenant.seoTitle || tenant.name,
      },
      description: tenant.seoDesc || tenant.description || `Website resmi ${tenant.name}`,
      images: tenant.logo ? [tenant.logo] : [],
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
      <div className="min-h-screen flex flex-col">
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

        <ThemeInjector theme={tenant.theme} />
        <WebsiteNavbar tenant={tenant} />
        <main className="flex-1">{children}</main>
        <WebsiteFooter tenant={tenant} />
        {activePopup && <PopupRenderer popup={activePopup} />}
        <PwaInstaller tenantName={tenant.name} tenantLogo={tenant.logo} />
        
        {tenant.umamiWebsiteId && (
          <Script
            strategy="afterInteractive"
            src="https://analytics.schoolpro.my.id/script.js"
            data-website-id={tenant.umamiWebsiteId}
          />
        )}
      </div>
    </RoutingProvider>
  )
}
