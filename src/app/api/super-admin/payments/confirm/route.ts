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

    // Ambil data payment + tenant
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: { tenant: true, discountCode: true },
    })

    if (!payment) {
      return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 })
    }

    if (payment.status === "paid") {
      return NextResponse.json({ error: "Transaksi sudah dikonfirmasi sebelumnya" }, { status: 409 })
    }

    // Ambil jumlah siswa dan tipe pembayaran dari metadata
    const meta = payment.metadata as any
    const studentCount = meta?.studentCount || 0
    const isAddon = meta?.type === "ADDON_QUOTA"
    const isAiAddon = meta?.type === "AI_QUOTA"

    // Hitung masa aktif: 1 tahun dari sekarang (HANYA untuk UPGRADE/RENEWAL)
    let expiresAt = new Date()
    if (!isAddon && !isAiAddon) {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1)
      if (payment.discountCode && payment.discountCode.bonusMonths > 0) {
        expiresAt.setMonth(expiresAt.getMonth() + payment.discountCode.bonusMonths)
      }
    }

    // Tenant update payload
    let tenantUpdateData: any = { isActive: true }
    if (isAiAddon) {
      tenantUpdateData.aiTokens = { increment: meta?.aiTokens || 0 }
    } else if (isAddon) {
      tenantUpdateData.plan = payment.plan || "pro"
      tenantUpdateData.studentQuota = { increment: studentCount }
    } else {
      tenantUpdateData.plan = payment.plan || "pro"
      // Untuk renewal: pertahankan kuota tertinggi (jangan timpa addon)
      if (studentCount > 0) {
        const currentQuota = payment.tenant.studentQuota || 0
        tenantUpdateData.studentQuota = Math.max(currentQuota, studentCount)
      }
      tenantUpdateData.expiresAt = expiresAt
    }

    // Jalankan update secara transaksional
    const transactionOperations: any[] = [
      // 1. Update status payment
      db.payment.update({
        where: { id: paymentId },
        data: {
          status: "paid",
          paidAt: new Date(),
        },
      }),
      // 2. Upgrade tenant ke PRO / Tambah Kuota
      db.tenant.update({
        where: { id: payment.tenantId },
        data: tenantUpdateData,
      }),
    ]

    // 3. Berikan Komisi ke Afiliasi (20%) jika tenant mendaftar via referal
    if (payment.tenant.affiliateId) {
      const commissionAmount = payment.amount * 0.20
      transactionOperations.push(
        db.affiliateCommission.create({
          data: {
            affiliateId: payment.tenant.affiliateId,
            tenantId: payment.tenantId,
            paymentId: payment.id,
            amount: commissionAmount,
            status: "PAID"
          }
        })
      )
      transactionOperations.push(
        db.affiliateProfile.update({
          where: { id: payment.tenant.affiliateId },
          data: {
            balance: { increment: commissionAmount },
            totalEarnings: { increment: commissionAmount }
          }
        })
      )
    }

    await db.$transaction(transactionOperations)

    // Kirim notifikasi billing (async, non-blocking)
    import("@/features/finance/services/billing-notification.service").then(async ({ notifyPaymentConfirmed, notifyAffiliateCommission }) => {
      // Notif ke tenant: pembayaran dikonfirmasi
      notifyPaymentConfirmed(paymentId).catch(() => {})

      // Notif ke afiliasi: komisi masuk
      if (payment.tenant.affiliateId) {
        const commissionAmount = payment.amount * 0.20
        notifyAffiliateCommission(payment.tenant.affiliateId, commissionAmount, payment.tenant.name).catch(() => {})
      }
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      message: isAddon 
        ? `Berhasil menambah ${studentCount} kuota siswa untuk Tenant "${payment.tenant.name}".`
        : `Tenant "${payment.tenant.name}" berhasil diupgrade ke ${payment.plan?.toUpperCase() || 'PAKET BARU'} hingga ${expiresAt.toLocaleDateString("id-ID")}.`,
    })
  } catch (error) {
    logger.error("Confirm payment failed", error, { path: "/api/super-admin/payments/confirm" })
    return NextResponse.json({ error: "Terjadi kesalahan saat konfirmasi pembayaran" }, { status: 500 })
  }
}
