import { db } from "@/lib/db"

export async function getAffiliatesForSuperAdmin(params: {
  page: number
  limit: number
  search: string
  sortBy?: string
}) {
  const { page, limit, search, sortBy } = params

  const where: any = {}

  if (search) {
    where.OR = [
      { user: { name: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
      { referralCode: { contains: search, mode: "insensitive" } }
    ]
  }

  const orderBy: any = {}
  if (sortBy === "balance") {
    orderBy.balance = "desc"
  } else {
    orderBy.createdAt = "desc"
  }

  const [affiliates, total] = await Promise.all([
    db.affiliateProfile.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        withdrawals: { where: { status: "PENDING" } },
        _count: { select: { tenants: true } }
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.affiliateProfile.count({ where })
  ])

  // Get global stats (efficient queries without fetching actual records)
  const totalAffiliates = await db.affiliateProfile.count()
  
  const balanceAgg = await db.affiliateProfile.aggregate({
    _sum: { balance: true }
  })
  
  const pendingWdAgg = await db.affiliateWithdrawal.aggregate({
    _sum: { amount: true },
    where: { status: "PENDING" }
  })

  return {
    affiliates,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    stats: {
      totalAffiliates,
      totalBalance: balanceAgg._sum.balance || 0,
      totalWithdrawalsPending: pendingWdAgg._sum.amount || 0
    }
  }
}
