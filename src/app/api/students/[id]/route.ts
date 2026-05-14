import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireTenantMembership } from "@/lib/api-utils"
import { z } from "zod"

const studentSchema = z.object({
  tenantId: z.string(),
  name: z.string().min(1),
  nis: z.string().optional(),
  nisn: z.string().optional(),
  gender: z.enum(["L", "P"]).optional(),
  birthPlace: z.string().optional(),
  birthDate: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  fatherName: z.string().optional(),
  motherName: z.string().optional(),
  guardianName: z.string().optional(),
  classroomId: z.string().optional(),
  isActive: z.boolean().default(true),
})

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  if (!tenantId) return NextResponse.json({ error: "tenantId diperlukan" }, { status: 400 })
  const { error } = await requireTenantMembership(tenantId)
  if (error) return error

  const student = await db.student.findFirst({
    where: { id, tenantId },
    include: {
      classroom: true,
      walletAccount: { select: { id: true, balance: true, isActive: true } },
      parents: { include: { user: { select: { id: true, name: true, email: true, phone: true } } } },
      invoices: {
        where: { deletedAt: null },
        orderBy: { dueDate: "desc" },
        take: 5,
        select: { id: true, code: true, title: true, amount: true, status: true, dueDate: true },
      },
      _count: {
        select: {
          invoices: { where: { deletedAt: null } },
          attendanceRecords: true,
          canteenOrders: true,
        }
      }
    },
  })

  if (!student) return NextResponse.json({ error: "Siswa tidak ditemukan" }, { status: 404 })
  return NextResponse.json(student)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const parsed = studentSchema.partial().safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { tenantId, ...data } = parsed.data as any
  if (!tenantId) return NextResponse.json({ error: "tenantId diperlukan" }, { status: 400 })
  const { error } = await requireTenantMembership(tenantId)
  if (error) return error

  const student = await db.student.update({
    where: { id },
    data: {
      ...data,
      birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
    },
  })
  return NextResponse.json(student)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  if (!tenantId) return NextResponse.json({ error: "tenantId diperlukan" }, { status: 400 })
  const { error } = await requireTenantMembership(tenantId)
  if (error) return error

  const student = await db.student.findUnique({ where: { id, tenantId } })
  if (!student) return NextResponse.json({ error: "Siswa tidak ditemukan" }, { status: 404 })

  try {
    await db.$transaction(async (tx) => {
      // 1. Delete Attendance records
      await tx.attendanceRecord.deleteMany({ where: { studentId: id } })
      await tx.attendancePermit.deleteMany({ where: { studentId: id } })
      
      // 2. Delete Canteen related
      await tx.canteenOrder.deleteMany({ where: { studentId: id } })
      
      // 3. Delete Grades & Journals
      await tx.grade.deleteMany({ where: { studentId: id } })
      await tx.journalPresence.deleteMany({ where: { studentId: id } })
      
      // 4. Delete Discipline records
      await tx.disciplineRecord.deleteMany({ where: { studentId: id } })
      
      // 5. Delete CBT related
      await tx.cbtAnswer.deleteMany({ where: { studentId: id } })
      await tx.cbtSession.deleteMany({ where: { studentId: id } })

      // 6. Final student hard delete (Invoice, WalletAccount, StudentParent will cascade if schema allows, but Student is safe to delete now)
      await tx.student.delete({ where: { id } })

      // 7. Delete linked User Account from tenant if exists
      if (student.userId) {
        await tx.tenantUser.deleteMany({ where: { tenantId, userId: student.userId, role: 'siswa' } })
      }
    })

    return NextResponse.json({ message: "Siswa berhasil dihapus permanen beserta seluruh datanya" })
  } catch (err: any) {
    return NextResponse.json({ error: "Gagal menghapus siswa: " + err.message }, { status: 500 })
  }
}
