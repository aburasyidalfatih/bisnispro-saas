import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { code } = await req.json()
    if (!code) {
      return NextResponse.json({ error: "Kode diskon wajib diisi" }, { status: 400 })
    }

    const discount = await db.discountCode.findUnique({
      where: { code: code.toUpperCase() },
    })

    if (!discount) {
      return NextResponse.json({ error: "Kode diskon tidak ditemukan" }, { status: 404 })
    }

    if (!discount.isActive) {
      return NextResponse.json({ error: "Kode diskon sudah tidak aktif" }, { status: 400 })
    }

    if (discount.maxUses !== null && discount.usedCount >= discount.maxUses) {
      return NextResponse.json({ error: "Kode diskon sudah mencapai batas penggunaan" }, { status: 400 })
    }

    if (discount.expiresAt && new Date(discount.expiresAt) < new Date()) {
      return NextResponse.json({ error: "Kode diskon sudah kedaluwarsa" }, { status: 400 })
    }

    return NextResponse.json({
      id: discount.id,
      code: discount.code,
      percentage: discount.percentage,
      description: discount.description,
    })
  } catch (error) {
    console.error("Validate discount error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
