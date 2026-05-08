import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { requireTenantMembership } from "@/lib/api-utils"

/**
 * GET /api/canteen/scan?nisn=xxx&tenantId=xxx
 * Digunakan oleh panel kasir merchant untuk mengambil info siswa + saldo wallet
 * via scan QR Code. QR Code berisi NIS/NISN siswa.
 */
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const identifier = url.searchParams.get("q") // NISN, NIS, atau studentId
  const tenantId = url.searchParams.get("tenantId")

  if (!identifier || !tenantId) {
    return NextResponse.json({ error: "Parameter q dan tenantId diperlukan" }, { status: 400 })
  }

  const { error } = await requireTenantMembership(tenantId)
  if (error) return error

  const student = await db.student.findFirst({
    where: {
      tenantId,
      OR: [
        { id: identifier },
        { nis: identifier },
        { nisn: identifier },
      ],
    },
    include: {
      classroom: { select: { name: true } },
      walletAccount: {
        select: { id: true, balance: true, isActive: true },
      },
    },
  })

  if (!student) {
    return NextResponse.json({ error: "Siswa tidak ditemukan" }, { status: 404 })
  }

  if (!student.walletAccount) {
    return NextResponse.json({ error: "Siswa belum memiliki wallet aktif" }, { status: 404 })
  }

  if (!student.walletAccount.isActive) {
    return NextResponse.json({ error: "Wallet siswa dinonaktifkan" }, { status: 403 })
  }

  return NextResponse.json({
    student: {
      id: student.id,
      name: student.name,
      nis: student.nis,
      nisn: student.nisn,
      classroom: student.classroom?.name || "—",
      gender: student.gender,
    },
    wallet: {
      id: student.walletAccount.id,
      balance: student.walletAccount.balance,
      isActive: student.walletAccount.isActive,
    },
  })
}
