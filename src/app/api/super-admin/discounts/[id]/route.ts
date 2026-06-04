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
    const { code, description, type, percentage, cashbackAmount, affiliateEmail, affiliateId, isActive, maxUses, expiresAt, bonusMonths } = body

    let finalCode = code;
    let finalAffiliateId = affiliateId || null;

    if (type === "CASHBACK") {
      if (!affiliateEmail) {
        return NextResponse.json({ error: "Email Mitra Afiliasi wajib diisi untuk kupon Cashback." }, { status: 400 })
      }
      const affiliate = await db.affiliateProfile.findFirst({ 
        where: { user: { email: affiliateEmail } } 
      })
      if (!affiliate) {
        return NextResponse.json({ error: `Mitra dengan email ${affiliateEmail} tidak ditemukan.` }, { status: 400 })
      }
      finalAffiliateId = affiliate.id;
      // Keep existing code for PUT
    }

    if (!finalCode) {
      return NextResponse.json({ error: "Code wajib diisi." }, { status: 400 })
    }

    const existing = await db.discountCode.findFirst({
      where: { code: finalCode, id: { not: id } },
    })

    if (existing) {
      return NextResponse.json({ error: "Kode diskon sudah digunakan." }, { status: 400 })
    }

    const discount = await db.discountCode.update({
      where: { id },
      data: {
        code: finalCode,
        description,
        type: type || "DISCOUNT",
        percentage: percentage ? Number(percentage) : 0,
        cashbackAmount: cashbackAmount ? Number(cashbackAmount) : 0,
        affiliateId: finalAffiliateId,
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
