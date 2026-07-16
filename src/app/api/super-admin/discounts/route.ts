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
      take: 200,
      orderBy: { createdAt: "desc" },
      include: {
        affiliate: {
          include: {
            user: { select: { email: true } }
          }
        }
      }
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
      finalCode = affiliate.referralCode;

      // Auto-increment code if it already exists (for additional schools)
      let counter = 2;
      let exists = await db.discountCode.findUnique({ where: { code: finalCode } })
      while (exists) {
        finalCode = `${affiliate.referralCode}-${counter}`;
        exists = await db.discountCode.findUnique({ where: { code: finalCode } })
        counter++;
      }
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
        affiliateId: finalAffiliateId,
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
