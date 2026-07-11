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
    const { question, answer, isActive, sortOrder } = body

    if (!question || !answer) {
      return NextResponse.json({ error: "Pertanyaan dan jawaban wajib diisi" }, { status: 400 })
    }

    const faq = await prisma.faq.findFirst({
      where: { id, tenantId }
    })

    if (!faq) {
      return NextResponse.json({ error: "FAQ tidak ditemukan" }, { status: 404 })
    }

    const updated = await prisma.faq.update({
      where: { id },
      data: {
        question,
        answer,
        isActive: isActive ?? true,
        sortOrder: sortOrder ?? 0
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

    const faq = await prisma.faq.findFirst({
      where: { id, tenantId }
    })

    if (!faq) {
      return NextResponse.json({ error: "FAQ tidak ditemukan" }, { status: 404 })
    }

    await prisma.faq.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
