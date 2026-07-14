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

    // 2. Facilities
    const facilitiesPromise = db.facility.findMany({
      where: {
        tenantId,
        OR: [
          { name: { contains: query } },
          { description: { contains: query } }
        ]
      },
      take: 5,
      select: { id: true, name: true, slug: true, description: true, imageUrl: true }
    })

    // 3. Extracurriculars
    const ekstrakurikulerPromise = db.extracurricular.findMany({
      where: {
        tenantId,
        OR: [
          { name: { contains: query } },
          { description: { contains: query } }
        ]
      },
      take: 5,
      select: { id: true, name: true, slug: true, description: true, imageUrl: true }
    })

    // 4. Achievements
    const prestasiPromise = db.achievement.findMany({
      where: {
        tenantId,
        OR: [
          { title: { contains: query } },
          { description: { contains: query } }
        ]
      },
      take: 5,
      select: { id: true, title: true, slug: true, description: true, imageUrl: true }
    })

    // 5. Programs
    const programPromise = db.program.findMany({
      where: {
        tenantId,
        OR: [
          { name: { contains: query } },
          { description: { contains: query } }
        ]
      },
      take: 5,
      select: { id: true, name: true, slug: true, description: true }
    })

    // 6. Staff
    const staffPromise = db.staff.findMany({
      where: {
        tenantId,
        OR: [
          { name: { contains: query } },
          { bio: { contains: query } },
          { role: { contains: query } }
        ]
      },
      take: 5,
      select: { id: true, name: true, role: true, imageUrl: true }
    })

    const [posts, facilities, ekstrakurikulers, prestasis, programs, staffs] = await Promise.all([
      postsPromise, facilitiesPromise, ekstrakurikulerPromise, prestasiPromise, programPromise, staffPromise
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

    // Map Facilities
    for (const f of facilities) {
      results.push({
        id: f.id,
        title: f.name,
        type: "FASILITAS",
        url: `/fasilitas/${f.slug || f.id}`,
        excerpt: f.description?.replace(/<[^>]*>?/gm, '').substring(0, 80) + "...",
        imageUrl: f.imageUrl
      })
    }

    // Map Ekstrakurikuler
    for (const e of ekstrakurikulers) {
      results.push({
        id: e.id,
        title: e.name,
        type: "EKSTRAKURIKULER",
        url: `/ekstrakurikuler/${e.slug || e.id}`,
        excerpt: e.description?.replace(/<[^>]*>?/gm, '').substring(0, 80) + "...",
        imageUrl: e.imageUrl
      })
    }

    // Map Prestasi
    for (const p of prestasis) {
      results.push({
        id: p.id,
        title: p.title,
        type: "PRESTASI",
        url: `/prestasi/${p.slug || p.id}`,
        excerpt: p.description?.replace(/<[^>]*>?/gm, '').substring(0, 80) + "...",
        imageUrl: p.imageUrl
      })
    }

    // Map Program
    for (const p of programs) {
      results.push({
        id: p.id,
        title: p.name,
        type: "PROGRAM",
        url: `/program/${p.slug || p.id}`,
        excerpt: p.description?.replace(/<[^>]*>?/gm, '').substring(0, 80) + "...",
      })
    }

    // Map Staff
    for (const s of staffs) {
      results.push({
        id: s.id,
        title: s.name,
        type: "GTK",
        url: `/gtk/${s.id}`,
        excerpt: s.role,
        imageUrl: s.imageUrl
      })
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error("[PUBLIC_SEARCH]", error)
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}
