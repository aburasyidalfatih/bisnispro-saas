import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { eventSchema } from "@/lib/validations/event"
import { parseBody } from "@/lib/api-utils"
import { z } from "zod"
import { invalidatePublicTenantCache } from "@/features/tenant/services/tenant-public.service"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  if (!tenantId) return NextResponse.json({ error: "tenantId harus diisi" }, { status: 400 })

  const event = await db.event.findFirst({
    where: { id, tenantId },
  })

  if (!event) return NextResponse.json({ error: "Acara tidak ditemukan" }, { status: 404 })

  return NextResponse.json(event)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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
      return NextResponse.json({ error: "Tidak punya izin untuk mengubah acara" }, { status: 403 })
    }
  }

  const event = await db.event.updateMany({
    where: { id, tenantId },
    data
  })

  if (event.count === 0) {
     return NextResponse.json({ error: "Acara tidak ditemukan atau gagal diupdate" }, { status: 404 })
  }

  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) await invalidatePublicTenantCache(tenant.slug)

  return NextResponse.json({ message: "Acara berhasil diperbarui" })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  if (!tenantId) return NextResponse.json({ error: "tenantId harus diisi" }, { status: 400 })

  const isSuperAdmin = session.user.isSuperAdmin
  if (!isSuperAdmin) {
    const tu = await db.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId, userId: session.user.id } },
    })
    const allowedRoles = ["owner", "admin", "operator"]
    if (!tu || !allowedRoles.includes(tu.role)) {
      return NextResponse.json({ error: "Tidak punya izin untuk menghapus acara" }, { status: 403 })
    }
  }

  const result = await db.event.deleteMany({
    where: { id, tenantId }
  })

  if (result.count === 0) {
    return NextResponse.json({ error: "Acara tidak ditemukan" }, { status: 404 })
  }

  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) await invalidatePublicTenantCache(tenant.slug)

  return NextResponse.json({ message: "Acara berhasil dihapus" })
}
