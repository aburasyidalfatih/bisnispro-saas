import { headers } from "next/headers"
import { checkIsMainDomain, getRootDomain } from "@/lib/utils"
import { getPublicTenantBySlug } from "@/features/tenant/services/tenant-public.service"
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
        where: { key: { in: ["app_logo", "GOOGLE_CLIENT_ID", "TURNSTILE_SITE_KEY", "TURNSTILE_ENABLED"] } }
      })
      
      const logoSetting = settings.find(s => s.key === "app_logo")
      if (logoSetting && logoSetting.value) platformLogo = logoSetting.value
      
      const googleSetting = settings.find(s => s.key === "GOOGLE_CLIENT_ID")
      if (googleSetting && googleSetting.value) googleAuthEnabled = true
      
      const turnstileEnabledSetting = settings.find(s => s.key === "TURNSTILE_ENABLED")
      const turnstileSiteKeySetting = settings.find(s => s.key === "TURNSTILE_SITE_KEY")
      if (turnstileEnabledSetting?.value === "true" && turnstileSiteKeySetting?.value) {
        turnstileSiteKey = turnstileSiteKeySetting.value
      }
    } catch (e) {
      // ignore db errors during build/static generation
    }

    if (!googleAuthEnabled && process.env.GOOGLE_CLIENT_ID) {
      googleAuthEnabled = true
    }
  } else {
    const rootDomain = getRootDomain(host)
    const slug = host.replace(`.${rootDomain}`, "").split('.')[0]
    const tenant = await getPublicTenantBySlug(slug)
    
    // Fetch tenant auth separately to avoid caching secrets in Redis
    const tenantAuth = await db.tenant.findUnique({
      where: { slug },
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

    // Fetch global turnstile setting for tenants
    const turnstileSettings = await db.platformSetting.findMany({
      where: { key: { in: ["TURNSTILE_SITE_KEY", "TURNSTILE_ENABLED"] } }
    })
    if (turnstileSettings.find(s => s.key === "TURNSTILE_ENABLED")?.value === "true") {
      turnstileSiteKey = process.env.TURNSTILE_SITE_KEY || turnstileSettings.find(s => s.key === "TURNSTILE_SITE_KEY")?.value || null
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
