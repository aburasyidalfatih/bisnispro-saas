import { db } from "@/lib/db"

export type BillingConfigDTO = {
  PRICE_PER_STUDENT: number
  MIN_STUDENTS: number
}

export type InvoiceResultDTO = {
  success: boolean
  data?: any // We can refine this later
  error?: string
}

/**
 * Mendapatkan konfigurasi harga dari Platform Settings
 */
export async function getPricingConfig(): Promise<BillingConfigDTO> {
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
 * Mendapatkan konfigurasi masa aktif invoice (dalam hari) dari Platform Settings
 */
export async function getInvoiceExpiryDays(): Promise<number> {
  const setting = await db.platformSetting.findUnique({
    where: { key: 'INVOICE_EXPIRY_DAYS' }
  })
  const days = setting ? Number(setting.value) : 1 // default 1 hari
  return days > 0 ? days : 1
}

/**
 * Membuat Invoice untuk Upgrade ke PRO (tanpa Tripay - manual confirm)
 */
export async function createUpgradeInvoice(tenantId: string, studentCount: number, discountCodeStr?: string, planSlug: string = "pro"): Promise<InvoiceResultDTO> {
  try {
    const pricing = await getPricingConfig()
    
    if (planSlug === "pro" && studentCount < pricing.MIN_STUDENTS) {
      return { success: false, error: `Minimal pembelian adalah ${pricing.MIN_STUDENTS} siswa` }
    }

    const tenant = await db.tenant.findUnique({ where: { id: tenantId } })
    if (!tenant) return { success: false, error: "Tenant tidak ditemukan" }

    // Guard: cegah duplikasi invoice pending
    const existingPending = await db.payment.findFirst({
      where: { tenantId, status: "pending" }
    })
    if (existingPending) {
      return { success: false, error: "Masih ada invoice pending yang belum diselesaikan. Silakan batalkan atau selesaikan terlebih dahulu." }
    }

    let subTotal = 0;
    let pricePerStudent = 0;
    
    if (planSlug === "pro") {
      subTotal = studentCount * pricing.PRICE_PER_STUDENT
      pricePerStudent = pricing.PRICE_PER_STUDENT
    } else {
      // Fetch fixed price from SubscriptionPlan
      const plan = await db.subscriptionPlan.findUnique({ where: { slug: planSlug } })
      if (!plan) return { success: false, error: `Paket ${planSlug} tidak ditemukan` }
      subTotal = plan.price
      pricePerStudent = 0
    }

    let amount = subTotal
    let discountAmount = 0
    let discountPercentage = 0
    let validDiscountId: string | null = null

    // Validasi kupon (read-only, belum increment)
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
        if (discount.type === "CASHBACK" && discount.linkedTenantId && discount.linkedTenantId !== tenantId) {
          throw new Error("Kode kupon ini sudah terikat ke sekolah lain")
        }
        
        if (discount.type === "CASHBACK") {
          discountPercentage = 0
          discountAmount = 0
        } else {
          discountPercentage = discount.percentage
          discountAmount = Math.round(subTotal * (discountPercentage / 100))
        }
        amount = subTotal - discountAmount
        validDiscountId = discount.id
      }
    }

    const reference = `INV-${Date.now()}-${tenant.slug.toUpperCase()}`
    const expiryDays = await getInvoiceExpiryDays()
    const expiredAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)

    // Gunakan transaksi: buat payment + increment kupon secara atomic
    const operations: any[] = []

    operations.push(
      db.payment.create({
        data: {
          tenantId: tenant.id,
          reference,
          amount,
          discountCodeId: validDiscountId,
          plan: planSlug,
          status: "pending",
          expiredAt,
          metadata: {
            studentCount: planSlug === "pro" ? studentCount : 0,
            pricePerStudent,
            tenantName: tenant.name,
            tenantSlug: tenant.slug,
            subTotal,
            discountAmount,
            discountPercentage,
            type: "UPGRADE"
          }
        }
      })
    )

    if (validDiscountId) {
      operations.push(
        db.discountCode.update({
          where: { id: validDiscountId },
          data: { usedCount: { increment: 1 } }
        })
      )
    }

    const [payment] = await db.$transaction(operations)

    return {
      success: true,
      data: {
        id: payment.id,
        reference: payment.reference,
        amount: payment.amount,
        subTotal,
        discountAmount,
        studentCount: planSlug === "pro" ? studentCount : 0,
        pricePerStudent,
        tenantName: tenant.name,
        expiredAt: payment.expiredAt,
        status: payment.status,
        createdAt: payment.createdAt,
      }
    }
  } catch (error: any) {
    return { success: false, error: "Terjadi kesalahan internal" }
  }
}

/**
 * Membuat Invoice untuk Penambahan Kuota (Prorated)
 */
export async function createAddonInvoice(tenantId: string, studentCount: number, discountCodeStr?: string): Promise<InvoiceResultDTO> {
  try {
    const pricing = await getPricingConfig()

    if (studentCount <= 0) {
      return { success: false, error: "Jumlah siswa harus lebih dari 0" }
    }

    const tenant = await db.tenant.findUnique({ where: { id: tenantId } })
    if (!tenant) return { success: false, error: "Tenant tidak ditemukan" }
    if (tenant.plan !== "pro" || !tenant.isActive || !tenant.expiresAt) {
      return { success: false, error: "Penambahan kuota hanya berlaku untuk paket PRO yang aktif" }
    }

    // Guard: cegah duplikasi invoice pending
    const existingPending = await db.payment.findFirst({
      where: { tenantId, status: "pending" }
    })
    if (existingPending) {
      return { success: false, error: "Masih ada invoice pending yang belum diselesaikan. Silakan batalkan atau selesaikan terlebih dahulu." }
    }

    const now = new Date()
    const expiresAt = new Date(tenant.expiresAt)
    
    if (expiresAt <= now) {
      return { success: false, error: "Masa aktif paket sudah habis, silakan perpanjang (upgrade/renew) terlebih dahulu" }
    }

    // Gunakan harga dari payment PAID terakhir (harga kontrak aktif)
    // Jika tidak ada, fallback ke harga global terbaru
    const lastPaidPayment = await db.payment.findFirst({
      where: { tenantId, status: "paid", plan: "pro" },
      orderBy: { paidAt: "desc" },
      select: { metadata: true }
    })
    const lockedPrice = (lastPaidPayment?.metadata as any)?.pricePerStudent
    const pricePerStudent = lockedPrice && lockedPrice > 0 ? lockedPrice : pricing.PRICE_PER_STUDENT

    const msPerDay = 24 * 60 * 60 * 1000
    const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / msPerDay)
    
    // Asumsikan 1 tahun = 365 hari untuk base calculation
    const ratio = Math.min(daysRemaining / 365, 1)

    const fullSubTotal = studentCount * pricePerStudent
    const subTotal = Math.round(fullSubTotal * ratio) // prorated, rounded to Int

    let amount = subTotal
    let discountAmount = 0
    let discountPercentage = 0
    let validDiscountId: string | null = null

    // Validasi kupon (read-only, belum increment)
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
        if (discount.type === "CASHBACK" && discount.linkedTenantId && discount.linkedTenantId !== tenantId) {
          throw new Error("Kode kupon ini sudah terikat ke sekolah lain")
        }

        if (discount.type === "CASHBACK") {
          discountPercentage = 0
          discountAmount = 0
        } else {
          discountPercentage = discount.percentage
          discountAmount = Math.round(subTotal * (discountPercentage / 100))
        }
        amount = subTotal - discountAmount
        validDiscountId = discount.id
      }
    }

    const reference = `INV-ADDON-${Date.now()}-${tenant.slug.toUpperCase()}`
    const expiryDays = await getInvoiceExpiryDays()
    const expiredAtInvoice = new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000)

    // Gunakan transaksi: buat payment + increment kupon secara atomic
    const operations: any[] = []

    operations.push(
      db.payment.create({
        data: {
          tenantId: tenant.id,
          reference,
          amount,
          discountCodeId: validDiscountId,
          plan: "pro",
          status: "pending",
          expiredAt: expiredAtInvoice,
          metadata: {
            studentCount,
            pricePerStudent,
            tenantName: tenant.name,
            tenantSlug: tenant.slug,
            subTotal,
            fullSubTotal,
            discountAmount,
            discountPercentage,
            type: "ADDON_QUOTA",
            daysRemaining,
            ratio,
            isLockedPrice: !!lockedPrice
          }
        }
      })
    )

    if (validDiscountId) {
      operations.push(
        db.discountCode.update({
          where: { id: validDiscountId },
          data: { usedCount: { increment: 1 } }
        })
      )
    }

    const [payment] = await db.$transaction(operations)

    return {
      success: true,
      data: {
        id: payment.id,
        reference: payment.reference,
        amount: payment.amount,
        subTotal,
        discountAmount,
        studentCount,
        pricePerStudent,
        tenantName: tenant.name,
        expiredAt: payment.expiredAt,
        status: payment.status,
        createdAt: payment.createdAt,
        daysRemaining,
        ratio,
        isLockedPrice: !!lockedPrice
      }
    }
  } catch (error) {
    return { success: false, error: "Terjadi kesalahan internal" }
  }
}

/**
 * Membuat Invoice untuk Top-Up Token AI
 */
export async function createAiAddonInvoice(tenantId: string, packageId: string): Promise<InvoiceResultDTO> {
  try {
    const tenant = await db.tenant.findUnique({ where: { id: tenantId } })
    if (!tenant) return { success: false, error: "Tenant tidak ditemukan" }
    
    const pkg = await db.aiTokenPackage.findUnique({ where: { id: packageId } })
    if (!pkg || !pkg.isActive) return { success: false, error: "Paket AI tidak ditemukan atau tidak aktif" }

    const reference = `INV-AI-${Date.now()}-${tenant.slug.toUpperCase()}`
    const expiryDays = await getInvoiceExpiryDays()
    const expiredAtInvoice = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)

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
          packageId: pkg.id,
          packageName: pkg.name,
          tenantName: tenant.name,
          tenantSlug: tenant.slug,
          subTotal: pkg.price,
          type: "AI_QUOTA",
        }
      }
    })

    return {
      success: true,
      data: {
        id: payment.id,
        reference: payment.reference,
        amount: payment.amount,
        subTotal: pkg.price,
        aiTokens: pkg.tokens,
        packageName: pkg.name,
        tenantName: tenant.name,
        expiredAt: payment.expiredAt,
        status: payment.status,
        createdAt: payment.createdAt,
      }
    }
  } catch (error) {
    return { success: false, error: "Terjadi kesalahan internal" }
  }
}

/**
 * Proses Auto-Debet SPP
 */
export async function processAutoDebetSPP() {
  const { endOfDay } = await import("date-fns");
  const today = new Date();
  const results = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    errors: [] as string[],
  };

  let cursorId: string | undefined = undefined;
  let hasMore = true;
  const BATCH_SIZE = 500;

  while (hasMore) {
    const invoices = await db.invoice.findMany({
      take: BATCH_SIZE,
      skip: cursorId ? 1 : 0,
      cursor: cursorId ? { id: cursorId } : undefined,
      orderBy: { id: "asc" },
      where: {
        isAutoDebet: true,
        deletedAt: null,
        dueDate: { lte: endOfDay(today) },
        status: { in: ["UNPAID", "PARTIAL"] },
      },
      include: {
        student: {
          include: {
            walletAccount: true,
          },
        },
      },
    }) as any[];

    if (invoices.length === 0) {
      hasMore = false;
      break;
    }

    cursorId = invoices[invoices.length - 1].id;
    results.processed += invoices.length;

    for (const invoice of invoices) {
      const wallet = invoice.student?.walletAccount;
      const amountToPay = invoice.amountDue;

      if (!wallet || wallet.balance < amountToPay) {
        results.skipped++;
        continue;
      }

      try {
        await db.$transaction(async (tx) => {
          const updatedWallet = await tx.walletAccount.update({
            where: { id: wallet.id },
            data: { balance: { decrement: amountToPay } },
          });
          const newBalance = updatedWallet.balance;

          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              tenantId: invoice.tenantId,
              type: "PAYMENT",
              amount: amountToPay,
              balanceBefore: newBalance + amountToPay,
              balanceAfter: newBalance,
              referenceId: invoice.code,
              description: `[AUTO-DEBET] ${invoice.title}`,
              status: "SUCCESS",
            },
          });

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
          });

          await tx.invoice.update({
            where: { id: invoice.id },
            data: {
              amountPaid: invoice.amountPaid + amountToPay,
              amountDue: 0,
              status: "PAID",
            },
          });

          await tx.cashflow.create({
            data: {
              tenantId: invoice.tenantId,
              type: "INCOME",
              category: "SPP",
              amount: amountToPay,
              description: `[AUTO] ${invoice.title} — ${invoice.student.name}`,
              referenceId: invoice.code,
            },
          });
        });

        results.succeeded++;
      } catch (err: any) {
        results.failed++;
        results.errors.push(`Invoice ${invoice.code}: ${err.message}`);
      }
    }
  }

  return results;
}

/**
 * Cron handler: otomatis expire invoice pending yang melewati jatuh tempo
 * dan kembalikan kuota kupon yang digunakan.
 */
export async function processExpiredInvoices() {
  const { logger } = await import("@/lib/logger");
  const now = new Date()

  // Cari semua invoice pending yang sudah melewati expiredAt
  const expiredPayments = await db.payment.findMany({
    where: {
      status: "pending",
      expiredAt: { lt: now }
    },
    select: { id: true, discountCodeId: true, reference: true }
  })

  if (expiredPayments.length === 0) {
    return { message: "Tidak ada invoice expired", count: 0 }
  }

  // Proses setiap invoice expired
  const operations: any[] = []

  for (const payment of expiredPayments) {
    // Update status ke expired
    operations.push(
      db.payment.update({
        where: { id: payment.id },
        data: { status: "expired" }
      })
    )

    // Kembalikan kuota kupon jika ada
    if (payment.discountCodeId) {
      operations.push(
        db.discountCode.update({
          where: { id: payment.discountCodeId },
          data: { usedCount: { decrement: 1 } }
        })
      )
    }
  }

  await db.$transaction(operations)

  const refs = expiredPayments.map(p => p.reference)
  const ids = expiredPayments.map(p => p.id)
  logger.info(`Auto-expired ${expiredPayments.length} invoices`, { references: refs })

  // Kirim notifikasi ke tenant (async, non-blocking)
  import("@/features/finance/services/billing-notification.service").then(({ notifyInvoiceExpired }) => {
    notifyInvoiceExpired(ids).catch(() => {})
  }).catch(() => {})

  return {
    message: `${expiredPayments.length} invoice berhasil di-expire`,
    count: expiredPayments.length,
    references: refs
  }
}
