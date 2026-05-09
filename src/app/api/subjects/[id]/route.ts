import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { id } = await params
    const body = await req.json()
    const { name, code, description, isActive } = body

    const subject = await db.subject.update({
      where: { id },
      data: { name, code: code || null, description: description || null, isActive: isActive ?? true },
    })
    return NextResponse.json({ subject })
  } catch {
    return NextResponse.json({ error: "Gagal update mata pelajaran" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { id } = await params
    await db.subject.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Gagal menghapus mata pelajaran" }, { status: 500 })
  }
}
