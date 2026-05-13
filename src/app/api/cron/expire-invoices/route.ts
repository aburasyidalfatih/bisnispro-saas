import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"

/**
 * Cron handler: otomatis expire invoice pending yang melewati jatuh tempo
 * dan kembalikan kuota kupon yang digunakan.
 * 
 * Panggil via: GET /api/cron/expire-invoices?key=SECRET
 */
export async function GET(req: Request) {
  // Simple auth via query key
  const { searchParams } = new URL(req.url)
  const key = searchParams.get("key")
  if (key !== (process.env.CRON_SECRET || "cron-secret-key")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const now = new Date()

    // Cari semua invoice pending yang sudah melewati expiredAt
    const expiredPayments = await db.payment.findMany({
      where: {
        status: "pending",
        expiredAt: { lt: now }
      },
      select: { id: true, discountCodeId: true, reference: true }
    })

    if (expiredPayments.length === 0) {
      return NextResponse.json({ message: "Tidak ada invoice expired", count: 0 })
    }

    // Proses setiap invoice expired
    const operations: any[] = []

    for (const payment of expiredPayments) {
      // Update status ke expired
      operations.push(
        db.payment.update({
          where: { id: payment.id },
          data: { status: "expired" }
        })
      )

      // Kembalikan kuota kupon jika ada
      if (payment.discountCodeId) {
        operations.push(
          db.discountCode.update({
            where: { id: payment.discountCodeId },
            data: { usedCount: { decrement: 1 } }
          })
        )
      }
    }

    await db.$transaction(operations)

    const refs = expiredPayments.map(p => p.reference)
    logger.info(`Auto-expired ${expiredPayments.length} invoices`, { references: refs })

    return NextResponse.json({
      message: `${expiredPayments.length} invoice berhasil di-expire`,
      count: expiredPayments.length,
      references: refs
    })
  } catch (error) {
    logger.error("Cron expire-invoices failed", error, { path: "/api/cron/expire-invoices" })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
