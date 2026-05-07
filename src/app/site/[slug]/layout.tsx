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
        <ThemeInjector theme={tenant.theme} />
        <WebsiteNavbar tenant={tenant} />
        <main className="flex-1">{children}</main>
        <WebsiteFooter tenant={tenant} />
        {activePopup && <PopupRenderer popup={activePopup} />}
        <PwaInstaller tenantName={tenant.name} tenantLogo={tenant.logo} />
      </div>
    </RoutingProvider>
  )
}
