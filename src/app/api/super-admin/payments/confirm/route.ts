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

    // Ambil jumlah klien dan tipe pembayaran dari metadata
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

    // Fetch plan details if it's a regular plan upgrade
    let subscriptionPlan = null
    if (payment.plan && !isAddon && !isAiAddon) {
      subscriptionPlan = await db.subscriptionPlan.findUnique({
        where: { slug: payment.plan }
      })
    }
    const transactionOperations: any[] = []

    if (payment.plan === "AI_TOKEN_USER") {
      // 1. Update status payment
      transactionOperations.push(
        db.payment.update({
          where: { id: paymentId },
          data: {
            status: "paid",
            paidAt: new Date(),
          },
        })
      )
      
      // 2. Tambah token ke User
      if (meta?.userId && meta?.aiTokens) {
        transactionOperations.push(
          db.user.update({
            where: { id: meta.userId },
            data: { aiTokens: { increment: Number(meta.aiTokens) } }
          })
        )
      }
    } else {
      // Tenant update payload
      let tenantUpdateData: any = { isActive: true }
      if (isAiAddon) {
        tenantUpdateData.aiTokens = { increment: meta?.aiTokens || 0 }
      } else if (isAddon) {
        tenantUpdateData.plan = payment.plan || "pro"
        tenantUpdateData.employeeCount = { increment: studentCount }
      } else {
        tenantUpdateData.plan = payment.plan || "pro"
        
        if (subscriptionPlan) {
          tenantUpdateData.planId = subscriptionPlan.id
          if (subscriptionPlan.monthlyAiTokens > 0) {
            tenantUpdateData.aiTokens = { increment: subscriptionPlan.monthlyAiTokens }
          }
        }

        // Untuk renewal: pertahankan kuota tertinggi (jangan timpa addon)
        if (studentCount > 0) {
          const currentQuota = payment.tenant.employeeCount || 0
          tenantUpdateData.employeeCount = Math.max(currentQuota, studentCount)
        }
        tenantUpdateData.expiresAt = expiresAt
      }

      // Jalankan update secara transaksional
      transactionOperations.push(
        // 1. Update status payment
        db.payment.update({
          where: { id: paymentId },
          data: {
            status: "paid",
            paidAt: new Date(),
          },
        })
      )
      transactionOperations.push(
        // 2. Upgrade tenant ke PRO / Tambah Kuota
        db.tenant.update({
          where: { id: payment.tenantId },
          data: tenantUpdateData,
        })
      )

      // 3. Berikan Komisi ke Afiliasi jika ada (Referal & Cashback)
      const settingsDoc = await db.platformSetting.findUnique({ where: { key: "AFFILIATE_COMMISSION_PERCENTAGE" } })
      const commissionPct = settingsDoc ? parseInt(settingsDoc.value) / 100 : 0.20;
      
      let cashbackAmount = 0;
      if (payment.discountCode && payment.discountCode.type === "CASHBACK") {
        if (payment.discountCode.cashbackAmount > 0) {
          cashbackAmount = payment.discountCode.cashbackAmount;
        } else if (payment.discountCode.percentage > 0) {
          cashbackAmount = Math.round(payment.amount * (payment.discountCode.percentage / 100));
        }
      }
      
      const netAmountForCommission = Math.max(0, payment.amount - cashbackAmount);
      const commissionAmount = Math.round(netAmountForCommission * commissionPct);
      
      // 3a. Tentukan siapa penerima cashback
      let cashbackAffiliateId: string | null = null;
      if (payment.discountCode && payment.discountCode.type === "CASHBACK") {
        cashbackAffiliateId = payment.discountCode.affiliateId || payment.tenant.affiliateId || null;
      }
      
      // 3b. Berikan komisi referal (jika ada dan BUKAN orang yang sama dengan penerima cashback)
      if (payment.tenant.affiliateId && payment.tenant.affiliateId !== cashbackAffiliateId && commissionAmount > 0) {
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
      
      // 3c. Berikan komisi cashback (jika ada)
      if (payment.discountCode && payment.discountCode.type === "CASHBACK" && cashbackAmount > 0) {
        if (cashbackAffiliateId) {
          transactionOperations.push(
            db.affiliateCommission.create({
              data: {
                affiliateId: cashbackAffiliateId,
                tenantId: payment.tenantId,
                paymentId: payment.id,
                amount: cashbackAmount,
                status: "PAID"
              }
            })
          )
          transactionOperations.push(
            db.affiliateProfile.update({
              where: { id: cashbackAffiliateId },
              data: {
                balance: { increment: cashbackAmount },
                totalEarnings: { increment: cashbackAmount }
              }
            })
          )
        }
        
        // Kunci kode cashback
        if (!payment.discountCode.linkedTenantId) {
          transactionOperations.push(
            db.discountCode.update({
              where: { id: payment.discountCode.id },
              data: { linkedTenantId: payment.tenantId }
            })
          )
        }
      }
    }

    await db.$transaction(transactionOperations)

    // Kirim notifikasi billing (async, non-blocking)
    import("@/features/finance/services/billing-notification.service").then(async ({ notifyPaymentConfirmed, notifyAffiliateCommission }) => {
      // Notif ke tenant: pembayaran dikonfirmasi
      notifyPaymentConfirmed(paymentId).catch(() => {})

      // Notif ke afiliasi: komisi masuk
      if (payment.tenant.affiliateId) {
      import("@/lib/db").then(({ db }) => {
        db.platformSetting.findUnique({ where: { key: "AFFILIATE_COMMISSION_PERCENTAGE" } }).then(settingsDoc => {
          const commissionPct = settingsDoc ? parseInt(settingsDoc.value) / 100 : 0.20;
          const commissionAmount = payment.amount * commissionPct;
          notifyAffiliateCommission(payment.tenant.affiliateId as string, commissionAmount, payment.tenant.name).catch(() => {})
        })
      })
      }
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      message: payment.plan === "AI_TOKEN_USER"
        ? `Berhasil mengkonfirmasi Top-Up AI Token untuk Staf.`
        : isAddon 
          ? `Berhasil menambah ${studentCount} kuota klien untuk Tenant "${payment.tenant.name}".`
          : `Tenant "${payment.tenant.name}" berhasil diupgrade ke ${payment.plan?.toUpperCase() || 'PAKET BARU'} hingga ${expiresAt.toLocaleDateString("id-ID")}.`,
    })
  } catch (error) {
    logger.error("Confirm payment failed", error, { path: "/api/super-admin/payments/confirm" })
    return NextResponse.json({ error: "Terjadi kesalahan saat konfirmasi pembayaran" }, { status: 500 })
  }
}






