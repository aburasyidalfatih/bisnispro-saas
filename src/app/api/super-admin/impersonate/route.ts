import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

// POST: mulai impersonate tenant
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { impersonateTenantSchema } = await import("@/features/tenant/schemas/tenant.schema")
  const { parseBody } = await import("@/lib/api-utils")
  const parsed = await parseBody(req, impersonateTenantSchema)
  if (parsed.error) return parsed.error
  const { tenantId } = parsed.data

  // Cari tenant dan owner-nya
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    include: {
      users: {
        where: { role: "owner" },
        include: { user: true },
        take: 1,
      },
    },
  })

  if (!tenant) return NextResponse.json({ error: "Tenant tidak ditemukan" }, { status: 404 })

  const owner = tenant.users[0]?.user
  if (!owner) return NextResponse.json({ error: "Tenant tidak punya owner" }, { status: 400 })

  // Audit log: catat impersonation start
  await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: "IMPERSONATE_START",
      entity: "Tenant",
      entityId: tenant.id,
      newData: {
        tenantSlug: tenant.slug,
        tenantName: tenant.name,
        impersonatedAs: owner.email,
      },
      ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      userAgent: req.headers.get("user-agent") || null,
    },
  })

  logger.info("Super admin impersonation started", {
    adminId: session.user.id,
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
  })

  const response = NextResponse.json({
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    tenantName: tenant.name,
    ownerId: owner.id,
    ownerName: owner.name,
    ownerEmail: owner.email,
  })

  response.cookies.set("impersonate-tenant", tenant.slug, {
    path: "/",
    maxAge: 60 * 60,
    sameSite: "lax",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
  })
  response.cookies.set("impersonate-by", session.user.id, {
    path: "/",
    maxAge: 60 * 60,
    sameSite: "lax",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
  })

  return response
}

// DELETE: stop impersonate
export async function DELETE(req: Request) {
  const session = await auth()

  // Audit log: catat impersonation stop
  if (session?.user?.id) {
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "IMPERSONATE_STOP",
        entity: "Tenant",
        ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
        userAgent: req.headers.get("user-agent") || null,
      },
    })

    logger.info("Super admin impersonation stopped", {
      adminId: session.user.id,
    })
  }

  const response = NextResponse.json({ message: "Impersonate dihentikan" })
  response.cookies.delete("impersonate-tenant")
  response.cookies.delete("impersonate-by")
  return response
}
