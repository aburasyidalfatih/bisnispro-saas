import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search")

    const where: any = {}
    if (search) {
      where.OR = [
        { affiliate: { user: { name: { contains: search, mode: "insensitive" } } } },
        { affiliate: { referralCode: { contains: search, mode: "insensitive" } } },
        { tenant: { name: { contains: search, mode: "insensitive" } } }
      ]
    }

    const [commissions, total] = await Promise.all([
      db.affiliateCommission.findMany({
        where,
        include: {
          affiliate: {
            include: {
              user: { select: { name: true, email: true } }
            }
          },
          tenant: { select: { name: true, slug: true } },
          payment: {
            select: {
              reference: true,
              amount: true,
              discountCode: {
                select: { code: true, type: true, affiliateId: true, cashbackAmount: true, percentage: true }
              }
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.affiliateCommission.count({ where })
    ])

    return NextResponse.json({
      commissions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error: any) {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
