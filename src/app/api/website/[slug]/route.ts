import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { unstable_cache } from "next/cache"

export const dynamic = "force-dynamic"

const getCachedWebsiteData = unstable_cache(
  async (slug: string) => {
    const tenant = await db.tenant.findFirst({
      where: {
        OR: [
          { slug: slug },
          { domain: slug }
        ]
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        description: true,
        tagline: true,
        about: true,
        address: true,
        phone: true,
        email: true,
        website: true,
        whatsapp: true,
        instagram: true,
        facebook: true,
        youtube: true,
        services: true,
        heroImage: true,
        gallery: true,
        theme: true,
        isActive: true,
        googleClientId: true,
        googleClientSecret: true,
      },
    })

    if (!tenant || !tenant.isActive) {
      return null
    }

    const { googleClientId, googleClientSecret, ...tenantData } = tenant
    const googleAuthEnabled = !!(googleClientId && googleClientSecret)

    // Fetch global turnstile setting
    const turnstileSettings = await db.platformSetting.findMany({
      where: { key: { in: ["TURNSTILE_SITE_KEY", "TURNSTILE_ENABLED"] } }
    })
    const isTurnstileEnabled = turnstileSettings.find(s => s.key === "TURNSTILE_ENABLED")?.value === "true"
    const turnstileSiteKey = isTurnstileEnabled ? (process.env.TURNSTILE_SITE_KEY || turnstileSettings.find(s => s.key === "TURNSTILE_SITE_KEY")?.value || "") : ""

    return { ...tenantData, googleAuthEnabled, turnstileSiteKey }
  },
  ["website-data"],
  { revalidate: 300 } // Cache for 5 minutes
)

// Public API — no auth required. Used by tenant website pages.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const data = await getCachedWebsiteData(slug)

  if (!data) {
    return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 })
  }

  return NextResponse.json(data)
}
