/**
 * API: Contact Submissions (Dashboard)
 * GET  /api/tenant/contact-submissions?tenantId=xxx&page=1
 * PUT  /api/tenant/contact-submissions  — mark as read
 * DELETE /api/tenant/contact-submissions — delete submission
 */

import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/api-utils"

async function checkAccess(tenantId: string, userId: string, isSuperAdmin: boolean) {
  if (isSuperAdmin) return true
  const tu = await db.tenantUser.findUnique({
    where: { tenantId_userId: { tenantId, userId } },
  })
  return !!(tu && ["owner", "admin"].includes(tu.role))
}

export async function GET(req: Request) {
  const { session, error } = await requireAuth()
  if (error) return error

  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  const page = Number(url.searchParams.get("page") || "1")
  const limit = 20

  if (!tenantId) return NextResponse.json({ error: "tenantId harus diisi" }, { status: 400 })

  const hasAccess = await checkAccess(tenantId, session.user.id, session.user.isSuperAdmin)
  if (!hasAccess) return NextResponse.json({ error: "Tidak punya izin" }, { status: 403 })

  const [data, total, unread] = await Promise.all([
    db.contactSubmission.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.contactSubmission.count({ where: { tenantId } }),
    db.contactSubmission.count({ where: { tenantId, isRead: false } }),
  ])

  return NextResponse.json({ data, total, unread, page, totalPages: Math.ceil(total / limit) })
}

export async function PUT(req: Request) {
  const { session, error } = await requireAuth()
  if (error) return error

  const { tenantId, id, all } = await req.json()
  if (!tenantId) return NextResponse.json({ error: "tenantId harus diisi" }, { status: 400 })

  const hasAccess = await checkAccess(tenantId, session.user.id, session.user.isSuperAdmin)
  if (!hasAccess) return NextResponse.json({ error: "Tidak punya izin" }, { status: 403 })

  if (all) {
    await db.contactSubmission.updateMany({ where: { tenantId }, data: { isRead: true } })
  } else if (id) {
    await db.contactSubmission.updateMany({ where: { id, tenantId }, data: { isRead: true } })
  }

  return NextResponse.json({ message: "OK" })
}

export async function DELETE(req: Request) {
  const { session, error } = await requireAuth()
  if (error) return error

  const { tenantId, id } = await req.json()
  if (!tenantId || !id) return NextResponse.json({ error: "tenantId dan id harus diisi" }, { status: 400 })

  const hasAccess = await checkAccess(tenantId, session.user.id, session.user.isSuperAdmin)
  if (!hasAccess) return NextResponse.json({ error: "Tidak punya izin" }, { status: 403 })

  const result = await db.contactSubmission.deleteMany({ where: { id, tenantId } })
  if (result.count === 0) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 })
  return NextResponse.json({ message: "Submission dihapus" })
}
