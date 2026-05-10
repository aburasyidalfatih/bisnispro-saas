import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const discounts = await db.discountCode.findMany({
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(discounts)
  } catch (error) {
    console.error("GET discounts error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { code, description, percentage, isActive, maxUses, expiresAt } = body

    if (!code || !percentage) {
      return NextResponse.json({ error: "Code dan percentage wajib diisi." }, { status: 400 })
    }

    const exists = await db.discountCode.findUnique({ where: { code } })
    if (exists) {
      return NextResponse.json({ error: "Kode diskon sudah digunakan." }, { status: 400 })
    }

    const discount = await db.discountCode.create({
      data: {
        code,
        description,
        percentage: Number(percentage),
        isActive: Boolean(isActive),
        maxUses: maxUses ? Number(maxUses) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    })

    return NextResponse.json(discount)
  } catch (error) {
    console.error("POST discount error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
