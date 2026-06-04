import { db, withTenant } from "@/lib/db"
import { logger } from "@/lib/logger"

// ==========================================
// DTOs
// ==========================================
export type WalletHistoryDTO = {
  wallet: { id: string; balance: number }
  data: any[]
  meta: { total: number; page: number; totalPages: number }
}

export type WalletSettingsDTO = {
  hasPin: boolean
  dailyLimit: number
}

// ==========================================
// Query: Riwayat Transaksi Wallet
// ==========================================
export async function getWalletHistory(userId: string, walletId?: string | null, page = 1): Promise<WalletHistoryDTO> {
  const take = 20

  let wallet: any
  if (walletId) {
    wallet = await db.walletAccount.findUnique({ where: { id: walletId } })
  } else {
    const parent = await db.studentParent.findFirst({
      where: { userId },
      include: { student: { include: { walletAccount: true } } },
    })
    wallet = parent?.student?.walletAccount
  }

  if (!wallet) throw new Error("Wallet tidak ditemukan")

  const [transactions, total] = await Promise.all([
    db.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * take,
      take,
    }),
    db.walletTransaction.count({ where: { walletId: wallet.id } }),
  ])

  return {
    wallet: { id: wallet.id, balance: wallet.balance },
    data: transactions,
    meta: { total, page, totalPages: Math.ceil(total / take) },
  }
}

// ==========================================
// Query: Pengaturan Wallet
// ==========================================
export async function getWalletSettings(userId: string): Promise<WalletSettingsDTO> {
  const parentRelation = await db.studentParent.findFirst({
    where: { userId },
    include: { student: { include: { walletAccount: true } } }
  })

  if (!parentRelation || !parentRelation.student.walletAccount) {
    throw new Error("Wallet tidak ditemukan")
  }

  const wallet = parentRelation.student.walletAccount
  return {
    hasPin: !!wallet.pin,
    dailyLimit: wallet.dailyLimit || 0
  }
}

// ==========================================
// Mutation: Update Pengaturan Wallet
// ==========================================
export async function updateWalletSettings(userId: string, pin?: string, dailyLimit?: number) {
  const parentRelation = await db.studentParent.findFirst({
    where: { userId },
    include: { student: { include: { walletAccount: true } } }
  })

  if (!parentRelation || !parentRelation.student.walletAccount) {
    throw new Error("Wallet tidak ditemukan")
  }

  const walletId = parentRelation.student.walletAccount.id

  await db.walletAccount.update({
    where: { id: walletId },
    data: {
      pin: pin && pin.length === 6 ? pin : undefined,
      dailyLimit: dailyLimit !== undefined ? Number(dailyLimit) : undefined
    }
  })

  return { success: true }
}

// ==========================================
// Mutation: Top-Up Manual via Bank Transfer
// ==========================================
export async function createManualTopup(params: {
  walletId: string
  tenantId: string
  amount: number
  methodIndex: number
  customerName: string
  customerEmail: string
}) {
  const tenantDb = withTenant(params.tenantId)
  const tenantData = await tenantDb.tenant.findUnique({
    where: { id: params.tenantId },
    select: { settings: true }
  })
  const manualBanks = (tenantData?.settings as any)?.manualBanks || []
  const selectedBank = manualBanks[params.methodIndex]

  if (!selectedBank) {
    throw new Error("Rekening manual tidak ditemukan")
  }

  const payment = await tenantDb.payment.create({
    data: {
      tenantId: params.tenantId,
      reference: `MANUAL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      amount: params.amount,
      method: `MANUAL_TRANSFER`,
      status: "UNPAID",
      plan: "WALLET_TOPUP",
      metadata: {
        walletId: params.walletId,
        customerName: params.customerName,
        customerEmail: params.customerEmail,
        bankName: selectedBank.bank,
        accountNumber: selectedBank.account,
        accountName: selectedBank.name,
        isManual: true
      }
    }
  })

  // Audit trail
  await tenantDb.auditLog.create({
    data: {
      tenantId: params.tenantId,
      action: "WALLET_TOPUP_CREATED",
      entity: "Wallet",
      newData: { paymentId: payment.id, amount: params.amount }
    }
  }).catch(() => {})

  return {
    message: "Transaksi manual berhasil dibuat",
    redirectUrl: `/ortu/wallet/topup/manual/${payment.id}`
  }
}

// ==========================================
// Mutation: Upload Bukti Pembayaran Manual
// ==========================================
export async function submitManualTopupProof(paymentId: string, proofUrl: string) {
  const payment = await db.payment.findUnique({ where: { id: paymentId } })
  if (!payment) throw new Error("Pembayaran tidak ditemukan")

  const tenantDb = withTenant(payment.tenantId)
  const currentMeta = payment.metadata as any
  await tenantDb.payment.update({
    where: { id: paymentId },
    data: {
      status: "PENDING_VERIFICATION",
      metadata: {
        ...currentMeta,
        proofUrl
      }
    }
  })

  // Audit trail
  await tenantDb.auditLog.create({
    data: {
      tenantId: payment.tenantId,
      action: "WALLET_TOPUP_PROOF_SUBMITTED",
      entity: "Wallet",
      newData: { paymentId, proofUrl }
    }
  }).catch(() => {})

  // Kirim notifikasi ke admin sekolah (async, non-blocking)
  import("@/features/notification/services/notification.service").then(({ notifyTenantAdmins }) => {
    notifyTenantAdmins(payment.tenantId, {
      title: "Verifikasi Top-Up Manual",
      message: `Ada pengajuan Top-Up manual senilai Rp ${payment.amount.toLocaleString("id-ID")} yang menunggu verifikasi Anda.`,
      type: "info"
    })
  }).catch(() => {})

  return { success: true, url: proofUrl }
}

// ==========================================
// Query: Verifikasi Kepemilikan Wallet
// ==========================================
export async function verifyWalletOwnership(walletId: string, userId: string) {
  const wallet = await db.walletAccount.findUnique({
    where: { id: walletId },
    include: {
      student: {
        include: {
          parents: {
            where: { userId }
          }
        }
      }
    }
  })

  if (!wallet || wallet.student.parents.length === 0) {
    throw new Error("Wallet tidak ditemukan atau Anda tidak memiliki akses")
  }

  return wallet
}

// ==========================================
// Query: Data Billing Dashboard
// ==========================================
export async function getBillingDashboardData(tenantId: string) {
  const { getPricingConfig } = await import("./billing.service")
  const tenantDb = withTenant(tenantId)

  const [tenant, pricing, proPlan, pendingPayment, platformSettings] = await Promise.all([
    tenantDb.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        plan: true,
        studentQuota: true,
        isActive: true,
        expiresAt: true,
        affiliateId: true
      }
    }),
    getPricingConfig(),
    db.subscriptionPlan.findUnique({
      where: { slug: "pro" },
      select: { features: true }
    }),
    tenantDb.payment.findFirst({
      where: { tenantId, status: "pending" },
      select: { id: true }
    }),
    db.platformSetting.findMany({
      where: { key: { in: ["enable_billing_upgrade", "MANUAL_PAYMENT_BANK", "MANUAL_PAYMENT_NUMBER", "MANUAL_PAYMENT_NAME", "MANUAL_PAYMENT_WA"] } },
      select: { key: true, value: true }
    })
  ])

  // Untuk tenant PRO aktif: cari harga dari payment PAID terakhir (harga kontrak)
  let lockedPricePerStudent: number | null = null
  if (tenant?.plan === "pro" && tenant.isActive && tenant.expiresAt && new Date(tenant.expiresAt) > new Date()) {
    const lastPaid = await tenantDb.payment.findFirst({
      where: { tenantId, status: "paid", plan: "pro" },
      orderBy: { paidAt: "desc" },
      select: { metadata: true }
    })
    const metaPrice = (lastPaid?.metadata as any)?.pricePerStudent
    if (metaPrice && metaPrice > 0) lockedPricePerStudent = metaPrice
  }

  const proFeatures = normalizeFeatures(proPlan?.features)

  const manualPayment = {
    bank: platformSettings.find(s => s.key === "MANUAL_PAYMENT_BANK")?.value || "Bank BCA",
    number: platformSettings.find(s => s.key === "MANUAL_PAYMENT_NUMBER")?.value || "1234 5678 90",
    name: platformSettings.find(s => s.key === "MANUAL_PAYMENT_NAME")?.value || "PT SchoolPro Indonesia",
    waNumber: platformSettings.find(s => s.key === "MANUAL_PAYMENT_WA")?.value || "6281234567890",
  }

  let autoCashbackCode: string | null = null
  if (tenant?.affiliateId) {
    const code = await db.discountCode.findFirst({
      where: { affiliateId: tenant.affiliateId, type: "CASHBACK", isActive: true }
    })
    if (code) {
      autoCashbackCode = code.code
    } else {
      const affiliate = await db.affiliateProfile.findUnique({
        where: { id: tenant.affiliateId }
      })
      if (affiliate && affiliate.isActive) {
        autoCashbackCode = affiliate.referralCode
      }
    }
  }

  return {
    ...tenant,
    pricing,
    proFeatures,
    hasPendingInvoice: !!pendingPayment,
    upgradeEnabled: true,
    manualPayment,
    lockedPricePerStudent,
    autoCashbackCode
  }
}

// ==========================================
// Query: Riwayat Billing
// ==========================================
export async function getBillingHistory(tenantId: string) {
  const tenantDb = withTenant(tenantId)
  return tenantDb.payment.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: 50,
  })
}

// ==========================================
// Mutation: Batalkan Invoice Pending
// ==========================================
export async function cancelPendingPayment(tenantId: string, paymentId: string) {
  const tenantDb = withTenant(tenantId)
  const payment = await tenantDb.payment.findUnique({
    where: { id: paymentId },
    select: { id: true, tenantId: true, status: true, discountCodeId: true }
  })

  if (!payment || payment.tenantId !== tenantId) {
    throw new Error("Payment not found")
  }

  if (payment.status !== "pending") {
    throw new Error("Only pending payments can be cancelled")
  }

  // Gunakan transaksi: batalkan invoice + kembalikan kuota kupon
  const operations: any[] = [
    tenantDb.payment.update({
      where: { id: paymentId },
      data: { status: "cancelled" }
    })
  ]

  // Kembalikan kuota kupon jika invoice menggunakan discount code
  if (payment.discountCodeId) {
    operations.push(
      db.discountCode.update({
        where: { id: payment.discountCodeId },
        data: { usedCount: { decrement: 1 } }
      })
    )
  }

  await tenantDb.$transaction(operations)

  // Audit trail
  await tenantDb.auditLog.create({
    data: {
      tenantId,
      action: "BILLING_PAYMENT_CANCELLED",
      entity: "Finance",
      newData: { paymentId }
    }
  }).catch(() => {})

  return { success: true }
}

// ==========================================
// Mutation: Validasi Kode Diskon
// ==========================================
export async function validateDiscountCode(code: string, tenantId?: string) {
  let discount = await db.discountCode.findUnique({
    where: { code: code.toUpperCase() },
  })

  // Auto-generate DiscountCode jika code yang dimasukkan adalah referralCode milik Affiliate
  if (!discount) {
    const affiliate = await db.affiliateProfile.findFirst({
      where: { referralCode: { equals: code, mode: "insensitive" } }
    })

    if (affiliate && affiliate.isActive) {
      const settings = await db.platformSetting.findUnique({ where: { key: "AFFILIATE_DEFAULT_CASHBACK_PERCENTAGE" } })
      const defaultCashbackPct = settings ? parseInt(settings.value) : 20;

      discount = await db.discountCode.create({
        data: {
          code: affiliate.referralCode.toUpperCase(),
          description: `Kupon Cashback Otomatis untuk Mitra ${affiliate.referralCode.toUpperCase()}`,
          type: "CASHBACK",
          cashbackAmount: 0,
          percentage: defaultCashbackPct,
          affiliateId: affiliate.id,
          maxUses: 1,
          isActive: true,
        }
      })
    }
  }

  if (!discount) throw new Error("Kode diskon tidak ditemukan")
  if (!discount.isActive) throw new Error("Kode diskon sudah tidak aktif")
  if (discount.maxUses !== null && discount.usedCount >= discount.maxUses) {
    throw new Error("Kode diskon sudah mencapai batas penggunaan")
  }
  if (discount.expiresAt && new Date(discount.expiresAt) < new Date()) {
    throw new Error("Kode diskon sudah kedaluwarsa")
  }
  
  if (discount.type === "CASHBACK" && tenantId) {
    if (discount.linkedTenantId && discount.linkedTenantId !== tenantId) {
      throw new Error("Kode kupon ini sudah terikat ke sekolah lain")
    }
  }

  return {
    id: discount.id,
    code: discount.code,
    type: discount.type,
    percentage: discount.percentage,
    cashbackAmount: discount.cashbackAmount,
    description: discount.description,
    expiresAt: discount.expiresAt,
    bonusMonths: discount.bonusMonths,
  }
}

// ==========================================
// Helpers
// ==========================================
function normalizeFeatures(raw: any): string[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw.filter((f: any) => typeof f === "string")
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed.filter((f: any) => typeof f === "string") : []
    } catch {
      return []
    }
  }
  return []
}
