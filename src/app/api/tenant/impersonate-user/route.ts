import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

// POST: tenant admin login sebagai user
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Cek apakah fitur diizinkan oleh super admin
  const setting = await db.platformSetting.findUnique({ where: { key: "allow_impersonate_user" } })
  if (setting?.value !== "true") {
    return NextResponse.json({ error: "Fitur login sebagai user dinonaktifkan oleh super admin" }, { status: 403 })
  }

  const { impersonateUserSchema } = await import("@/features/tenant/schemas/tenant.schema")
  const { parseBody } = await import("@/lib/api-utils")
  const parsed = await parseBody(req, impersonateUserSchema)
  if (parsed.error) return parsed.error
  const { userId, tenantId } = parsed.data

  // Hanya super admin yang diizinkan menggunakan fitur impersonate user
  if (!session.user.isSuperAdmin) {
    return NextResponse.json({ error: "Fitur ini dinonaktifkan untuk admin tenant demi menjaga kepercayaan privasi user." }, { status: 403 })
  }

  // Cari target user
  const targetTu = await db.tenantUser.findUnique({
    where: { tenantId_userId: { tenantId, userId } },
    include: { user: { select: { name: true, email: true } }, tenant: { select: { slug: true } } },
  })
  if (!targetTu) return NextResponse.json({ error: "User tidak ditemukan di tenant ini" }, { status: 404 })

  const response = NextResponse.json({
    userName: targetTu.user.name,
    userEmail: targetTu.user.email,
    tenantSlug: targetTu.tenant.slug,
    role: targetTu.role,
  })

  response.cookies.set("impersonate-user", targetTu.user.name, { path: "/", maxAge: 3600, sameSite: "lax" })
  response.cookies.set("impersonate-user-role", targetTu.role, { path: "/", maxAge: 3600, sameSite: "lax" })
  response.cookies.set("impersonate-by-admin", session.user.id, { path: "/", maxAge: 3600, sameSite: "lax" })

  return response
}

// DELETE: stop impersonate user
export async function DELETE() {
  const response = NextResponse.json({ message: "Impersonate user dihentikan" })
  response.cookies.delete("impersonate-user")
  response.cookies.delete("impersonate-user-role")
  response.cookies.delete("impersonate-by-admin")
  return response
}
