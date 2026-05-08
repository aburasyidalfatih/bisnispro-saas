import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { requireTenantMembership } from "@/lib/api-utils"

/**
 * GET /api/attendance/records
 * Query params:
 *   - tenantId (required)
 *   - studentId (required)
 *   - from (optional, ISO date)
 *   - to (optional, ISO date)
 */
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  const studentId = url.searchParams.get("studentId")
  const from = url.searchParams.get("from")
  const to = url.searchParams.get("to")

  if (!tenantId || !studentId) return NextResponse.json({ error: "tenantId dan studentId diperlukan" }, { status: 400 })

  // Validasi akses: admin/guru tenant bisa lihat semua, ortu hanya bisa lihat anaknya
  if (!session.user.isSuperAdmin) {
    const { error } = await requireTenantMembership(tenantId)
    if (error) return error

    // Cek role dari db atau session
    const tu = await db.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId, userId: session.user.id } }
    })
    
    if (tu && !["owner", "admin", "guru"].includes(tu.role)) {
      // Jika bukan admin/guru, wajib punya link parent
      const parentLink = await db.studentParent.findFirst({
        where: { userId: session.user.id, studentId },
      })
      if (!parentLink) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 })
    }
  }

  const records = await db.attendanceRecord.findMany({
    where: {
      tenantId,
      studentId,
      ...(from || to ? {
        session: {
          date: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        },
      } : {}),
    },
    include: {
      session: { select: { id: true, date: true, type: true, classroom: { select: { name: true } } } },
    },
    orderBy: { session: { date: "desc" } },
    take: 90, // max 3 bulan
  })

  return NextResponse.json(records)
}
