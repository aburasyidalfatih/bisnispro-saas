import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 1. Total Siswa Seluruh Sekolah (Estimasi)
    const studentsAgg = await db.tenantApplication.aggregate({
      _sum: { studentCount: true }
    })
    const totalStudents = studentsAgg._sum.studentCount || 0

    // 2. Breakdown Status Sekolah (Negeri vs Swasta)
    const schoolStatusGroups = await db.tenantApplication.groupBy({
      by: ['schoolStatus'],
      _count: { id: true },
    })

    // 3. Breakdown Posisi Pendaftar (Kepala Sekolah, Guru, dll)
    const positionGroups = await db.tenantApplication.groupBy({
      by: ['adminPosition'],
      _count: { id: true },
    })

    // 4. Breakdown Paket Berlangganan
    const planGroups = await db.tenant.groupBy({
      by: ['plan'],
      _count: { id: true },
    })

    // 5. Total Guru/Staf
    const totalStaff = await db.tenantUser.count({
      where: { role: { in: ['guru', 'teacher', 'admin', 'operator', 'owner'] } }
    })

    // 6. Pertumbuhan Pendaftar 6 bulan terakhir
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    
    const recentApplications = await db.tenantApplication.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' }
    })

    const monthlyGrowth = recentApplications.reduce((acc: any, app) => {
      const month = app.createdAt.toLocaleString('id-ID', { month: 'short', year: 'numeric' })
      acc[month] = (acc[month] || 0) + 1
      return acc
    }, {})

    return NextResponse.json({
      totalStudents,
      totalStaff,
      schoolStatusBreakdown: schoolStatusGroups.map(g => ({
        name: g.schoolStatus || 'TIDAK DIKETAHUI',
        value: g._count.id
      })),
      positionBreakdown: positionGroups.map(g => ({
        name: g.adminPosition || 'Lainnya',
        value: g._count.id
      })).sort((a, b) => b.value - a.value), // Sort desc
      planBreakdown: planGroups.map(g => ({
        name: g.plan.toUpperCase(),
        value: g._count.id
      })),
      monthlyGrowth: Object.entries(monthlyGrowth).map(([month, count]) => ({
        month,
        count
      }))
    })

  } catch (error: any) {
    console.error("Analytics Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
