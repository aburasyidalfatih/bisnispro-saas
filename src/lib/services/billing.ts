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
      discountAmount,
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
        discountPercentage: validDiscountId ? (discountAmount / subTotal) * 100 : 0
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
