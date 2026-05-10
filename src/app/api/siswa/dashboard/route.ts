import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getStudentDashboardCached } from "@/lib/services/dashboard-cache"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const tenantId = session.user.tenants?.[0]?.id

  if (!tenantId) return NextResponse.json({ error: "Tenant required" }, { status: 400 })

  try {
    const data = await getStudentDashboardCached(session.user.id, tenantId)
    
    if (!data) {
      return NextResponse.json({ error: "Siswa tidak ditemukan" }, { status: 404 })
    }

    return NextResponse.json({
      student: {
        name: data.student.name,
        nisn: data.student.nisn,
        className: data.student.classroom?.name || "Belum ada kelas",
      },
      wallet: {
        balance: data.student.walletAccount?.balance || 0,
        transactions: data.student.walletAccount?.transactions || []
      },
      announcements: data.announcements.map((a: any) => ({
        id: a.id,
        title: a.title,
        excerpt: a.seoDesc || "",
        createdAt: a.createdAt
      })),
      tomorrowSchedules: data.schedules.map((s: any) => ({
        id: s.id,
        subject: s.subject?.name,
        teacher: s.staff?.user?.name,
        time: `${s.startTime} - ${s.endTime}`
      }))
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
