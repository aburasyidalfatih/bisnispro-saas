import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params;

  try {
    const withdrawal = await db.affiliateWithdrawal.findUnique({
      where: { id: id },
      include: { affiliate: true }
    })

    if (!withdrawal) {
      return NextResponse.json({ error: "Penarikan tidak ditemukan" }, { status: 404 })
    }

    if (withdrawal.status !== "PENDING") {
      return NextResponse.json({ error: "Hanya penarikan dengan status PENDING yang bisa disetujui" }, { status: 400 })
    }

    if (withdrawal.affiliate.balance < withdrawal.amount) {
      return NextResponse.json({ error: "Saldo afiliasi tidak mencukupi untuk penarikan ini" }, { status: 400 })
    }

    const { receiptUrl } = await req.json().catch(() => ({}))

    // DB Transaction
    await db.$transaction([
      db.affiliateWithdrawal.update({
        where: { id: id },
        data: {
          status: "PAID",
          processedAt: new Date(),
          receiptUrl: receiptUrl || null
        }
      }),
      db.affiliateProfile.update({
        where: { id: withdrawal.affiliateId },
        data: {
          balance: { decrement: withdrawal.amount }
        }
      })
    ])

    return NextResponse.json({
      success: true,
      message: "Penarikan berhasil disetujui dan saldo dipotong",
    })
  } catch (error) {
    return NextResponse.json({ error: "Gagal memproses persetujuan" }, { status: 500 })
  }
}
