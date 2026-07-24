import Script from 'next/script'
import { db } from "@/lib/db"
import { LandingNavbar } from "../(landing)/_components/landing-navbar"
import { LandingFooter } from "../(landing)/_components/landing-footer"

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await db.platformSetting.findMany({
    where: { key: { in: ["app_logo", "platform_name"] } },
  })

  let appLogo = "/logo-bisnispro.png"
  let platformName = "BisnisPro"

  settings.forEach((s) => {
    if (s.key === "app_logo" && s.value) appLogo = s.value
    if (s.key === "platform_name" && s.value) platformName = s.value
  })

  return (
    <div className="flex flex-col min-h-screen">
      {/* Force aurora theme — public pages are platform-owned */}
      <Script
        id="force-aurora-theme-public"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.setAttribute("data-theme","aurora");`,
        }}
      />
      
      <LandingNavbar appLogo={appLogo} platformName={platformName} />
      
      <div className="flex-grow">
        {children}
      </div>
      
      <LandingFooter platformName={platformName} />
    </div>
  )
}
