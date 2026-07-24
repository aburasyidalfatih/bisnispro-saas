import { db, withTenant } from "@/lib/db"

export type WalletHistoryDTO = {
  wallet: { id: string; balance: number }
  data: any[]
  meta: { total: number; page: number; totalPages: number }
}

export type WalletSettingsDTO = {
  hasPin: boolean
  dailyLimit: number
}

export async function getWalletHistory(userId: string, walletId?: string | null, page = 1): Promise<WalletHistoryDTO> {
  return { wallet: { id: "", balance: 0 }, data: [], meta: { total: 0, page: 1, totalPages: 1 } }
}

export async function getWalletSettings(userId: string): Promise<WalletSettingsDTO> {
  return { hasPin: false, dailyLimit: 0 }
}

export async function updateWalletSettings(userId: string, pin?: string, dailyLimit?: number) {
  return { success: true }
}

export async function createManualTopup(params: any) {
  return { message: "Transaksi manual berhasil dibuat", redirectUrl: "" }
}

export async function submitManualTopupProof(paymentId: string, proofUrl: string) {
  return { success: true, url: proofUrl }
}

export async function verifyWalletOwnership(walletId: string, userId: string) {
  return null
}

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
      autoCashbackCode = code.code.replace(/^ref-/i, "")
    } else {
      const affiliate = await db.affiliateProfile.findUnique({
        where: { id: tenant.affiliateId }
      })
      if (affiliate && affiliate.isActive) {
        autoCashbackCode = affiliate.referralCode.replace(/^ref-/i, "")
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

export async function getBillingHistory(tenantId: string) {
  const tenantDb = withTenant(tenantId)
  return tenantDb.payment.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: 50,
  })
}

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

  const operations: any[] = [
    tenantDb.payment.update({
      where: { id: paymentId },
      data: { status: "cancelled" }
    })
  ]

  if (payment.discountCodeId) {
    operations.push(
      db.discountCode.update({
        where: { id: payment.discountCodeId },
        data: { usedCount: { decrement: 1 } }
      })
    )
  }

  await tenantDb.$transaction(operations)

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

export async function validateDiscountCode(code: string, tenantId?: string) {
  let discount = await db.discountCode.findFirst({
    where: {
      OR: [
        { code: code.toUpperCase() },
        { code: `REF-${code.toUpperCase()}` }
      ]
    },
  })

  if (!discount) {
    const affiliate = await db.affiliateProfile.findFirst({
      where: {
        OR: [
          { referralCode: { equals: code, mode: "insensitive" } },
          { referralCode: { equals: `ref-${code}`, mode: "insensitive" } }
        ]
      }
    })

    if (affiliate && affiliate.isActive) {
      const settings = await db.platformSetting.findUnique({ where: { key: "AFFILIATE_DEFAULT_CASHBACK_PERCENTAGE" } })
      const defaultCashbackPct = settings ? parseInt(settings.value) : 20;

      discount = await db.discountCode.create({
        data: {
          code: affiliate.referralCode.toUpperCase().replace(/^REF-/i, ""),
          description: `Kupon Cashback Otomatis`,
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

