import { requireTenantMembership } from "@/lib/api-utils"
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
  const { error: accessError } = await requireTenantMembership(tenantId as string);
  if (accessError) return accessError;

    // Find staff profile linked to this user
    const staff = await db.staff.findFirst({ where: { tenantId, userId: session.user.id } })
    if (!staff) return NextResponse.json({ error: "Profil staff tidak ditemukan" }, { status: 404 })

    // Get today's day of week (0=Minggu...6=Sabtu)
    const today = new Date()
    const dayOfWeek = today.getDay()

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
