import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { parseBody } from "@/lib/api-utils"
import { z } from "zod"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  if (!tenantId) return NextResponse.json({ error: "tenantId harus diisi" }, { status: 400 })

  const { session, error: authError } = await (await import("@/lib/api-utils")).requireTenantMembership(tenantId)
  if (authError) return authError

  const isSent = url.searchParams.get("type") === "sent"

  try {
    const { listMessages } = await import("@/features/notification/services/inbox.service")
    const messages = await listMessages(tenantId, session.user.id, session.user.isSuperAdmin, isSent)
    return NextResponse.json(messages)
  } catch (error: any) {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const schema = z.object({
    tenantId: z.string().min(1),
    receiverId: z.string().nullable().optional(),
    subject: z.string().nullable().optional(),
    body: z.string().min(1, "Isi pesan tidak boleh kosong")
  })

  const parsed = await parseBody(req, schema)
  if (parsed.error) return parsed.error
  const { tenantId, receiverId, subject, body } = parsed.data

  try {
    const { sendMessage } = await import("@/features/notification/services/inbox.service")
    const message = await sendMessage(tenantId, session.user.id, receiverId || null, subject || null, body)
    return NextResponse.json({ message: "Pesan terkirim", data: message })
  } catch (error: any) {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
