import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { eventSchema } from "@/features/event/schemas/event.schema"
import { parseBody } from "@/lib/api-utils"
import { z } from "zod"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  if (!tenantId) return NextResponse.json({ error: "tenantId harus diisi" }, { status: 400 })

  const { error } = await (await import("@/lib/api-utils")).requireTenantMembership(tenantId)
  if (error) return error

  try {
    const { listEvents } = await import("@/features/post/services/content.service")
    const events = await listEvents(tenantId)
    return NextResponse.json(events)
  } catch (error: any) {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
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

  try {
    const { createEvent } = await import("@/features/post/services/content.service")
    const event = await createEvent({
      tenantId,
      userId: session.user.id,
      isSuperAdmin: session.user.isSuperAdmin,
      data
    })
    return NextResponse.json({ message: "Acara berhasil dibuat", event })
  } catch (error: any) {
    const status = error.message?.includes("izin") ? 403 : 500
    return NextResponse.json({ error: error.message || "Terjadi kesalahan" }, { status })
  }
}
