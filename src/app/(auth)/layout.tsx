import { headers } from "next/headers"
import { checkIsMainDomain, getRootDomain } from "@/lib/utils"
import { getTenantLayoutData } from "@/features/tenant/services/tenant-modular.service"
import Script from "next/script"

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const headerList = await headers()
  let host = headerList.get("x-forwarded-host") || headerList.get("host") || "bisnispro.id"
  host = host.split(':')[0]
  
  const isMainDomain = checkIsMainDomain(host)
  let theme = "aurora"
  
  if (!isMainDomain) {
    const rootDomain = getRootDomain(host)
    let slug = host.replace(`.${rootDomain}`, "").split('.')[0]
    const isSubdomain = host.endsWith(`.${rootDomain}`)
    
    let tenant = null;

    if (isSubdomain) {
      tenant = await getTenantLayoutData(slug)
    } else {
      const { db } = await import("@/lib/db")
      const tenantRecord = await db.tenant.findUnique({
        where: { domain: host },
        select: { slug: true }
      })
      if (tenantRecord) {
        slug = tenantRecord.slug
        tenant = await getTenantLayoutData(slug)
      }
    }
    
    if (tenant && tenant.theme) {
      theme = tenant.theme
    }
  }

  return (
    <>
      {/* 
        Menyuntikkan tema secara sinkron langsung ke DOM HTML sebelum komponen React di-render. 
        Ini akan menghilangkan kedipan tema (Theme Flash) 100%. 
      */}
      <Script
        id="auth-theme-injector"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.setAttribute("data-theme", "${theme}");`
        }}
      />
      {children}
    </>
  )
}
