import { headers } from "next/headers"
import { checkIsMainDomain, getRootDomain } from "@/lib/utils"
import { getPublicTenantBySlug } from "@/lib/services/tenant-public"
import { db } from "@/lib/db"
import ClientRegisterPage from "./client-page"

export default async function RegisterPage() {
  const headerList = await headers()
  let host = headerList.get("x-forwarded-host") || headerList.get("host") || "schoolpro.id"
  host = host.split(':')[0]
  const isMainDomain = checkIsMainDomain(host)

  let tenantNameDisplay: string | null = null
  let platformLogo = "/logo-schoolpro.png"
  let googleAuthEnabled = false
  let tenantSlug: string | undefined = undefined

  if (isMainDomain) {
    try {
      const settings = await db.platformSetting.findMany({
        where: { key: { in: ["app_logo", "GOOGLE_CLIENT_ID"] } }
      })
      
      const logoSetting = settings.find(s => s.key === "app_logo")
      if (logoSetting && logoSetting.value) platformLogo = logoSetting.value
      
      const googleSetting = settings.find(s => s.key === "GOOGLE_CLIENT_ID")
      if (googleSetting && googleSetting.value) googleAuthEnabled = true
      
    } catch (e) {
      // ignore
    }

    if (!googleAuthEnabled && process.env.GOOGLE_CLIENT_ID) {
      googleAuthEnabled = true
    }
  } else {
    const rootDomain = getRootDomain(host)
    tenantSlug = host.replace(`.${rootDomain}`, "").split('.')[0]
    const tenant = await getPublicTenantBySlug(tenantSlug)
    
    const tenantAuth = await db.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { googleClientId: true, googleClientSecret: true }
    })
    
    if (tenantAuth && tenantAuth.googleClientId && tenantAuth.googleClientSecret) {
      googleAuthEnabled = true
    }

    if (tenant) {
      tenantNameDisplay = tenant.name
      platformLogo = tenant.logo || ""
    } else {
      platformLogo = ""
    }
  }

  return (
    <ClientRegisterPage
      isMainDomain={isMainDomain}
      tenantNameDisplay={tenantNameDisplay}
      platformLogo={platformLogo}
      googleAuthEnabled={googleAuthEnabled}
      initialTenantSlug={tenantSlug}
    />
  )
}
