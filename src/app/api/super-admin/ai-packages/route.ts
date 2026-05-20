import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"
import { logger } from "@/lib/logger"

const aiTokenPackageSchema = z.object({
  name: z.string().min(1, "Nama paket harus diisi"),
  description: z.string().optional().nullable(),
  price: z.number().min(0).default(0),
  tokens: z.number().min(1, "Jumlah token harus lebih dari 0"),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const packages = await db.aiTokenPackage.findMany({
    orderBy: { sortOrder: "asc" }
  })
  
  return NextResponse.json(packages)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const body = await req.json()
    const validated = aiTokenPackageSchema.parse(body)
    
    const tokenPackage = await db.aiTokenPackage.create({
      data: validated
    })

    return NextResponse.json(tokenPackage)
  } catch (error) {
    logger.error("AI Token Package create failed", error, { path: "/api/super-admin/ai-packages" })
    return NextResponse.json({ error: "Gagal membuat paket token AI" }, { status: 400 })
  }
}

export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const body = await req.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 })
    
    const validated = aiTokenPackageSchema.parse(data)
    
    const tokenPackage = await db.aiTokenPackage.update({
      where: { id },
      data: validated
    })

    return NextResponse.json(tokenPackage)
  } catch (error) {
    logger.error("AI Token Package update failed", error, { path: "/api/super-admin/ai-packages" })
    return NextResponse.json({ error: "Gagal memperbarui paket token AI" }, { status: 400 })
  }
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 })

    await db.aiTokenPackage.delete({ where: { id } })
    return NextResponse.json({ message: "Paket token AI dihapus" })
  } catch (error) {
    logger.error("AI Token Package delete failed", error, { path: "/api/super-admin/ai-packages" })
    return NextResponse.json({ error: "Gagal menghapus paket token AI" }, { status: 400 })
  }
}
