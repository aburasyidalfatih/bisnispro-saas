import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { code, description, percentage, isActive, maxUses, expiresAt, bonusMonths } = body

    if (!code || percentage === undefined) {
      return NextResponse.json({ error: "Code dan percentage wajib diisi." }, { status: 400 })
    }

    const existing = await db.discountCode.findFirst({
      where: { code, id: { not: id } },
    })

    if (existing) {
      return NextResponse.json({ error: "Kode diskon sudah digunakan." }, { status: 400 })
    }

    const discount = await db.discountCode.update({
      where: { id },
      data: {
        code,
        description,
        percentage: Number(percentage),
        isActive: Boolean(isActive),
        bonusMonths: bonusMonths ? Number(bonusMonths) : 0,
        maxUses: maxUses ? Number(maxUses) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    })

    return NextResponse.json(discount)
  } catch (error) {
    console.error("PUT discount error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await db.discountCode.delete({
      where: { id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE discount error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
