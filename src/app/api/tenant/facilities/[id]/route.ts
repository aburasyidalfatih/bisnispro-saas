import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"
import { logger } from "@/lib/logger"

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  if (!tenantId) return NextResponse.json({ error: "tenantId harus diisi" }, { status: 400 })

  const facility = await db.facility.findUnique({
    where: { id: params.id, tenantId }
  })

  if (!facility) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(facility)
}

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const schema = z.object({
      tenantId: z.string().min(1),
      name: z.string().min(1),
      description: z.string().optional().nullable(),
      imageUrl: z.string().optional().nullable(),
      category: z.string().optional().nullable(),
      condition: z.string().optional().nullable(),
      access: z.string().optional().nullable(),
    })

    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      const messages = parsed.error.errors.map((e) => e.message).join(", ")
      return NextResponse.json({ error: messages || "Data tidak valid" }, { status: 400 })
    }

    const { tenantId, ...data } = parsed.data

    const isSuperAdmin = session.user.isSuperAdmin
    if (!isSuperAdmin) {
      const tu = await db.tenantUser.findUnique({
        where: { tenantId_userId: { tenantId, userId: session.user.id } },
      })
      const allowedRoles = ["owner", "admin", "operator"]
      if (!tu || !allowedRoles.includes(tu.role)) {
        return NextResponse.json({ error: "Tidak punya izin untuk mengubah fasilitas" }, { status: 403 })
      }
    }

    const facility = await db.facility.updateMany({
      where: {
        id: params.id,
        tenantId,
      },
      data
    })

    return NextResponse.json({ message: "Fasilitas berhasil diperbarui" })
  } catch (error) {
    logger.error("Facility update failed", error, { facilityId: params.id })
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
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
      return NextResponse.json({ error: "Tidak punya izin untuk menghapus fasilitas" }, { status: 403 })
    }
  }

  try {
    await db.facility.deleteMany({
      where: {
        id: params.id,
        tenantId,
      }
    })
    return NextResponse.json({ message: "Fasilitas berhasil dihapus" })
  } catch (error) {
    logger.error("Facility delete failed", error, { facilityId: params.id })
    return NextResponse.json({ error: "Gagal menghapus fasilitas" }, { status: 500 })
  }
}
