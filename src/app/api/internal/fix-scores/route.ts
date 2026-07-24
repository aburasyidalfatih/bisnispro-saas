import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    // Cari semua tenant yang belum punya TenantScore
    const tenantsWithoutScore = await db.tenant.findMany({
      where: {
        tenantScore: { is: null }
      },
      select: { id: true, name: true, slug: true }
    })

    const count = tenantsWithoutScore.length
    if (count === 0) {
      return NextResponse.json({ message: "Semua tenant sudah memiliki TenantScore." })
    }

    // Buatkan skor 0 untuk semuanya
    let fixed = 0
    for (const tenant of tenantsWithoutScore) {
      await db.tenantScore.create({
        data: {
          tenantId: tenant.id,
          contentScore: 0,
          trafficScore: 0,
          activityScore: 0,
          totalScore: 0,
          rank: 0,
        }
      })
      fixed++
    }

    return NextResponse.json({ 
      success: true,
      message: `Berhasil memperbaiki ${fixed} perusahaan.`,
      tenantsFixed: tenantsWithoutScore.map(t => t.name)
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
