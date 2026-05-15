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
        where: { key: { in: ["app_logo", "google_auth_enabled"] } }
      })
      
      const logoSetting = settings.find(s => s.key === "app_logo")
      if (logoSetting && logoSetting.value) platformLogo = logoSetting.value
      
      const googleSetting = settings.find(s => s.key === "google_auth_enabled")
      if (googleSetting && googleSetting.value === "true") googleAuthEnabled = true
      
    } catch (e) {
      // ignore
    }
  } else {
    const rootDomain = getRootDomain(host)
    tenantSlug = host.replace(`.${rootDomain}`, "").split('.')[0]
    const tenant = await getPublicTenantBySlug(tenantSlug)
    
    if (tenant) {
      tenantNameDisplay = tenant.name
      platformLogo = tenant.logo || ""
      if (tenant.googleAuthEnabled) googleAuthEnabled = true
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
