import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireTenantMembership } from "@/lib/api-utils"
import { z } from "zod"

const schema = z.object({
  tenantId: z.string(),
  name: z.string().min(1),
  level: z.string().optional(),
  capacity: z.number().default(30),
  waliKelasId: z.string().optional(),
})

export async function POST(req: Request) {
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { tenantId, ...data } = parsed.data
  const { error } = await requireTenantMembership(tenantId)
  if (error) return error

  const classroom = await db.classroom.create({ data: { tenantId, ...data } })
  return NextResponse.json(classroom, { status: 201 })
}
