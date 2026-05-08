import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireTenantMembership } from "@/lib/api-utils"
import { auth } from "@/lib/auth"
import { z } from "zod"

const permitSchema = z.object({
  tenantId: z.string(),
  studentId: z.string(),
  type: z.enum(["IZIN", "SAKIT"]),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().min(5),
  proofUrl: z.string().optional(),
})

export async function GET(req: Request) {
  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  const status = url.searchParams.get("status")
  if (!tenantId) return NextResponse.json({ error: "tenantId diperlukan" }, { status: 400 })
  const { error } = await requireTenantMembership(tenantId)
  if (error) return error

  const permits = await db.attendancePermit.findMany({
    where: { tenantId, ...(status ? { status } : {}) },
    include: {
      student: { select: { id: true, name: true, classroom: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })
  return NextResponse.json(permits)
}

// Orang tua ajukan izin
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const parsed = permitSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { tenantId, studentId, type, startDate, endDate, reason, proofUrl } = parsed.data

  // Verifikasi siswa milik ortu ini
  const parentLink = await db.studentParent.findFirst({
    where: { userId: session.user.id, studentId },
  })
  if (!parentLink) return NextResponse.json({ error: "Anda tidak terdaftar sebagai orang tua siswa ini" }, { status: 403 })

  const permit = await db.attendancePermit.create({
    data: {
      tenantId,
      studentId,
      submittedBy: session.user.id,
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      proofUrl,
    },
  })
  return NextResponse.json(permit, { status: 201 })
}
