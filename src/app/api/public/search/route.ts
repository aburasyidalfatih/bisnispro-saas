import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const q = searchParams.get("q")
    const tenantId = searchParams.get("tenantId")

    if (!q || !tenantId) {
      return NextResponse.json({ error: "Missing query or tenantId" }, { status: 400 })
    }

    const query = q.toLowerCase()

    // 1. Posts (Berita, Pengumuman, Agenda)
    const postsPromise = db.post.findMany({
      where: {
        tenantId,
        status: "PUBLISHED",
        type: { notIn: ["PAGE", "BANNER", "BANNER_ALL", "POPUP"] },
        OR: [
          { title: { contains: query } },
          { content: { contains: query } },
          { seoDesc: { contains: query } }
        ]
      },
      take: 10,
      select: { id: true, title: true, slug: true, type: true, seoDesc: true, content: true, featuredImage: true }
    })

    const [posts] = await Promise.all([
      postsPromise
    ])

    const results = []

    // Map Posts
    for (const p of posts) {
      let typeLabel = "BERITA"
      let urlPrefix = "/berita"
      if (p.type.includes("PENGUMUMAN")) {
        typeLabel = "PENGUMUMAN"
        urlPrefix = "/pengumuman"
      } else if (p.type === "AGENDA") {
        typeLabel = "AGENDA"
        urlPrefix = "/agenda"
      } else if (p.type === "GALERI") {
        typeLabel = "GALERI"
        urlPrefix = "/gallery"
      }

      results.push({
        id: p.id,
        title: p.title,
        type: typeLabel,
        url: `${urlPrefix}/${p.slug}`,
        excerpt: p.seoDesc || p.content?.replace(/<[^>]*>?/gm, '').substring(0, 80) + "...",
        imageUrl: p.featuredImage
      })
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error("[PUBLIC_SEARCH]", error)
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}
