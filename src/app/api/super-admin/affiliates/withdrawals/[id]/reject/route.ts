import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const withdrawal = await db.affiliateWithdrawal.findUnique({
      where: { id: params.id }
    })

    if (!withdrawal) {
      return NextResponse.json({ error: "Penarikan tidak ditemukan" }, { status: 404 })
    }

    if (withdrawal.status !== "PENDING") {
      return NextResponse.json({ error: "Hanya penarikan dengan status PENDING yang bisa ditolak" }, { status: 400 })
    }

    const { notes } = await req.json().catch(() => ({}))

    await db.affiliateWithdrawal.update({
      where: { id: params.id },
      data: {
        status: "FAILED", // or REJECTED depending on your enums, I'll use FAILED to match payment conventions
        notes: notes || "Ditolak oleh Super Admin",
        processedAt: new Date(),
      }
    })

    return NextResponse.json({
      success: true,
      message: "Permintaan penarikan berhasil ditolak",
    })
  } catch (error) {
    return NextResponse.json({ error: "Gagal memproses penolakan" }, { status: 500 })
  }
}
