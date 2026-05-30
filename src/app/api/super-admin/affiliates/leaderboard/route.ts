import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.isSuperAdmin && !session?.user?.isAffiliate) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const filter = searchParams.get("filter") || "all" // weekly, monthly, yearly, all

    let gteDate = new Date(0)
    const now = new Date()

    if (filter === "weekly") {
      gteDate = new Date(now.setDate(now.getDate() - 7))
    } else if (filter === "monthly") {
      gteDate = new Date(now.getFullYear(), now.getMonth(), 1)
    } else if (filter === "yearly") {
      gteDate = new Date(now.getFullYear(), 0, 1)
    }

    // 1. Fetch all affiliates basic info
    const affiliates = await db.affiliateProfile.findMany({
      where: { isActive: true },
      include: {
        user: { select: { name: true, email: true, avatar: true } }
      }
    })

    // 2. Fetch grouped applications (pengajuan)
    const applications = await db.tenantApplication.groupBy({
      by: ['affiliateId'],
      _count: { id: true },
      where: { 
        affiliateId: { not: null },
        createdAt: { gte: gteDate }
      }
    })

    // 3. Fetch grouped tenants by plan (approved/active)
    const tenants = await db.tenant.groupBy({
      by: ['affiliateId', 'plan'],
      _count: { id: true },
      where: { 
        affiliateId: { not: null },
        createdAt: { gte: gteDate }
      }
    })

    // 4. Transform and map the data
    const appMap = new Map(applications.map(a => [a.affiliateId, a._count.id]))
    
    // tenantsMap: affiliateId -> { free: 0, lite: 0, pro: 0 }
    const tenantsMap = new Map<string, { free: number, lite: number, pro: number }>()
    tenants.forEach(t => {
      const aid = t.affiliateId!
      if (!tenantsMap.has(aid)) {
        tenantsMap.set(aid, { free: 0, lite: 0, pro: 0 })
      }
      const planStr = t.plan.toLowerCase()
      const counts = tenantsMap.get(aid)!
      if (planStr === 'lite') counts.lite += t._count.id
      else if (planStr === 'pro') counts.pro += t._count.id
      else counts.free += t._count.id
    })

    // 5. Calculate Leaderboard
    const leaderboard = affiliates.map(aff => {
      const aid = aff.id
      const totalApplications = appMap.get(aid) || 0
      const activeTenants = tenantsMap.get(aid) || { free: 0, lite: 0, pro: 0 }
      
      // Basic scoring formula
      // Pengajuan: 0.5 points
      // Free: 1 point
      // Lite: 3 points
      // Pro: 5 points
      const score = (totalApplications * 0.5) + (activeTenants.free * 1) + (activeTenants.lite * 3) + (activeTenants.pro * 5)
      
      return {
        id: aff.id,
        name: aff.user.name,
        email: aff.user.email,
        avatar: aff.user.avatar,
        referralCode: aff.referralCode,
        totalApplications,
        ...activeTenants,
        score
      }
    })
    
    // Sort descending by score
    leaderboard.sort((a, b) => b.score - a.score)
    
    // Assign Rank (handling ties simply by index + 1 for now)
    const rankedLeaderboard = leaderboard.map((item, idx) => ({
      ...item,
      rank: idx + 1
    }))

    return NextResponse.json(rankedLeaderboard)
  } catch (error: any) {
    return NextResponse.json({ error: "Gagal mengambil data leaderboard" }, { status: 500 })
  }
}
