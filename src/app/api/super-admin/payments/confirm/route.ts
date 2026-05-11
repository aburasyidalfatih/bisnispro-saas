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
      include: { tenant: true },
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

    // Hitung masa aktif: 1 tahun dari sekarang (HANYA untuk UPGRADE/RENEWAL)
    let expiresAt = new Date()
    if (!isAddon) {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1)
    }

    // Jalankan update secara transaksional
    await db.$transaction([
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
        data: {
          plan: "pro",
          isActive: true,
          ...(isAddon
            ? {
                studentQuota: { increment: studentCount },
                // expiresAt tidak diubah
              }
            : {
                studentQuota: studentCount > 0 ? studentCount : undefined,
                expiresAt,
              }),
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      message: isAddon 
        ? `Berhasil menambah ${studentCount} kuota siswa untuk Tenant "${payment.tenant.name}".`
        : `Tenant "${payment.tenant.name}" berhasil diupgrade ke PRO hingga ${expiresAt.toLocaleDateString("id-ID")}.`,
    })
  } catch (error) {
    logger.error("Confirm payment failed", error, { path: "/api/super-admin/payments/confirm" })
    return NextResponse.json({ error: "Terjadi kesalahan saat konfirmasi pembayaran" }, { status: 500 })
  }
}
