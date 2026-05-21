import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireTenantMembership } from "@/lib/api-utils"
import { auth } from "@/lib/auth"

// Admin approve / reject izin
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { tenantId, action, notes } = await req.json() // action: APPROVED | REJECTED
  if (!["APPROVED", "REJECTED"].includes(action)) return NextResponse.json({ error: "Action tidak valid" }, { status: 400 })

  const { error } = await requireTenantMembership(tenantId)
  if (error) return error

  const permit = await db.attendancePermit.update({
    where: { id },
    data: {
      status: action,
      reviewedBy: session.user.id,
      reviewedAt: new Date(),
    },
    include: { student: true },
  })

  // Jika APPROVED → update records absensi yang sesuai dengan IZIN/SAKIT
  if (action === "APPROVED") {
    const sessions = await db.attendanceSession.findMany({
      where: {
        tenantId,
        date: { gte: permit.startDate, lte: permit.endDate },
      },
      include: { records: { where: { studentId: permit.studentId } } },
    })

    await Promise.all(
      sessions.map(s =>
        db.attendanceRecord.upsert({
          where: { sessionId_studentId_academicYear: { sessionId: s.id, studentId: permit.studentId, academicYear: "2025/2026" } },
          update: { status: permit.type, notes: permit.reason },
          create: {
            id: crypto.randomUUID(),
            academicYear: "2025/2026",
            sessionId: s.id,
            tenantId,
            studentId: permit.studentId,
            status: permit.type,
            notes: permit.reason,
          },
        })
      )
    )
  }

  return NextResponse.json({ message: `Izin ${action === "APPROVED" ? "disetujui" : "ditolak"}`, permit })
}
