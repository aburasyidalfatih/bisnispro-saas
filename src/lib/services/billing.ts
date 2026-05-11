import { db } from "@/lib/db"

/**
 * Mendapatkan konfigurasi harga dari Platform Settings
 */
export async function getPricingConfig() {
  const settings = await db.platformSetting.findMany({
    where: {
      key: { in: ['PRICE_PER_STUDENT', 'MIN_STUDENTS'] }
    }
  })
  
  const config = {
    PRICE_PER_STUDENT: 30000, // default
    MIN_STUDENTS: 50          // default
  }

  settings.forEach(s => {
    if (s.key === 'PRICE_PER_STUDENT') config.PRICE_PER_STUDENT = Number(s.value)
    if (s.key === 'MIN_STUDENTS') config.MIN_STUDENTS = Number(s.value)
  })

  return config
}

/**
 * Membuat Invoice untuk Upgrade ke PRO (tanpa Tripay - manual confirm)
 */
export async function createUpgradeInvoice(tenantId: string, studentCount: number, discountCodeStr?: string) {
  const pricing = await getPricingConfig()
  
  if (studentCount < pricing.MIN_STUDENTS) {
    throw new Error(`Minimal pembelian adalah ${pricing.MIN_STUDENTS} siswa`)
  }

  const tenant = await db.tenant.findUnique({ where: { id: tenantId } })
  if (!tenant) throw new Error("Tenant tidak ditemukan")

  const subTotal = studentCount * pricing.PRICE_PER_STUDENT
  let amount = subTotal
  let discountAmount = 0
  let validDiscountId = null

  if (discountCodeStr) {
    const discount = await db.discountCode.findUnique({
      where: { code: discountCodeStr.toUpperCase() }
    })
    
    if (
      discount && 
      discount.isActive && 
      (!discount.maxUses || discount.usedCount < discount.maxUses) &&
      (!discount.expiresAt || new Date(discount.expiresAt) > new Date())
    ) {
      discountAmount = subTotal * (discount.percentage / 100)
      amount = subTotal - discountAmount
      validDiscountId = discount.id
      
      // Increment usedCount
      await db.discountCode.update({
        where: { id: discount.id },
        data: { usedCount: { increment: 1 } }
      })
    }
  }

  const reference = `INV-${Date.now()}-${tenant.slug.toUpperCase()}`
  const expiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 jam

  // Catat ke tabel Payment sebagai PENDING
  const payment = await db.payment.create({
    data: {
      tenantId: tenant.id,
      reference,
      amount,
      discountCodeId: validDiscountId,
      plan: "pro",
      status: "pending",
      expiredAt,
      metadata: {
        studentCount,
        pricePerStudent: pricing.PRICE_PER_STUDENT,
        tenantName: tenant.name,
        tenantSlug: tenant.slug,
        subTotal,
        discountAmount,
        discountPercentage: validDiscountId ? (discountAmount / subTotal) * 100 : 0,
        type: "UPGRADE"
      }
    }
  })

  return {
    id: payment.id,
    reference: payment.reference,
    amount: payment.amount,
    subTotal,
    discountAmount,
    studentCount,
    pricePerStudent: pricing.PRICE_PER_STUDENT,
    tenantName: tenant.name,
    expiredAt: payment.expiredAt,
    status: payment.status,
    createdAt: payment.createdAt,
  }
}

/**
 * Membuat Invoice untuk Penambahan Kuota (Prorated)
 */
export async function createAddonInvoice(tenantId: string, studentCount: number, discountCodeStr?: string) {
  const pricing = await getPricingConfig()

  if (studentCount <= 0) {
    throw new Error("Jumlah siswa harus lebih dari 0")
  }

  const tenant = await db.tenant.findUnique({ where: { id: tenantId } })
  if (!tenant) throw new Error("Tenant tidak ditemukan")
  if (tenant.plan !== "pro" || !tenant.isActive || !tenant.expiresAt) {
    throw new Error("Penambahan kuota hanya berlaku untuk paket PRO yang aktif")
  }

  const now = new Date()
  const expiresAt = new Date(tenant.expiresAt)
  
  if (expiresAt <= now) {
    throw new Error("Masa aktif paket sudah habis, silakan perpanjang (upgrade/renew) terlebih dahulu")
  }

  const msPerDay = 24 * 60 * 60 * 1000
  const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / msPerDay)
  
  // Asumsikan 1 tahun = 365 hari untuk base calculation
  const ratio = Math.min(daysRemaining / 365, 1)

  const fullSubTotal = studentCount * pricing.PRICE_PER_STUDENT
  const subTotal = fullSubTotal * ratio // prorated

  let amount = subTotal
  let discountAmount = 0
  let validDiscountId = null

  if (discountCodeStr) {
    const discount = await db.discountCode.findUnique({
      where: { code: discountCodeStr.toUpperCase() }
    })
    
    if (
      discount && 
      discount.isActive && 
      (!discount.maxUses || discount.usedCount < discount.maxUses) &&
      (!discount.expiresAt || new Date(discount.expiresAt) > now)
    ) {
      discountAmount = subTotal * (discount.percentage / 100)
      amount = subTotal - discountAmount
      validDiscountId = discount.id
      
      await db.discountCode.update({
        where: { id: discount.id },
        data: { usedCount: { increment: 1 } }
      })
    }
  }

  const reference = `INV-ADDON-${Date.now()}-${tenant.slug.toUpperCase()}`
  const expiredAtInvoice = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  const payment = await db.payment.create({
    data: {
      tenantId: tenant.id,
      reference,
      amount,
      discountCodeId: validDiscountId,
      plan: "pro", // tetap di label 'pro'
      status: "pending",
      expiredAt: expiredAtInvoice,
      metadata: {
        studentCount,
        pricePerStudent: pricing.PRICE_PER_STUDENT,
        tenantName: tenant.name,
        tenantSlug: tenant.slug,
        subTotal,
        fullSubTotal,
        discountAmount,
        discountPercentage: validDiscountId ? (discountAmount / subTotal) * 100 : 0,
        type: "ADDON_QUOTA",
        daysRemaining,
        ratio
      }
    }
  })

  return {
    id: payment.id,
    reference: payment.reference,
    amount: payment.amount,
    subTotal,
    discountAmount,
    studentCount,
    pricePerStudent: pricing.PRICE_PER_STUDENT,
    tenantName: tenant.name,
    expiredAt: payment.expiredAt,
    status: payment.status,
    createdAt: payment.createdAt,
    daysRemaining,
    ratio
  }
}

export const AI_PACKAGES: Record<string, { tokens: number, price: number }> = {
  "pkg_5k": { tokens: 5000, price: 25000 },
  "pkg_10k": { tokens: 10000, price: 45000 },
  "pkg_50k": { tokens: 50000, price: 200000 },
}

/**
 * Membuat Invoice untuk Top-Up Token AI
 */
export async function createAiAddonInvoice(tenantId: string, packageKey: string) {
  const tenant = await db.tenant.findUnique({ where: { id: tenantId } })
  if (!tenant) throw new Error("Tenant tidak ditemukan")
  
  const pkg = AI_PACKAGES[packageKey]
  if (!pkg) throw new Error("Paket AI tidak ditemukan")

  const reference = `INV-AI-${Date.now()}-${tenant.slug.toUpperCase()}`
  const expiredAtInvoice = new Date(Date.now() + 24 * 60 * 60 * 1000)

  const payment = await db.payment.create({
    data: {
      tenantId: tenant.id,
      reference,
      amount: pkg.price,
      plan: "ai_addon", // custom plan
      status: "pending",
      expiredAt: expiredAtInvoice,
      metadata: {
        aiTokens: pkg.tokens,
        tenantName: tenant.name,
        tenantSlug: tenant.slug,
        subTotal: pkg.price,
        type: "AI_QUOTA",
      }
    }
  })

  return {
    id: payment.id,
    reference: payment.reference,
    amount: payment.amount,
    subTotal: pkg.price,
    aiTokens: pkg.tokens,
    tenantName: tenant.name,
    expiredAt: payment.expiredAt,
    status: payment.status,
    createdAt: payment.createdAt,
  }
}

