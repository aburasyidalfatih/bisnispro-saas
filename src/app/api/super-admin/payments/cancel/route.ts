import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { paymentId } = await req.json()
    if (!paymentId) {
      return NextResponse.json({ error: "paymentId wajib diisi" }, { status: 400 })
    }

    const payment = await db.payment.findUnique({
      where: { id: paymentId },
    })

    if (!payment) {
      return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 })
    }

    if (payment.status !== "pending") {
      return NextResponse.json({ error: "Hanya transaksi pending yang bisa dibatalkan" }, { status: 400 })
    }

    await db.payment.update({
      where: { id: paymentId },
      data: {
        status: "failed",
      },
    })

    return NextResponse.json({
      success: true,
      message: "Transaksi berhasil dibatalkan",
    })
  } catch (error) {
    logger.error("Cancel payment failed", error, { path: "/api/super-admin/payments/cancel" })
    return NextResponse.json({ error: "Terjadi kesalahan saat membatalkan pembayaran" }, { status: 500 })
  }
}
