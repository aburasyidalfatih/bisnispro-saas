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

  const documents = await db.document.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(documents)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const schema = z.object({
      tenantId: z.string().min(1),
      title: z.string().min(1),
      description: z.string().optional().nullable(),
      fileUrl: z.string(),
      mimeType: z.string(),
      size: z.number().int(),
      type: z.string().default("UNDUHAN_UMUM"),
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
      const allowedRoles = ["owner", "admin", "operator", "teacher"]
      if (!tu || !allowedRoles.includes(tu.role)) {
        return NextResponse.json({ error: "Tidak punya izin untuk mengunggah dokumen" }, { status: 403 })
      }
    }

    const document = await db.document.create({
      data: {
        ...data,
        tenantId,
        uploaderId: session.user.id,
      }
    })

    return NextResponse.json({ message: "Dokumen berhasil diunggah", document })
  } catch (error) {
    logger.error("Document upload failed", error, { path: "/api/tenant/documents" })
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
