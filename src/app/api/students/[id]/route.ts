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
    // 1. Cek apakah ada data operasional yang terikat
    const [
      attendanceCount, canteenCount, gradeCount,
      disciplineCount, cbtCount, invoiceCount
    ] = await Promise.all([
      db.attendanceRecord.count({ where: { studentId: id } }),
      db.canteenOrder.count({ where: { studentId: id } }),
      db.grade.count({ where: { studentId: id } }),
      db.disciplineRecord.count({ where: { studentId: id } }),
      db.cbtSession.count({ where: { studentId: id } }),
      db.invoice.count({ where: { studentId: id } })
    ])

    const hasData = attendanceCount > 0 || canteenCount > 0 || gradeCount > 0 || 
                    disciplineCount > 0 || cbtCount > 0 || invoiceCount > 0

    if (hasData) {
      return NextResponse.json({ 
        error: "Siswa tidak dapat dihapus karena sudah memiliki riwayat data (absensi, nilai, tagihan, dll). Silakan ubah status menjadi Nonaktif jika siswa sudah lulus/pindah." 
      }, { status: 400 })
    }

    // 2. Jika aman (hanya sebatas daftar/formulir), lakukan hard delete
    await db.$transaction(async (tx) => {
      // Hapus data permit/journal yang mungkin terselip
      await tx.attendancePermit.deleteMany({ where: { studentId: id } })
      await tx.journalPresence.deleteMany({ where: { studentId: id } })
      await tx.cbtAnswer.deleteMany({ where: { studentId: id } })

      // Hapus data Wallet & Orang Tua (Cascade biasanya, tapi lebih aman eksplisit)
      await tx.walletAccount.deleteMany({ where: { studentId: id } })
      await tx.studentParent.deleteMany({ where: { studentId: id } })

      // Eksekusi hard delete siswa
      await tx.student.delete({ where: { id } })

      // Jika ada akun login terikat, cabut dari tenant
      if (student.userId) {
        await tx.tenantUser.deleteMany({ where: { tenantId, userId: student.userId, role: 'siswa' } })
      }
    })

    return NextResponse.json({ message: "Data siswa berhasil dihapus permanen" })
  } catch (err: any) {
    return NextResponse.json({ error: "Gagal menghapus siswa: " + err.message }, { status: 500 })
  }
}
