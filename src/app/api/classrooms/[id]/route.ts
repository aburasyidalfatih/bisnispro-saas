import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireTenantMembership } from "@/lib/api-utils"
import { auth } from "@/lib/auth"
import { z } from "zod"

const classroomSchema = z.object({
  tenantId: z.string(),
  name: z.string().min(1),
  level: z.string().optional(),
  capacity: z.number().default(30),
  waliKelasId: z.string().optional(),
  isActive: z.boolean().default(true),
})

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  if (!tenantId) return NextResponse.json({ error: "tenantId diperlukan" }, { status: 400 })
  const { error } = await requireTenantMembership(tenantId)
  if (error) return error

  const classroom = await db.classroom.findFirst({
    where: { id, tenantId },
    include: {
      waliKelas: { select: { id: true, name: true } },
      students: {
        where: { isActive: true },
        include: { walletAccount: { select: { balance: true } } },
        orderBy: { name: "asc" },
      },
      _count: { select: { students: { where: { isActive: true } } } },
    },
  })

  if (!classroom) return NextResponse.json({ error: "Kelas tidak ditemukan" }, { status: 404 })
  return NextResponse.json(classroom)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { tenantId, ...data } = body

  const record = await db.classroom.findUnique({ where: { id } })
  if (!record) return NextResponse.json({ error: "Not Found" }, { status: 404 })
  const { error } = await requireTenantMembership(record.tenantId)
  if (error) return error

  const classroom = await db.classroom.update({ where: { id }, data })
  return NextResponse.json(classroom)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const record = await db.classroom.findUnique({ where: { id } })
  if (!record) return NextResponse.json({ error: "Not Found" }, { status: 404 })
  const { error } = await requireTenantMembership(record.tenantId)
  if (error) return error

  // Pindahkan siswa ke tanpa kelas sebelum hapus
  await db.student.updateMany({ where: { classroomId: id, tenantId: record.tenantId }, data: { classroomId: null } })
  await db.classroom.delete({ where: { id } })
  return NextResponse.json({ message: "Kelas dihapus" })
}
