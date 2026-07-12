import { NextResponse } from "next/server"
import { db as prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const tenantId = (session.user as any).tenants?.[0]?.id
    if (!tenantId) return NextResponse.json({ error: "No tenant" }, { status: 400 })

    const pages = await prisma.customPage.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(pages)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const tenantId = (session.user as any).tenants?.[0]?.id
    if (!tenantId) return NextResponse.json({ error: "No tenant" }, { status: 400 })

    const body = await req.json()
    const { title, slug, content, isPublished, featuredImage } = body

    if (!title || !slug) {
      return NextResponse.json({ error: "Judul dan URL Slug wajib diisi" }, { status: 400 })
    }

    // Cek slug unik per tenant
    const existing = await prisma.customPage.findUnique({
      where: { tenantId_slug: { tenantId, slug } }
    })

    if (existing) {
      return NextResponse.json({ error: "URL Slug ini sudah digunakan. Silakan gunakan yang lain." }, { status: 400 })
    }

    const newPage = await prisma.customPage.create({
      data: {
        tenantId,
        title,
        slug,
        content,
        featuredImage,
        isPublished: isPublished ?? false
      }
    })

    return NextResponse.json(newPage)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
