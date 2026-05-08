import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { parseBody } from "@/lib/api-utils"
import { z } from "zod"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  if (!tenantId) return NextResponse.json({ error: "tenantId harus diisi" }, { status: 400 })

  const { session, error: authError } = await (await import("@/lib/api-utils")).requireTenantMembership(tenantId)
  if (authError) return authError

  const isSent = url.searchParams.get("type") === "sent"
  
  // Karena isSuperAdmin bisa mengakses tanpa ada di tenantUser
  let isAdminRole = session.user.isSuperAdmin

  if (!isAdminRole) {
    const tu = await db.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId, userId: session.user.id } },
    })
    isAdminRole = tu?.role === "owner" || tu?.role === "admin"
  }

  // Jika type=sent, ambil semua pesan yang dikirim oleh user ini
  if (isSent) {
    const messages = await db.internalMessage.findMany({
      where: { tenantId, senderId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        receiver: { select: { name: true, email: true, avatar: true } }
      }
    })
    return NextResponse.json(messages)
  }

  // Jika type=inbox (default)
  // Jika user adalah admin/owner, mereka menerima pesan yang receiverId = null ATAU receiverId = user.id
  // Jika user adalah guru, mereka hanya menerima pesan yang receiverId = user.id
  let whereClause: any = { tenantId, receiverId: session.user.id }
  
  if (isAdminRole) {
    whereClause = {
      tenantId,
      OR: [
        { receiverId: session.user.id },
        { receiverId: null } // Pesan ditujukan ke Admin
      ]
    }
  }

  const messages = await db.internalMessage.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: {
      sender: { select: { name: true, email: true, avatar: true } }
    }
  })

  return NextResponse.json(messages)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const schema = z.object({
    tenantId: z.string().min(1),
    receiverId: z.string().nullable().optional(), // Nullable berarti ke admin
    subject: z.string().nullable().optional(),
    body: z.string().min(1, "Isi pesan tidak boleh kosong")
  })

  const parsed = await parseBody(req, schema)
  if (parsed.error) return parsed.error
  const { tenantId, receiverId, subject, body } = parsed.data

  const message = await db.internalMessage.create({
    data: {
      tenantId,
      senderId: session.user.id,
      receiverId: receiverId || null,
      subject,
      body
    }
  })

  return NextResponse.json({ message: "Pesan terkirim", data: message })
}
