import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireTenantMembership } from "@/lib/api-utils"
import { auth } from "@/lib/auth"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  if (!tenantId) return NextResponse.json({ error: "tenantId diperlukan" }, { status: 400 })
  const { error } = await requireTenantMembership(tenantId)
  if (error) return error

  const session = await db.attendanceSession.findFirst({
    where: { id, tenantId },
    include: {
      classroom: true,
      records: {
        include: {
          student: { select: { id: true, name: true, nis: true } },
        },
        orderBy: { student: { name: "asc" } },
      },
    },
  })

  if (!session) return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 404 })
  return NextResponse.json(session)
}

// Bulk update records: { tenantId, records: [{ studentId, status, notes }] }
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = await params
  const body = await req.json()
  const { tenantId, records } = body

  if (!tenantId || !Array.isArray(records)) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 })
  const { error } = await requireTenantMembership(tenantId)
  if (error) return error

  // Upsert semua records sekaligus
  await Promise.all(
    records.map((rec: { studentId: string; status: string; notes?: string }) =>
      db.attendanceRecord.upsert({
        where: { sessionId_studentId_academicYear: { sessionId, studentId: rec.studentId, academicYear: "2025/2026" } },
        update: { status: rec.status, notes: rec.notes },
        create: { id: crypto.randomUUID(), academicYear: "2025/2026", sessionId, tenantId, studentId: rec.studentId, status: rec.status, notes: rec.notes },
      })
    )
  )

  return NextResponse.json({ message: "Absensi berhasil disimpan" })
}
