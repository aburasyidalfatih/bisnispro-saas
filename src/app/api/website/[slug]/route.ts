import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// Public API — no auth required. Used by tenant website pages.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const tenant = await db.tenant.findUnique({
    where: { slug },
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
    return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 })
  }

  const { googleClientId, googleClientSecret, ...tenantData } = tenant
  const googleAuthEnabled = !!(googleClientId && googleClientSecret)

  // Fetch global turnstile setting
  const turnstileSettings = await db.platformSetting.findMany({
    where: { key: { in: ["TURNSTILE_SITE_KEY", "TURNSTILE_ENABLED"] } }
  })
  const isTurnstileEnabled = turnstileSettings.find(s => s.key === "TURNSTILE_ENABLED")?.value === "true"
  const turnstileSiteKey = isTurnstileEnabled ? (process.env.TURNSTILE_SITE_KEY || turnstileSettings.find(s => s.key === "TURNSTILE_SITE_KEY")?.value || "") : ""

  return NextResponse.json({ ...tenantData, googleAuthEnabled, turnstileSiteKey })
}
