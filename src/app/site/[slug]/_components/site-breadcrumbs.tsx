import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"
import { buildDynamicBreadcrumbs } from "@/lib/utils/breadcrumbs"

interface SiteBreadcrumbsProps {
  tenant: any
  basePath: string
  targetUrl: string
  fallbackLabel: string
  currentItemName?: string
  currentItemUrl?: string
}

export function SiteBreadcrumbs({ 
  tenant, 
  basePath, 
  targetUrl, 
  fallbackLabel, 
  currentItemName, 
  currentItemUrl 
}: SiteBreadcrumbsProps) {
  // Generate base breadcrumbs (e.g., Home > Informasi > Berita)
  const baseBreadcrumbs = buildDynamicBreadcrumbs(tenant.websiteMenus || [], targetUrl, fallbackLabel)
  
  // Append current detail item if provided
  const breadcrumbs = currentItemName 
    ? [...baseBreadcrumbs, { label: currentItemName, href: currentItemUrl }]
    : baseBreadcrumbs

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'schoolpro.id'
  const domainUrl = tenant.domain ? `https://${tenant.domain}` : `https://${tenant.slug}.${rootDomain}`

  return (
    <>
      {/* UI Breadcrumbs */}
      <nav className="flex flex-wrap items-center space-x-2 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
        <Link href={basePath || "/"} className="hover:text-primary transition-colors flex items-center shrink-0">
          <Home className="h-4 w-4" />
        </Link>
        {breadcrumbs.map((item, index) => (
          <div key={index} className="flex items-center space-x-2 shrink-0">
            <ChevronRight className="h-4 w-4 opacity-50" />
            {item.href && index < breadcrumbs.length - 1 ? (
              <Link href={`${basePath}${item.href}`} className="hover:text-primary transition-colors font-medium truncate max-w-[150px] sm:max-w-[200px]">
                {item.label}
              </Link>
            ) : (
              <span className="text-primary font-bold truncate max-w-[200px] sm:max-w-[300px]" aria-current="page">
                {item.label}
              </span>
            )}
          </div>
        ))}
      </nav>

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Beranda",
                "item": domainUrl
              },
              ...breadcrumbs.map((item, index) => ({
                "@type": "ListItem",
                "position": index + 2,
                "name": item.label,
                ...(item.href ? { "item": `${domainUrl}${item.href}` } : {})
              }))
            ]
          })
        }}
      />
    </>
  )
}
