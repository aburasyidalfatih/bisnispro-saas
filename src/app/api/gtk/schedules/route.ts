import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

// GTK: Get today's schedules for current staff
export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get("tenantId")
    if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 })

    // Find staff profile linked to this user
    const staff = await db.staff.findFirst({ where: { tenantId, userId: session.user.id } })
    if (!staff) return NextResponse.json({ error: "Profil staff tidak ditemukan" }, { status: 404 })

    // Get today's day of week (1=Senin...6=Sabtu, JS: 0=Sun,1=Mon...)
    const today = new Date()
    const jsDay = today.getDay() // 0=Sun
    const dayOfWeek = jsDay === 0 ? 7 : jsDay // Convert to 1=Mon..7=Sun

    const schedules = await db.schedule.findMany({
      where: { tenantId, staffId: staff.id, dayOfWeek },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        classroom: {
          select: {
            id: true, name: true, level: true,
            students: {
              where: { isActive: true },
              select: { id: true, name: true, nis: true },
              orderBy: { name: "asc" },
            },
          },
        },
      },
      orderBy: { startTime: "asc" },
    })
    return NextResponse.json({ schedules, staff })
  } catch {
    return NextResponse.json({ error: "Gagal memuat jadwal" }, { status: 500 })
  }
}
