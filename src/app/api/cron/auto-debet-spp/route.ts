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

  const today = new Date()
  const results = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    errors: [] as string[],
  }

  try {
    // Ambil semua tagihan yang perlu di-auto-debet
    const invoices = await db.invoice.findMany({
      where: {
        isAutoDebet: true,
        deletedAt: null,
        dueDate: { lte: endOfDay(today) }, // Jatuh tempo hari ini atau sudah lewat
        status: { in: ["UNPAID", "PARTIAL"] },
      },
      include: {
        student: {
          include: {
            walletAccount: true,
          },
        },
      },
    })

    results.processed = invoices.length

    for (const invoice of invoices) {
      const wallet = invoice.student?.walletAccount
      const amountToPay = invoice.amountDue

      if (!wallet || wallet.balance < amountToPay) {
        results.skipped++
        continue // Lewati jika tidak ada wallet atau saldo kurang
      }

      try {
        await db.$transaction(async (tx) => {
          const newBalance = wallet.balance - amountToPay

          // 1. Debet Wallet
          await tx.walletAccount.update({
            where: { id: wallet.id },
            data: { balance: newBalance },
          })

          // 2. Catat WalletTransaction
          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              tenantId: invoice.tenantId,
              type: "PAYMENT",
              amount: amountToPay,
              balanceBefore: wallet.balance,
              balanceAfter: newBalance,
              referenceId: invoice.code,
              description: `[AUTO-DEBET] ${invoice.title}`,
              status: "SUCCESS",
            },
          })

          // 3. Buat InvoicePayment
          await tx.invoicePayment.create({
            data: {
              invoiceId: invoice.id,
              tenantId: invoice.tenantId,
              amount: amountToPay,
              method: "WALLET",
              status: "VERIFIED",
              verifiedAt: new Date(),
              verifiedBy: "SYSTEM_CRON",
              paidAt: new Date(),
              notes: "Auto-debet otomatis oleh sistem",
            },
          })

          // 4. Update Invoice status
          await tx.invoice.update({
            where: { id: invoice.id },
            data: {
              amountPaid: invoice.amountPaid + amountToPay,
              amountDue: 0,
              status: "PAID",
            },
          })

          // 5. Catat ke Cashflow
          await tx.cashflow.create({
            data: {
              tenantId: invoice.tenantId,
              type: "INCOME",
              category: "SPP",
              amount: amountToPay,
              description: `[AUTO] ${invoice.title} — ${invoice.student.name}`,
              referenceId: invoice.code,
            },
          })
        })

        results.succeeded++
      } catch (err: any) {
        results.failed++
        results.errors.push(`Invoice ${invoice.code}: ${err.message}`)
      }
    }

    // TODO: Kirim notifikasi WA ke orang tua yang berhasil/gagal auto-debet

    return NextResponse.json({
      message: "Auto-debet SPP selesai",
      date: today.toISOString().split("T")[0],
      ...results,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: "Cron gagal", message: err.message },
      { status: 500 }
    )
  }
}
