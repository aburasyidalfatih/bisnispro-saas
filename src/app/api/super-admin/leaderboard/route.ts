import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const leaderboard = await db.$queryRaw`
      SELECT
        t.id,
        t.name,
        t.slug,
        t.logo,
        t.address,
        (
          (SELECT COUNT(*)::int FROM posts p WHERE p."tenantId" = t.id AND p."createdAt" >= NOW() - INTERVAL '30 days') +
          (SELECT COUNT(*)::int FROM staff s WHERE s."tenantId" = t.id AND s."createdAt" >= NOW() - INTERVAL '30 days') +
          (SELECT COUNT(*)::int FROM facilities f WHERE f."tenantId" = t.id AND f."createdAt" >= NOW() - INTERVAL '30 days') +
          (SELECT COUNT(*)::int FROM extracurriculars e WHERE e."tenantId" = t.id AND e."createdAt" >= NOW() - INTERVAL '30 days') +
          (SELECT COUNT(*)::int FROM programs pr WHERE pr."tenantId" = t.id AND pr."createdAt" >= NOW() - INTERVAL '30 days') +
          (SELECT COUNT(*)::int FROM achievements a WHERE a."tenantId" = t.id AND a."createdAt" >= NOW() - INTERVAL '30 days')
        ) as activity_score
      FROM tenants t
      WHERE t."isActive" = true
      ORDER BY activity_score DESC
      LIMIT 10;
    `

    // Filter yang score-nya > 0
    const filteredLeaderboard = (leaderboard as any[]).filter(t => t.activity_score > 0);

    // Ambil top 7
    return NextResponse.json(filteredLeaderboard.slice(0, 7))
  } catch (error) {
    console.error("Failed to fetch leaderboard", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
