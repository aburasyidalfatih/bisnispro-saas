import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { eventSchema } from "@/lib/validations/event"
import { parseBody } from "@/lib/api-utils"
import { z } from "zod"
import { invalidatePublicTenantCache } from "@/features/tenant/services/tenant-public.service"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  if (!tenantId) return NextResponse.json({ error: "tenantId harus diisi" }, { status: 400 })

  const { error } = await (await import("@/lib/api-utils")).requireTenantMembership(tenantId)
  if (error) return error

  const events = await db.event.findMany({
    where: { tenantId },
    orderBy: { startDate: 'asc' },
  })

  return NextResponse.json(events)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const schema = z.object({
    tenantId: z.string().min(1),
  }).and(eventSchema)

  const parsed = await parseBody(req, schema)
  if (parsed.error) return parsed.error
  const { tenantId, ...data } = parsed.data

  const isSuperAdmin = session.user.isSuperAdmin
  if (!isSuperAdmin) {
    const tu = await db.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId, userId: session.user.id } },
    })
    const allowedRoles = ["owner", "admin", "operator"]
    if (!tu || !allowedRoles.includes(tu.role)) {
      return NextResponse.json({ error: "Tidak punya izin untuk membuat acara" }, { status: 403 })
    }
  }

  const event = await db.event.create({
    data: {
      ...data,
      tenantId,
    }
  })

  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) await invalidatePublicTenantCache(tenant.slug)

  return NextResponse.json({ message: "Acara berhasil dibuat", event })
}
