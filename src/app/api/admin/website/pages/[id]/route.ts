import { NextResponse } from "next/server"
import { db as prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const tenantId = (session.user as any).tenants?.[0]?.id
    if (!tenantId) return NextResponse.json({ error: "No tenant" }, { status: 400 })

    const { id } = await params
    const body = await req.json()
    const { title, slug, content, isPublished } = body

    if (!title || !slug) {
      return NextResponse.json({ error: "Judul dan URL Slug wajib diisi" }, { status: 400 })
    }

    // Pastikan page ini milik tenant
    const page = await prisma.customPage.findFirst({
      where: { id, tenantId }
    })

    if (!page) {
      return NextResponse.json({ error: "Halaman tidak ditemukan" }, { status: 404 })
    }

    // Cek slug unik (kecuali miliknya sendiri)
    if (slug !== page.slug) {
      const existing = await prisma.customPage.findUnique({
        where: { tenantId_slug: { tenantId, slug } }
      })
      if (existing) {
        return NextResponse.json({ error: "URL Slug ini sudah digunakan." }, { status: 400 })
      }
    }

    const updated = await prisma.customPage.update({
      where: { id },
      data: {
        title,
        slug,
        content,
        isPublished: isPublished ?? false
      }
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const tenantId = (session.user as any).tenants?.[0]?.id
    if (!tenantId) return NextResponse.json({ error: "No tenant" }, { status: 400 })

    const { id } = await params

    const page = await prisma.customPage.findFirst({
      where: { id, tenantId }
    })

    if (!page) {
      return NextResponse.json({ error: "Halaman tidak ditemukan" }, { status: 404 })
    }

    await prisma.customPage.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
