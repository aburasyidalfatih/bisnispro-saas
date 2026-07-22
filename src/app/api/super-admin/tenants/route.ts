import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const url = new URL(req.url)
  const page = Number(url.searchParams.get("page") || "1")
  const limit = Number(url.searchParams.get("limit") || "20")
  const search = url.searchParams.get("search") || ""
  const sort = url.searchParams.get("sort") || "createdAt"
  const order = url.searchParams.get("order") || "desc"
  const status = url.searchParams.get("status") || "all"

  try {
    const { getTenantsForSuperAdmin } = await import("@/features/super-admin/services/super-admin.service")
    const result = await getTenantsForSuperAdmin({ page, limit, search, sort, order, status: status !== "all" ? status : undefined })
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { deleteTenantSchema } = await import("@/features/super-admin/schemas/super-admin.schema")
    const { parseBody } = await import("@/lib/api-utils")
    const parsed = await parseBody(req, deleteTenantSchema)
    if (parsed.error) return parsed.error

    const { deleteTenantByAdmin } = await import("@/features/super-admin/services/super-admin.service")
    const result = await deleteTenantByAdmin(parsed.data.id)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal menghapus tenant" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ error: "ID Tenant diperlukan" }, { status: 400 })

    const { updateTenantByAdmin } = await import("@/features/super-admin/services/super-admin.service")
    const result = await updateTenantByAdmin(id, data)
    return NextResponse.json({ message: "Tenant berhasil diupdate", data: result.data })
  } catch (error: any) {
    const status = error.message?.includes("sudah digunakan") ? 400 : 500
    return NextResponse.json({ error: error.message || "Gagal mengupdate tenant" }, { status })
  }
}
