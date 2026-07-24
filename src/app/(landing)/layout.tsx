/**
 * Landing page layout — tema selalu aurora (default platform).
 * Tidak ikut tema tenant karena ini halaman milik super admin/platform.
 * Override data-theme di <html> via script sebelum render.
 */
import { db } from "@/lib/db"
import { LandingNavbar } from "./_components/landing-navbar"
import { LandingFooter } from "./_components/landing-footer"

export default async function LandingLayout({ children }: { children: React.ReactNode }) {
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
      {/* Force aurora theme — landing page is platform-owned, not tenant-owned */}
      <script
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
