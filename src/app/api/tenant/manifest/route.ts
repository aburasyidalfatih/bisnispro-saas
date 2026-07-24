import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get("slug")

  if (!slug) {
    return new NextResponse("Slug is required", { status: 400 })
  }
  const tenant = await db.tenant.findUnique({
    where: { slug }
  })

  if (!tenant) {
    return new NextResponse("Not Found", { status: 404 })
  }

  // Parse theme to get primary color
  let themeColor = "#0f172a" // default
  try {
    if (tenant.theme && typeof tenant.theme === "object") {
      const theme = tenant.theme as any
      if (theme.primaryColor) {
        themeColor = theme.primaryColor
      }
    }
  } catch (e) {}

  const logoUrl = tenant.logo || "/logo-bisnispro.png"

  const manifest = {
    name: tenant.name,
    short_name: tenant.name,
    description: tenant.description || `Aplikasi Resmi ${tenant.name}`,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: themeColor,
    icons: [
      {
        src: logoUrl,
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: logoUrl,
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable"
      }
    ]
  }

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400"
    }
  })
}
