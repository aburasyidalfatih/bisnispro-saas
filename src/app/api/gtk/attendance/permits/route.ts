import { NextResponse } from "next/server"
import { db, withTenant } from "@/lib/db"
import { auth } from "@/lib/auth"
import { requireTenantMembership } from "@/lib/api-utils"
import { z } from "zod"

const permitSchema = z.object({
  tenantId: z.string(),
  staffId: z.string(),
  type: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string(),
  proofUrl: z.string().optional(),
})

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  const staffId = url.searchParams.get("staffId")
  const status = url.searchParams.get("status")
  const page = parseInt(url.searchParams.get("page") || "1")
  const take = parseInt(url.searchParams.get("take") || "30")

  if (!tenantId) return NextResponse.json({ error: "tenantId diperlukan" }, { status: 400 })

  const { error } = await requireTenantMembership(tenantId)
  if (error) return error

  const tenantDb = withTenant(tenantId)
  const where: any = {
    ...(staffId ? { staffId } : {}),
    ...(status ? { status } : {}),
  }

  const [records, total] = await Promise.all([
    tenantDb.staffPermit.findMany({
      where,
      include: { staff: { select: { id: true, name: true, role: true, imageUrl: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * take,
      take,
    }),
    tenantDb.staffPermit.count({ where }),
  ])

  return NextResponse.json({ data: records, meta: { total, page, totalPages: Math.ceil(total / take) } })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const parsed = permitSchema.parse(body)

    const { error } = await requireTenantMembership(parsed.tenantId)
    if (error) return error

    const staff = await db.staff.findFirst({
      where: { id: parsed.staffId, tenantId: parsed.tenantId },
      select: { id: true },
    })
    if (!staff) {
      return NextResponse.json({ error: "Data GTK tidak ditemukan untuk tenant ini" }, { status: 404 })
    }

    const tenantDb = withTenant(parsed.tenantId)
    const permit = await tenantDb.staffPermit.create({
      data: {
        tenantId: parsed.tenantId,
        staffId: parsed.staffId,
        type: parsed.type,
        startDate: new Date(parsed.startDate),
        endDate: new Date(parsed.endDate),
        reason: parsed.reason,
        proofUrl: parsed.proofUrl || null,
        submittedBy: session.user.id,
        status: "PENDING",
      },
    })

    return NextResponse.json({ success: true, data: permit })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Terjadi kesalahan" }, { status: 500 })
  }
}
