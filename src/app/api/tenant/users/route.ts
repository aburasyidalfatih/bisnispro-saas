import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  if (!tenantId) return NextResponse.json({ error: "tenantId harus diisi" }, { status: 400 })

  const { error } = await (await import("@/lib/api-utils")).requireTenantMembership(tenantId)
  if (error) return error

  const role = url.searchParams.get("role")

  try {
    const { listTenantUsers } = await import("@/features/tenant/services/user-management.service")
    const result = await listTenantUsers(tenantId, role)
    return NextResponse.json({ data: result })
  } catch (error: any) {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { addUserSchema } = await import("@/features/tenant/schemas/tenant.schema")
    const { parseBody } = await import("@/lib/api-utils")
    const parsed = await parseBody(req, addUserSchema)
    if (parsed.error) return parsed.error

    const { addUserToTenant } = await import("@/features/tenant/services/user-management.service")
    const result = await addUserToTenant({
      ...parsed.data,
      callerUserId: session.user.id,
      isSuperAdmin: session.user.isSuperAdmin,
    })
    return NextResponse.json(result)
  } catch (error: any) {
    const msg = error.message || "Terjadi kesalahan"
    const status = msg.includes("izin") ? 403 : msg.includes("sudah") ? 400 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { editUserSchema } = await import("@/features/tenant/schemas/tenant.schema")
    const { parseBody } = await import("@/lib/api-utils")
    const parsed = await parseBody(req, editUserSchema)
    if (parsed.error) return parsed.error

    const { editTenantUser } = await import("@/features/tenant/services/user-management.service")
    const result = await editTenantUser({
      ...parsed.data,
      callerUserId: session.user.id,
      isSuperAdmin: session.user.isSuperAdmin,
    })
    return NextResponse.json(result)
  } catch (error: any) {
    const msg = error.message || "Terjadi kesalahan"
    const status = msg.includes("izin") ? 403 : msg.includes("sudah") || msg.includes("tidak ditemukan") ? 400 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { deleteUserSchema } = await import("@/features/tenant/schemas/tenant.schema")
    const { parseBody } = await import("@/lib/api-utils")
    const parsed = await parseBody(req, deleteUserSchema)
    if (parsed.error) return parsed.error

    const { deleteTenantUser } = await import("@/features/tenant/services/user-management.service")
    const result = await deleteTenantUser(parsed.data.tenantUserId, session.user.id, session.user.isSuperAdmin)
    return NextResponse.json(result)
  } catch (error: any) {
    const msg = error.message || "Terjadi kesalahan"
    const status = msg.includes("izin") || msg.includes("Owner") ? 403 : msg.includes("tidak ditemukan") ? 404 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
