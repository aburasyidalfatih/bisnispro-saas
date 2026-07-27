import { headers } from "next/headers"
import { checkIsMainDomain, getRootDomain } from "@/lib/utils"
import { getTenantLayoutData } from "@/features/tenant/services/tenant-modular.service"

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

  // CSS variables are inherited, so a server-rendered wrapper applies the
  // tenant theme without inserting a script into a client-rendered tree.
  return <div data-theme={theme} className="contents">{children}</div>
}
