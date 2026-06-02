import { headers } from "next/headers"
import { checkIsMainDomain, getRootDomain } from "@/lib/utils"
import { getTenantLayoutData } from "@/features/tenant/services/tenant-modular.service"
import { db } from "@/lib/db"
import ClientForgotPasswordPage from "./client-page"

export default async function ForgotPasswordPage() {
  const headerList = await headers()
  let host = headerList.get("x-forwarded-host") || headerList.get("host") || "schoolpro.id"
  host = host.split(':')[0]
  const isMainDomain = checkIsMainDomain(host)

  let tenantNameDisplay: string | null = null
  let platformLogo = "/logo-schoolpro.png"

  if (isMainDomain) {
    try {
      const logoSetting = await db.platformSetting.findUnique({
        where: { key: "app_logo" }
      })
      if (logoSetting && logoSetting.value) platformLogo = logoSetting.value
    } catch (e) {
      // ignore
    }
  } else {
    const rootDomain = getRootDomain(host)
    let tenantSlug = host.replace(`.${rootDomain}`, "").split('.')[0]
    const isSubdomain = host.endsWith(`.${rootDomain}`)
    
    let tenant = null;

    if (isSubdomain) {
      tenant = await getTenantLayoutData(tenantSlug)
    } else {
      const tenantRecord = await db.tenant.findUnique({
        where: { domain: host },
        select: { slug: true }
      })
      if (tenantRecord) {
        tenantSlug = tenantRecord.slug
        tenant = await getTenantLayoutData(tenantSlug)
      }
    }
    
    if (tenant) {
      tenantNameDisplay = tenant.name
      platformLogo = tenant.logo || ""
    } else {
      platformLogo = ""
    }
  }

  return (
    <ClientForgotPasswordPage
      isMainDomain={isMainDomain}
      tenantNameDisplay={tenantNameDisplay}
      platformLogo={platformLogo}
    />
  )
}
