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
    const { code, description, type, percentage, cashbackAmount, affiliateId, isActive, maxUses, expiresAt, bonusMonths } = body

    let finalCode = code;

    if (type === "CASHBACK") {
      if (!affiliateId) {
        return NextResponse.json({ error: "ID Afiliasi Penerima wajib diisi untuk kupon Cashback." }, { status: 400 })
      }
      const affiliate = await db.affiliateProfile.findUnique({ where: { id: affiliateId } })
      if (!affiliate) {
        return NextResponse.json({ error: "Mitra Afiliasi tidak ditemukan." }, { status: 400 })
      }
      finalCode = affiliate.referralCode;
    }

    if (!finalCode) {
      return NextResponse.json({ error: "Code wajib diisi." }, { status: 400 })
    }

    const exists = await db.discountCode.findUnique({ where: { code: finalCode } })
    if (exists) {
      return NextResponse.json({ error: "Kode diskon sudah digunakan." }, { status: 400 })
    }

    const discount = await db.discountCode.create({
      data: {
        code: finalCode,
        description,
        type: type || "DISCOUNT",
        percentage: percentage ? Number(percentage) : 0,
        cashbackAmount: cashbackAmount ? Number(cashbackAmount) : 0,
        affiliateId: affiliateId || null,
        isActive: Boolean(isActive),
        bonusMonths: bonusMonths ? Number(bonusMonths) : 0,
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
