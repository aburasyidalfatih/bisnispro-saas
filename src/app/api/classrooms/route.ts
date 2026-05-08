import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireTenantMembership } from "@/lib/api-utils"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  if (!tenantId) return NextResponse.json({ error: "tenantId diperlukan" }, { status: 400 })
  const { error } = await requireTenantMembership(tenantId)
  if (error) return error

  const classrooms = await db.classroom.findMany({
    where: { tenantId },
    include: { _count: { select: { students: true } } },
    orderBy: [{ level: "asc" }, { name: "asc" }],
  })
  return NextResponse.json(classrooms)
}
