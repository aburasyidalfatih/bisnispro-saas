import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"
import { logger } from "@/lib/logger"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  if (!tenantId) return NextResponse.json({ error: "tenantId harus diisi" }, { status: 400 })

  const facilities = await db.facility.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(facilities)
}

export async function POST(req: Request) {
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
        return NextResponse.json({ error: "Tidak punya izin untuk menambah fasilitas" }, { status: 403 })
      }
    }

    const facility = await db.facility.create({
      data: {
        ...data,
        tenantId,
      }
    })

    return NextResponse.json({ message: "Fasilitas berhasil ditambahkan", facility })
  } catch (error) {
    logger.error("Facility create failed", error, { path: "/api/tenant/facilities" })
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
