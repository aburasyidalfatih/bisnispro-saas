import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/api-utils"

export async function GET(req: Request) {
  const { session, error } = await requireAuth()
  if (error) return error

  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  
  if (!tenantId) return NextResponse.json({ error: "tenantId harus diisi" }, { status: 400 })

  // Check roles
  let isAdminRole = session.user.isSuperAdmin
  if (!isAdminRole) {
    const tu = await db.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId, userId: session.user.id } },
    })
    isAdminRole = tu?.role === "owner" || tu?.role === "admin"
  }

  // Count unread internal messages
  let internalWhere: any = { tenantId, receiverId: session.user.id, isRead: false }
  if (isAdminRole) {
    internalWhere = {
      tenantId,
      isRead: false,
      OR: [
        { receiverId: session.user.id },
        { receiverId: null }
      ]
    }
  }

  const internalCount = await db.internalMessage.count({ where: internalWhere })

  // Count unread contact submissions (only admins)
  let contactCount = 0
  if (isAdminRole) {
    contactCount = await db.contactSubmission.count({ where: { tenantId, isRead: false } })
  }

  const totalUnread = internalCount + contactCount

  return NextResponse.json({ unread: totalUnread, internalCount, contactCount })
}
