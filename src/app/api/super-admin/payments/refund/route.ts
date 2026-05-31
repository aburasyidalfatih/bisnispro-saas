import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { invalidatePublicTenantCache } from "@/features/tenant/services/tenant-public.service"

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
      include: { tenant: true }
    })

    if (!payment) {
      return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 })
    }

    if (payment.status !== "paid") {
      return NextResponse.json({ error: "Hanya transaksi Berhasil yang bisa di-refund/dibatalkan" }, { status: 400 })
    }

    // 1. Update status transaksi menjadi refunded
    await db.payment.update({
      where: { id: paymentId },
      data: {
        status: "refunded",
      },
    })

    // 2. Kembalikan tenant ke paket free dan reset quota AI/Student
    if (payment.tenant) {
      await db.tenant.update({
        where: { id: payment.tenantId },
        data: {
          plan: "free",
          planId: null,
          expiresAt: null,
          // Opsional: Jika ingin mengembalikan AI tokens / quota siswa ke default, bisa di sini.
          // Untuk amannya, biarkan mereka sesuai bawaan paket free (otomatis dilimit di logic API nanti)
        }
      })

      // 3. Bersihkan cache publik agar perubahan instan
      if (payment.tenant.slug) {
        await invalidatePublicTenantCache(payment.tenant.slug)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Transaksi berhasil dibatalkan (Refunded) dan paket Tenant kembali ke Free.",
    })
  } catch (error) {
    logger.error("Refund payment failed", error, { path: "/api/super-admin/payments/refund" })
    return NextResponse.json({ error: "Terjadi kesalahan saat membatalkan transaksi" }, { status: 500 })
  }
}
