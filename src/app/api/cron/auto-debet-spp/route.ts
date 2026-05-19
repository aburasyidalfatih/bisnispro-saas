import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { startOfDay, endOfDay } from "date-fns"

export const dynamic = "force-dynamic"
export const maxDuration = 300

/**
 * Cron Job: Auto-Debet SPP
 * Dipanggil setiap hari oleh Vercel Cron / scheduler eksternal.
 * Memproses semua tagihan yang:
 *   1. isAutoDebet = true
 *   2. dueDate = hari ini (atau sudah lewat & belum bayar)
 *   3. status UNPAID / PARTIAL
 *   4. Siswa memiliki WalletAccount dengan saldo mencukupi
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (
    process.env.NODE_ENV === "production" &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { processAutoDebetSPP } = await import("@/features/finance/services/billing.service")
    const results = await processAutoDebetSPP()

    // TODO: Kirim notifikasi WA ke orang tua yang berhasil/gagal auto-debet

    return NextResponse.json({
      message: "Auto-debet SPP selesai",
      date: new Date().toISOString().split("T")[0],
      ...results,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: "Cron gagal", message: err.message },
      { status: 500 }
    )
  }
}
