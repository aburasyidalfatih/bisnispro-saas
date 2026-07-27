import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

const statusSchema = z.object({ status: z.enum(["NEW", "REVIEWING", "QUOTED", "WON", "REJECTED"]) })

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const parsed = statusSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 })
  const { id } = await params
  const rfq = await db.rfqSubmission.findUnique({ where: { id }, select: { tenantId: true } })
  if (!rfq) return NextResponse.json({ error: "RFQ not found" }, { status: 404 })
  const member = await db.tenantUser.findUnique({ where: { tenantId_userId: { tenantId: rfq.tenantId, userId: session.user.id } } })
  if (!member || !["owner", "admin"].includes(member.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const updated = await db.rfqSubmission.update({ where: { id }, data: { status: parsed.data.status, isRead: true }, select: { id: true, status: true, isRead: true } })
  return NextResponse.json(updated)
}
