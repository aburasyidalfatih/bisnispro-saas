import crypto from "crypto"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

const MAX_RETRY = 3
const RETRY_DELAY_MS = [1000, 5000, 15000]

export type PaymentConfigDTO = {
  apiUrl: string
  apiKey: string
  privateKey: string
  merchantCode: string
}

export type CreateTransactionParamsDTO = {
  tenantId: string
  plan: string
  planId?: string
  amount: number
  method: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  metadata?: any
}

export type TransactionResultDTO = {
  success: boolean
  data?: any
  error?: string
}

export type TripayCallbackBodyDTO = {
  merchant_ref: string
  status: string
  signature: string
  reference?: string
  total_amount?: number
  fee_merchant?: number
  fee_customer?: number
  payment_method?: string
  payment_method_code?: string
  paid_at?: string
}

export type CallbackResultDTO = {
  success: boolean
  data?: any
  error?: string
}

// Ambil config Tripay: cek tenant dulu, fallback ke platform default
export async function getTripayConfig(tenantId: string): Promise<PaymentConfigDTO> {
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true },
  })
  const settings = (tenant?.settings as Record<string, any>) || {}
  if (settings.tripay?.tripayApiKey && settings.tripay?.tripayMerchantCode) {
    return {
      apiUrl: settings.tripay.tripayApiUrl || "https://tripay.co.id/api-sandbox",
      apiKey: settings.tripay.tripayApiKey,
      privateKey: settings.tripay.tripayPrivateKey || "",
      merchantCode: settings.tripay.tripayMerchantCode,
    }
  }
  // Fallback ke platform default
  return {
    apiUrl: process.env.TRIPAY_API_URL || "https://tripay.co.id/api-sandbox",
    apiKey: process.env.TRIPAY_API_KEY || "",
    privateKey: process.env.TRIPAY_PRIVATE_KEY || "",
    merchantCode: process.env.TRIPAY_MERCHANT_CODE || "",
  }
}

export async function getPaymentChannels(tenantId?: string): Promise<any[]> {
  try {
    const cfg = tenantId
      ? await getTripayConfig(tenantId)
      : {
          apiUrl: process.env.TRIPAY_API_URL || "https://tripay.co.id/api-sandbox",
          apiKey: process.env.TRIPAY_API_KEY || "",
          privateKey: process.env.TRIPAY_PRIVATE_KEY || "",
          merchantCode: process.env.TRIPAY_MERCHANT_CODE || "",
        }
    const response = await fetch(`${cfg.apiUrl}/merchant/payment-channel`, {
      headers: { Authorization: `Bearer ${cfg.apiKey}` },
    })
    const data = await response.json()
    return data.data || []
  } catch (error) {
    logger.error("Failed to fetch payment channels", error)
    return []
  }
}

export async function createTransaction(params: CreateTransactionParamsDTO): Promise<TransactionResultDTO> {
  try {
    const cfg = await getTripayConfig(params.tenantId)
    const merchantRef = `INV-${Date.now()}`

    const signature = crypto
      .createHmac("sha256", cfg.privateKey)
      .update(cfg.merchantCode + merchantRef + params.amount)
      .digest("hex")

    const payload = {
      method: params.method,
      merchant_ref: merchantRef,
      amount: params.amount,
      customer_name: params.customerName,
      customer_email: params.customerEmail,
      customer_phone: params.customerPhone || "",
      order_items: [
        {
          name: params.plan === "WALLET_TOPUP" ? "Top Up Saldo SchoolPay" : `Paket ${params.plan}`,
          price: params.amount,
          quantity: 1,
        },
      ],
      signature,
    }

    const response = await fetch(`${cfg.apiUrl}/transaction/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify(payload),
    })

    const result = await response.json()

    if (result.success) {
      await db.payment.create({
        data: {
          tenantId: params.tenantId,
          reference: merchantRef,
          amount: params.amount,
          method: params.method,
          plan: params.plan,
          planId: params.planId,
          tripayRef: result.data.reference,
          expiredAt: new Date(result.data.expired_time * 1000),
          metadata: params.metadata || {},
        },
      })
      return { success: true, data: result.data }
    } else {
      return { success: false, error: result.message || "Gagal membuat transaksi di Tripay" }
    }
  } catch (error: any) {
    logger.error("Transaction creation failed", error)
    return { success: false, error: "Terjadi kesalahan internal saat membuat transaksi" }
  }
}

/**
 * Verify Tripay callback signature to ensure authenticity.
 * Tripay signs callbacks with HMAC SHA256 using the private key.
 */
export function verifyCallbackSignature(
  body: TripayCallbackBodyDTO,
  privateKey: string
): boolean {
  const signature = crypto
    .createHmac("sha256", privateKey)
    .update(JSON.stringify(body))
    .digest("hex")
  return signature === body.signature
}

export async function handleCallback(body: TripayCallbackBodyDTO): Promise<CallbackResultDTO> {
  try {
    // Step 1: Find the payment by merchant reference
    const payment = await db.payment.findUnique({
      where: { reference: body.merchant_ref },
    })

    if (!payment) return { success: false, error: "Payment not found" }

    // Idempotency check: jangan proses ulang jika sudah paid/expired
    if (payment.status === "paid" || payment.status === "expired") {
      logger.info("[payment] Callback already processed, skipping", {
        merchantRef: body.merchant_ref,
        currentStatus: payment.status,
      })
      return { success: true, data: payment }
    }

    // Step 2: Verify callback signature
    const cfg = await getTripayConfig(payment.tenantId)
    if (!verifyCallbackSignature(body, cfg.privateKey)) {
      logger.warn("[payment] Invalid callback signature", {
        merchantRef: body.merchant_ref,
      })
      return { success: false, error: "Invalid callback signature" }
    }

    // Step 3: Optimistic Concurrency Control (Idempotency Lock)
    const updatedPaymentStatus = await db.payment.updateMany({
      where: { id: payment.id, status: payment.status }, // Pastikan status belum berubah di thread lain
      data: {
        status: body.status === "PAID" ? "paid" : body.status.toLowerCase(),
        paidAt: body.status === "PAID" ? new Date() : null,
      },
    })

    // Jika count 0, thread lain (dari webhook ganda) sudah lebih dulu update!
    if (updatedPaymentStatus.count === 0) {
      logger.info("[payment] Webhook concurrency collision, skipping", {
        merchantRef: body.merchant_ref,
      })
      return { success: true, data: payment }
    }

    // Step 4: Upgrade tenant plan, TopUp Wallet, or Pay Invoice jika pembayaran berhasil
    if (body.status === "PAID") {
      if (payment.plan === "WALLET_TOPUP") {
        await retryAsync(
          async () => {
             const metadata = payment.metadata as any
             if (!metadata?.walletId) throw new Error("Wallet ID not found in payment metadata")
             
             const wallet = await db.walletAccount.findUnique({ where: { id: metadata.walletId }})
             if (!wallet) throw new Error("Wallet not found")
             
             // Gunakan transaksi untuk menjamin integritas uang & log
             await db.$transaction(async (tx) => {
               // 1. Update Wallet Balance atomically
               await tx.walletAccount.update({
                 where: { id: wallet.id },
                 data: { balance: { increment: payment.amount } }
               })
               
               // 2. Insert WalletTransaction
               await tx.walletTransaction.create({
                 data: {
                   walletId: wallet.id,
                   tenantId: payment.tenantId,
                   type: "DEPOSIT",
                   amount: payment.amount,
                   balanceBefore: wallet.balance,
                   balanceAfter: wallet.balance + payment.amount,
                   referenceId: payment.reference,
                   description: "Top-Up via Tripay",
                   status: "SUCCESS"
                 }
               })
             })

             // 3. Notify Admin
             const { notifyTenantAdmins } = await import("@/features/notification/services/notification.service");
             await notifyTenantAdmins(payment.tenantId, {
               title: "Top-Up Saldo Berhasil",
               message: `Wali murid telah berhasil melakukan top-up saldo sebesar Rp ${payment.amount.toLocaleString("id-ID")}.`,
               type: "success"
             })
          },
          "topup-wallet"
        )
      } else if (payment.plan === "INVOICE") {
        await retryAsync(
          async () => {
             const metadata = payment.metadata as any
             if (!metadata?.invoiceId) throw new Error("Invoice ID not found in payment metadata")
             
             const invoice = await db.invoice.findUnique({ where: { id: metadata.invoiceId }})
             if (!invoice) throw new Error("Invoice not found")

             // Update Invoice to PAID
             await db.invoice.update({
               where: { id: invoice.id },
               data: { 
                 status: "PAID",
                 amountPaid: invoice.amount,
                 amountDue: 0,
               }
             })

             // Notify Admin
             const { notifyTenantAdmins } = await import("@/features/notification/services/notification.service");
             await notifyTenantAdmins(payment.tenantId, {
               title: "Pembayaran Tagihan Berhasil",
               message: `Tagihan '${invoice.title}' senilai Rp ${payment.amount.toLocaleString("id-ID")} telah berhasil dibayar.`,
               type: "success"
             })
          },
          "pay-invoice"
        )
      } else {
        const plan = await db.subscriptionPlan.findFirst({
          where: payment.planId ? { id: payment.planId } : { slug: payment.plan },
        })

      await retryAsync(
        async () => {
          // Update tenant
          await db.tenant.update({
            where: { id: payment.tenantId },
            data: {
              plan: plan?.slug || payment.plan,
              planId: plan?.id,
              studentQuota: plan?.maxStudents || 0,
            },
          })

          // Create subscription history
          if (plan) {
            await db.subscription.create({
              data: {
                tenantId: payment.tenantId,
                planId: plan.id,
                paymentId: payment.id,
                status: "ACTIVE",
                startDate: new Date(),
                endDate:
                  plan.interval === "MONTHLY"
                    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                    : plan.interval === "YEARLY"
                      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                      : null,
                amount: payment.amount,
              },
            })
          }
        },
        "upgrade-plan"
      )
      // Notify tenant admin about successful upgrade
      const { notifyTenantAdmins } = await import("@/features/notification/services/notification.service");
      await notifyTenantAdmins(payment.tenantId, {
        title: "Upgrade Paket Berhasil ✅",
        message: `Selamat! Paket berhasil diupgrade ke ${plan?.slug?.toUpperCase() || payment.plan}. Nikmati fitur premium SchoolPro.`,
        type: "success"
      })
      } // end else
    }

    return { 
      success: true, 
      data: { ...payment, status: body.status === "PAID" ? "paid" : body.status.toLowerCase() } 
    }
  } catch (error: any) {
    logger.error("Callback handling failed", error)
    return { success: false, error: error.message || "Failed to process callback" }
  }
}

/**
 * Retry an async operation with exponential backoff.
 * Used for critical post-payment operations that must not be lost.
 */
async function retryAsync<T>(
  fn: () => Promise<T>,
  label: string,
  maxRetries = MAX_RETRY
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt === maxRetries) {
        logger.error(`[payment] ${label} failed after ${maxRetries + 1} attempts`, error)
        throw error
      }
      const delay = RETRY_DELAY_MS[attempt] || 15000
      logger.warn(`[payment] ${label} attempt ${attempt + 1} failed, retrying in ${delay}ms`, {
        error: error instanceof Error ? error.message : String(error),
      })
      await new Promise((r) => setTimeout(r, delay))
    }
  }
  throw new Error("Unreachable")
}
