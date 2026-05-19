import { MetadataRoute } from "next"
import { headers } from "next/headers"
import { db } from "@/lib/db"

export const revalidate = 3600 // Edge Caching ISR (1 jam)

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headerList = await headers()
  const protocol = headerList.get("x-forwarded-proto") || "https"
  const host = headerList.get("x-forwarded-host") || headerList.get("host") || "schoolpro.id"
  const domainUrl = `${protocol}://${host}`

  // Periksa apakah Super Admin menyalakan mode Block Indexing (Dev Mode)
  let blockIndexing = false
  try {
    const setting = await db.platformSetting.findUnique({
      where: { key: "block_search_indexing" }
    })
    if (setting && setting.value === "true") {
      blockIndexing = true
    }
  } catch (error) {
    // Abaikan jika error koneksi database
  }

  // Jika diblokir dari pengaturan Super Admin, cegah indeks seluruh site
  if (blockIndexing) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    }
  }

  return {
    rules: [
      {
        userAgent: "facebookexternalhit",
        allow: "/",
      },
      {
        userAgent: "Twitterbot",
        allow: "/",
      },
      {
        userAgent: "WhatsApp",
        allow: "/",
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/super-admin/"],
      }
    ],
    sitemap: `${domainUrl}/sitemap.xml`,
  }
}
