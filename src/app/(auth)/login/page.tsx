import { headers } from "next/headers"
import { checkIsMainDomain, getRootDomain } from "@/lib/utils"
import { getPublicTenantBySlug } from "@/lib/services/tenant-public"
import { db } from "@/lib/db"
import ClientLoginPage from "./client-page"

export default async function LoginPage() {
  const headerList = await headers()
  let host = headerList.get("x-forwarded-host") || headerList.get("host") || "schoolpro.id"
  host = host.split(':')[0]
  const isMainDomain = checkIsMainDomain(host)

  let tenantNameDisplay: string | null = null
  let platformLogo = "/logo-schoolpro.png"
  let googleAuthEnabled = false
  let turnstileSiteKey: string | null = null

  if (isMainDomain) {
    try {
      const settings = await db.platformSetting.findMany({
        where: { key: { in: ["app_logo", "google_auth_enabled", "turnstile_site_key"] } }
      })
      
      const logoSetting = settings.find(s => s.key === "app_logo")
      if (logoSetting && logoSetting.value) platformLogo = logoSetting.value
      
      const googleSetting = settings.find(s => s.key === "google_auth_enabled")
      if (googleSetting && googleSetting.value === "true") googleAuthEnabled = true
      
      const turnstileSetting = settings.find(s => s.key === "turnstile_site_key")
      if (turnstileSetting && turnstileSetting.value) turnstileSiteKey = turnstileSetting.value
    } catch (e) {
      // ignore db errors during build/static generation
    }
  } else {
    const rootDomain = getRootDomain(host)
    const slug = host.replace(`.${rootDomain}`, "").split('.')[0]
    const tenant = await getPublicTenantBySlug(slug)
    
    if (tenant) {
      tenantNameDisplay = tenant.name
      platformLogo = tenant.logo || ""
      if (tenant.googleAuthEnabled) googleAuthEnabled = true
      if (tenant.turnstileSiteKey) turnstileSiteKey = tenant.turnstileSiteKey
    } else {
      platformLogo = ""
    }
  }

  return (
    <ClientLoginPage
      isMainDomain={isMainDomain}
      tenantNameDisplay={tenantNameDisplay}
      platformLogo={platformLogo}
      googleAuthEnabled={googleAuthEnabled}
      turnstileSiteKey={turnstileSiteKey}
    />
  )
}
