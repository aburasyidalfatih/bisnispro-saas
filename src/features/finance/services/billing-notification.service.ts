import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { sendWhatsApp, sendEmail, notifyTenantAdmins } from "@/features/notification/services/notification.service"

export type BillingSettingsDTO = {
  platformName: string
  rootDomain: string
  bankName: string
  bankNumber: string
  bankAccountName: string
  adminWA: string
  tplInvoiceCreated: string
  tplPaymentConfirmed: string
  tplAffiliateCommission: string
  tplSubscriptionReminder: string
  enableInvoiceCreated: boolean
  enablePaymentConfirmed: boolean
  enableAffiliateCommission: boolean
  enableSubscriptionReminder: boolean
  emailEnableInvoiceCreated: boolean
  emailEnablePaymentConfirmed: boolean
  emailEnableAffiliateCommission: boolean
  emailEnableSubscriptionReminder: boolean

  // Super Admin Alerts
  tplPaymentSuccessSuperAdmin: string
  enablePaymentSuccessSuperAdmin: boolean
  emailEnablePaymentSuccessSuperAdmin: boolean

  tplWithdrawalRequestSuperAdmin: string
  enableWithdrawalRequestSuperAdmin: boolean
  emailEnableWithdrawalRequestSuperAdmin: boolean

  tplInvoiceExpiredSuperAdmin: string
  enableInvoiceExpiredSuperAdmin: boolean
  emailEnableInvoiceExpiredSuperAdmin: boolean

  // Wavio Templates
  wavioTplInvoiceCreated: string
  wavioTplPaymentConfirmed: string
  wavioTplAffiliateCommission: string
  wavioTplSubscriptionReminder: string
  wavioTplPaymentSuccessSuperAdmin: string
  wavioTplWithdrawalRequestSuperAdmin: string
  wavioTplInvoiceExpiredSuperAdmin: string
}

export type SubscriptionReminderResultDTO = {
  success: boolean
  processed: number
  sent: number
  error?: string
}

/**
 * Helper: Ambil platform settings terkait billing + templates
 */
export async function getBillingSettings(): Promise<BillingSettingsDTO> {
  const keys = [
    "platform_name", "NEXT_PUBLIC_ROOT_DOMAIN",
    "MANUAL_PAYMENT_BANK", "MANUAL_PAYMENT_NUMBER",
    "MANUAL_PAYMENT_NAME", "MANUAL_PAYMENT_WA",
    "WA_TEMPLATE_INVOICE_CREATED", "WA_TEMPLATE_PAYMENT_CONFIRMED",
    "WA_TEMPLATE_AFFILIATE_COMMISSION", "WA_TEMPLATE_SUBSCRIPTION_REMINDER",
    "WA_ENABLE_INVOICE_CREATED", "WA_ENABLE_PAYMENT_CONFIRMED",
    "WA_ENABLE_AFFILIATE_COMMISSION", "WA_ENABLE_SUBSCRIPTION_REMINDER",
    "EMAIL_ENABLE_INVOICE_CREATED", "EMAIL_ENABLE_PAYMENT_CONFIRMED",
    "EMAIL_ENABLE_AFFILIATE_COMMISSION", "EMAIL_ENABLE_SUBSCRIPTION_REMINDER",
    "WA_TEMPLATE_PAYMENT_SUCCESS_SUPERADMIN", "WA_ENABLE_PAYMENT_SUCCESS_SUPERADMIN", "EMAIL_ENABLE_PAYMENT_SUCCESS_SUPERADMIN",
    "WA_TEMPLATE_WITHDRAWAL_REQUEST_SUPERADMIN", "WA_ENABLE_WITHDRAWAL_REQUEST_SUPERADMIN", "EMAIL_ENABLE_WITHDRAWAL_REQUEST_SUPERADMIN",
    "WA_TEMPLATE_INVOICE_EXPIRED_SUPERADMIN", "WA_ENABLE_INVOICE_EXPIRED_SUPERADMIN", "EMAIL_ENABLE_INVOICE_EXPIRED_SUPERADMIN",
    "WAVIO_TEMPLATE_INVOICE_CREATED", "WAVIO_TEMPLATE_PAYMENT_CONFIRMED", "WAVIO_TEMPLATE_AFFILIATE_COMMISSION", "WAVIO_TEMPLATE_SUBSCRIPTION_REMINDER",
    "WAVIO_TEMPLATE_PAYMENT_SUCCESS_SUPERADMIN", "WAVIO_TEMPLATE_WITHDRAWAL_REQUEST_SUPERADMIN", "WAVIO_TEMPLATE_INVOICE_EXPIRED_SUPERADMIN"
  ]
  const settings = await db.platformSetting.findMany({ where: { key: { in: keys } } })
  const map: Record<string, string> = {}
  settings.forEach(s => { if (s.value) map[s.key] = s.value })
  return {
    platformName: map.platform_name || "SchoolPro",
    rootDomain: map.NEXT_PUBLIC_ROOT_DOMAIN || process.env.NEXT_PUBLIC_ROOT_DOMAIN || "schoolpro.id",
    bankName: map.MANUAL_PAYMENT_BANK || "Bank BCA",
    bankNumber: map.MANUAL_PAYMENT_NUMBER || "-",
    bankAccountName: map.MANUAL_PAYMENT_NAME || "PT SchoolPro Indonesia",
    adminWA: map.MANUAL_PAYMENT_WA || "-",
    // Customizable templates (from super-admin settings)
    tplInvoiceCreated: map.WA_TEMPLATE_INVOICE_CREATED || "",
    tplPaymentConfirmed: map.WA_TEMPLATE_PAYMENT_CONFIRMED || "",
    tplAffiliateCommission: map.WA_TEMPLATE_AFFILIATE_COMMISSION || "",
    tplSubscriptionReminder: map.WA_TEMPLATE_SUBSCRIPTION_REMINDER || "",
    enableInvoiceCreated: map.WA_ENABLE_INVOICE_CREATED !== "false",
    enablePaymentConfirmed: map.WA_ENABLE_PAYMENT_CONFIRMED !== "false",
    enableAffiliateCommission: map.WA_ENABLE_AFFILIATE_COMMISSION !== "false",
    enableSubscriptionReminder: map.WA_ENABLE_SUBSCRIPTION_REMINDER !== "false",
    emailEnableInvoiceCreated: map.EMAIL_ENABLE_INVOICE_CREATED !== "false",
    emailEnablePaymentConfirmed: map.EMAIL_ENABLE_PAYMENT_CONFIRMED !== "false",
    emailEnableAffiliateCommission: map.EMAIL_ENABLE_AFFILIATE_COMMISSION !== "false",
    emailEnableSubscriptionReminder: map.EMAIL_ENABLE_SUBSCRIPTION_REMINDER !== "false",

    tplPaymentSuccessSuperAdmin: map.WA_TEMPLATE_PAYMENT_SUCCESS_SUPERADMIN || "",
    enablePaymentSuccessSuperAdmin: map.WA_ENABLE_PAYMENT_SUCCESS_SUPERADMIN !== "false",
    emailEnablePaymentSuccessSuperAdmin: map.EMAIL_ENABLE_PAYMENT_SUCCESS_SUPERADMIN !== "false",

    tplWithdrawalRequestSuperAdmin: map.WA_TEMPLATE_WITHDRAWAL_REQUEST_SUPERADMIN || "",
    enableWithdrawalRequestSuperAdmin: map.WA_ENABLE_WITHDRAWAL_REQUEST_SUPERADMIN !== "false",
    emailEnableWithdrawalRequestSuperAdmin: map.EMAIL_ENABLE_WITHDRAWAL_REQUEST_SUPERADMIN !== "false",

    tplInvoiceExpiredSuperAdmin: map.WA_TEMPLATE_INVOICE_EXPIRED_SUPERADMIN || "",
    enableInvoiceExpiredSuperAdmin: map.WA_ENABLE_INVOICE_EXPIRED_SUPERADMIN !== "false",
    emailEnableInvoiceExpiredSuperAdmin: map.EMAIL_ENABLE_INVOICE_EXPIRED_SUPERADMIN !== "false",

    wavioTplInvoiceCreated: map.WAVIO_TEMPLATE_INVOICE_CREATED || "billing_invoice_created",
    wavioTplPaymentConfirmed: map.WAVIO_TEMPLATE_PAYMENT_CONFIRMED || "billing_payment_confirmed",
    wavioTplAffiliateCommission: map.WAVIO_TEMPLATE_AFFILIATE_COMMISSION || "billing_affiliate_commission",
    wavioTplSubscriptionReminder: map.WAVIO_TEMPLATE_SUBSCRIPTION_REMINDER || "billing_subscription_reminder",
    wavioTplPaymentSuccessSuperAdmin: map.WAVIO_TEMPLATE_PAYMENT_SUCCESS_SUPERADMIN || "superadmin_alert_payment_success",
    wavioTplWithdrawalRequestSuperAdmin: map.WAVIO_TEMPLATE_WITHDRAWAL_REQUEST_SUPERADMIN || "superadmin_alert_withdrawal_request",
    wavioTplInvoiceExpiredSuperAdmin: map.WAVIO_TEMPLATE_INVOICE_EXPIRED_SUPERADMIN || "superadmin_alert_invoice_expired",
  }
}

/**
 * Render template: replace {{variable}} placeholders with values
 */
function renderTemplate(template: string, vars: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), value)
  }
  return result
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID").format(amount)
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
  })
}

// ============================================================
// 1. NOTIFIKASI INVOICE DIBUAT → TENANT
// ============================================================
export async function notifyInvoiceCreated(paymentId: string): Promise<void> {
  try {
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: { tenant: true }
    })
    if (!payment) return

    const cfg = await getBillingSettings()
    const meta = payment.metadata as any
    const type = meta?.type === "ADDON_QUOTA" ? "Penambahan Kuota"
              : meta?.type === "AI_QUOTA" ? "Top-Up Token AI"
              : `Upgrade ${payment.plan?.toUpperCase() || "PAKET"}`

    const templateVars = {
      invoiceType: type,
      tenantName: payment.tenant.name,
      reference: payment.reference,
      amount: formatCurrency(payment.amount),
      expiredAt: payment.expiredAt ? formatDate(payment.expiredAt) : "-",
      bankName: cfg.bankName,
      bankNumber: cfg.bankNumber,
      bankAccountName: cfg.bankAccountName,
      adminWA: cfg.adminWA,
    }

    const waMessage = cfg.tplInvoiceCreated
      ? renderTemplate(cfg.tplInvoiceCreated, templateVars)
      : `*Invoice ${type} - ${cfg.platformName}*

Halo,

Invoice untuk ${type} ${payment.tenant.name} telah dibuat:

📋 No. Invoice: ${payment.reference}
💰 Total: Rp ${formatCurrency(payment.amount)}
⏰ Batas Bayar: ${payment.expiredAt ? formatDate(payment.expiredAt) : "-"}

Silakan transfer ke:
🏦 ${cfg.bankName}
💳 ${cfg.bankNumber}
📛 a.n. ${cfg.bankAccountName}

Setelah transfer, hubungi admin via WA ${cfg.adminWA} untuk konfirmasi pembayaran.

Terima kasih! 🙏`

    const emailHtml = `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 24px; border-radius: 12px 12px 0 0; color: white;">
          <h2 style="margin: 0;">📋 Invoice ${type}</h2>
          <p style="margin: 4px 0 0; opacity: 0.9;">${cfg.platformName}</p>
        </div>
        <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0;">
          <p>Halo,</p>
          <p>Invoice untuk <strong>${type}</strong> telah dibuat untuk <strong>${payment.tenant.name}</strong>.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px 0; color: #64748b;">No. Invoice</td><td style="padding: 8px 0; font-weight: 600;">${payment.reference}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;">Total Bayar</td><td style="padding: 8px 0; font-weight: 600; color: #4f46e5;">Rp ${formatCurrency(payment.amount)}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;">Batas Bayar</td><td style="padding: 8px 0; font-weight: 600; color: #dc2626;">${payment.expiredAt ? formatDate(payment.expiredAt) : "-"}</td></tr>
          </table>
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0 0 8px; font-weight: 600;">💳 Transfer ke:</p>
            <p style="margin: 0;">${cfg.bankName} — ${cfg.bankNumber}</p>
            <p style="margin: 0;">a.n. ${cfg.bankAccountName}</p>
          </div>
          <p style="color: #64748b; font-size: 13px;">Setelah transfer, hubungi admin via WA <strong>${cfg.adminWA}</strong> untuk konfirmasi pembayaran.</p>
        </div>
        <div style="background: #f1f5f9; padding: 12px 24px; border-radius: 0 0 12px 12px; text-align: center; color: #94a3b8; font-size: 12px;">
          ${cfg.platformName} — Platform Edukasi Terintegrasi
        </div>
      </div>`

    // Kirim ke admin/owner tenant
    await notifyTenantAdmins(payment.tenantId, {
      title: `Invoice ${type} Dibuat`,
      message: `Invoice ${payment.reference} sebesar Rp ${formatCurrency(payment.amount)} telah dibuat. Silakan lakukan pembayaran sebelum ${payment.expiredAt ? formatDate(payment.expiredAt) : "-"}.`,
      type: "info",
      channels: ["inapp"]
    })

    // Kirim WA + Email ke owner
    const owners = await db.tenantUser.findMany({
      where: { tenantId: payment.tenantId, role: { in: ["owner", "admin"] } },
      include: { user: { select: { phone: true, email: true } } }
    })

    for (const owner of owners) {
      if (owner.user.phone && cfg.enableInvoiceCreated) {
        const wavioVars = {
          "1": type,
          "2": payment.tenant.name,
          "3": payment.reference,
          "4": formatCurrency(payment.amount),
          "5": payment.expiredAt ? formatDate(payment.expiredAt) : "-",
          "6": cfg.bankName,
          "7": cfg.bankNumber,
          "8": cfg.bankAccountName,
          "9": cfg.adminWA
        }
        const pdfUrl = `${cfg.rootDomain}/api/public/invoice/${paymentId}/pdf?type=tenant`
        const finalWaMessage = `${waMessage}\n\n📄 Unduh Invoice PDF:\n${pdfUrl}`

        sendWhatsApp(owner.user.phone, finalWaMessage, undefined, { 
          name: cfg.wavioTplInvoiceCreated, 
          variables: wavioVars,
          buttonVariables: [`api/public/invoice/${paymentId}/pdf?type=tenant`] 
        }).catch(() => {})
      }
      if (owner.user.email && cfg.emailEnableInvoiceCreated) {
        sendEmail(owner.user.email, `Invoice ${type} - ${payment.reference}`, emailHtml).catch(() => {})
      }
    }

    logger.info("Billing notification: invoice created sent", { paymentId, reference: payment.reference })
  } catch (err) {
    logger.error("Billing notification: invoice created failed", err, { paymentId })
  }
}

// ============================================================
// 2. NOTIFIKASI INVOICE BARU → SUPER ADMIN
// ============================================================
export async function notifySuperAdminNewInvoice(paymentId: string): Promise<void> {
  try {
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: { tenant: true }
    })
    if (!payment) return

    const meta = payment.metadata as any
    const type = meta?.type === "ADDON_QUOTA" ? "Addon Kuota"
              : meta?.type === "AI_QUOTA" ? "Top-Up AI"
              : `Upgrade ${payment.plan?.toUpperCase() || "PAKET"}`

    const superAdmins = await db.user.findMany({
      where: { isSuperAdmin: true, isActive: true },
      select: { phone: true, email: true, name: true }
    })

    const waMessage = `*INVOICE BARU 📋*

Sekolah: ${payment.tenant.name}
Tipe: ${type}
Jumlah: Rp ${formatCurrency(payment.amount)}
No. Invoice: ${payment.reference}

Silakan pantau di Panel Super Admin.`

    for (const admin of superAdmins) {
      if (admin.phone) {
        const wavioVars = {
          "1": payment.tenant.name,
          "2": type,
          "3": formatCurrency(payment.amount),
          "4": payment.reference
        }
        const cfg = await getBillingSettings()
        sendWhatsApp(admin.phone, waMessage, undefined, { name: cfg.wavioTplPaymentSuccessSuperAdmin, variables: wavioVars }).catch(() => {})
      }
    }

    logger.info("Billing notification: super admin notified", { paymentId })
  } catch (err) {
    logger.error("Billing notification: super admin notify failed", err, { paymentId })
  }
}

// ============================================================
// 3. NOTIFIKASI PEMBAYARAN DIKONFIRMASI → TENANT
// ============================================================
export async function notifyPaymentConfirmed(paymentId: string): Promise<void> {
  try {
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: { tenant: true }
    })
    if (!payment) return

    const cfg = await getBillingSettings()
    const meta = payment.metadata as any
    const type = meta?.type === "ADDON_QUOTA" ? "Penambahan Kuota"
              : meta?.type === "AI_QUOTA" ? "Top-Up Token AI"
              : `Upgrade ${payment.plan?.toUpperCase() || "PAKET"}`

    const tenant = payment.tenant

    const templateVars = {
      tenantName: tenant.name,
      reference: payment.reference,
      amount: formatCurrency(payment.amount),
      invoiceType: type,
      studentQuota: String(tenant.studentQuota || 0),
      expiresAt: tenant.expiresAt ? formatDate(tenant.expiresAt) : "-",
    }

    const waMessage = cfg.tplPaymentConfirmed
      ? renderTemplate(cfg.tplPaymentConfirmed, templateVars)
      : `*Pembayaran Dikonfirmasi ✅ - ${cfg.platformName}*

Halo,

Pembayaran untuk ${tenant.name} telah dikonfirmasi!

📋 No. Invoice: ${payment.reference}
💰 Jumlah: Rp ${formatCurrency(payment.amount)}
📦 Tipe: ${type}${
  meta?.type !== "AI_QUOTA" ? `
👥 Kuota Siswa: ${tenant.studentQuota || 0}` : `
🤖 Token AI: +${formatCurrency(meta?.aiTokens || 0)}`
}${
  tenant.expiresAt ? `
📅 Aktif Hingga: ${formatDate(tenant.expiresAt)}` : ""
}

Selamat menggunakan fitur premium ${cfg.platformName}! 🎉`

    const emailHtml = `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 24px; border-radius: 12px 12px 0 0; color: white;">
          <h2 style="margin: 0;">✅ Pembayaran Dikonfirmasi</h2>
          <p style="margin: 4px 0 0; opacity: 0.9;">${cfg.platformName}</p>
        </div>
        <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0;">
          <p>Halo,</p>
          <p>Pembayaran untuk <strong>${tenant.name}</strong> telah berhasil dikonfirmasi!</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px 0; color: #64748b;">No. Invoice</td><td style="padding: 8px 0; font-weight: 600;">${payment.reference}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;">Jumlah</td><td style="padding: 8px 0; font-weight: 600; color: #059669;">Rp ${formatCurrency(payment.amount)}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;">Tipe</td><td style="padding: 8px 0; font-weight: 600;">${type}</td></tr>
            ${meta?.type !== "AI_QUOTA" 
              ? `<tr><td style="padding: 8px 0; color: #64748b;">Kuota Siswa</td><td style="padding: 8px 0; font-weight: 600;">${tenant.studentQuota || 0}</td></tr>`
              : `<tr><td style="padding: 8px 0; color: #64748b;">Token AI</td><td style="padding: 8px 0; font-weight: 600;">+${formatCurrency(meta?.aiTokens || 0)}</td></tr>`
            }
            ${tenant.expiresAt 
              ? `<tr><td style="padding: 8px 0; color: #64748b;">Aktif Hingga</td><td style="padding: 8px 0; font-weight: 600;">${formatDate(tenant.expiresAt)}</td></tr>`
              : ""
            }
          </table>
          <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center;">
            <p style="margin: 0; font-size: 18px;">🎉 Selamat menggunakan fitur premium!</p>
          </div>
        </div>
        <div style="background: #f1f5f9; padding: 12px 24px; border-radius: 0 0 12px 12px; text-align: center; color: #94a3b8; font-size: 12px;">
          ${cfg.platformName} — Platform Edukasi Terintegrasi
        </div>
      </div>`

    // In-app notification
    await notifyTenantAdmins(payment.tenantId, {
      title: "Pembayaran Dikonfirmasi ✅",
      message: `Pembayaran ${payment.reference} sebesar Rp ${formatCurrency(payment.amount)} telah dikonfirmasi. ${type} telah aktif.`,
      type: "success",
      channels: ["inapp"]
    })

    // WA + Email ke owner/admin
    const owners = await db.tenantUser.findMany({
      where: { tenantId: payment.tenantId, role: { in: ["owner", "admin"] } },
      include: { user: { select: { phone: true, email: true } } }
    })

    for (const owner of owners) {
      if (owner.user.phone && cfg.enablePaymentConfirmed) {
        const wavioVars = {
          "1": tenant.name,
          "2": payment.reference,
          "3": formatCurrency(payment.amount),
          "4": type,
          "5": String(tenant.studentQuota || 0),
          "6": tenant.expiresAt ? formatDate(tenant.expiresAt) : "-"
        }
        sendWhatsApp(owner.user.phone, waMessage, undefined, { name: cfg.wavioTplPaymentConfirmed, variables: wavioVars }).catch(() => {})
      }
      if (owner.user.email && cfg.emailEnablePaymentConfirmed) {
        sendEmail(owner.user.email, `Pembayaran Dikonfirmasi - ${payment.reference}`, emailHtml).catch(() => {})
      }
    }

    logger.info("Billing notification: payment confirmed sent", { paymentId })
  } catch (err) {
    logger.error("Billing notification: payment confirmed failed", err, { paymentId })
  }
}

// ============================================================
// 4. NOTIFIKASI KOMISI → AFILIASI
// ============================================================
export async function notifyAffiliateCommission(affiliateId: string, commissionAmount: number, tenantName: string): Promise<void> {
  try {
    const affiliate = await db.affiliateProfile.findUnique({
      where: { id: affiliateId },
      include: { user: { select: { phone: true, email: true, name: true } } }
    })
    if (!affiliate) return

    const cfg = await getBillingSettings()

    const templateVars = {
      affiliateName: affiliate.user.name || "Mitra",
      tenantName,
      commissionAmount: formatCurrency(commissionAmount),
      currentBalance: formatCurrency(affiliate.balance),
      totalEarnings: formatCurrency(affiliate.totalEarnings),
    }

    const waMessage = cfg.tplAffiliateCommission
      ? renderTemplate(cfg.tplAffiliateCommission, templateVars)
      : `*Komisi Masuk! 💰 - ${cfg.platformName}*

Halo ${affiliate.user.name},

Selamat! Anda mendapat komisi dari referral:

🏫 Sekolah: ${tenantName}
💰 Komisi: Rp ${formatCurrency(commissionAmount)}
💳 Saldo Saat Ini: Rp ${formatCurrency(affiliate.balance)}
📊 Total Pendapatan: Rp ${formatCurrency(affiliate.totalEarnings)}

Terima kasih sudah menjadi mitra ${cfg.platformName}! 🤝`

    const emailHtml = `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 24px; border-radius: 12px 12px 0 0; color: white;">
          <h2 style="margin: 0;">💰 Komisi Masuk!</h2>
          <p style="margin: 4px 0 0; opacity: 0.9;">Program Mitra ${cfg.platformName}</p>
        </div>
        <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0;">
          <p>Halo <strong>${affiliate.user.name}</strong>,</p>
          <p>Selamat! Anda mendapat komisi dari referral sekolah.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px 0; color: #64748b;">Sekolah</td><td style="padding: 8px 0; font-weight: 600;">${tenantName}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;">Komisi</td><td style="padding: 8px 0; font-weight: 600; color: #d97706;">Rp ${formatCurrency(commissionAmount)}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;">Saldo Saat Ini</td><td style="padding: 8px 0; font-weight: 600;">Rp ${formatCurrency(affiliate.balance)}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;">Total Pendapatan</td><td style="padding: 8px 0; font-weight: 600;">Rp ${formatCurrency(affiliate.totalEarnings)}</td></tr>
          </table>
        </div>
        <div style="background: #f1f5f9; padding: 12px 24px; border-radius: 0 0 12px 12px; text-align: center; color: #94a3b8; font-size: 12px;">
          ${cfg.platformName} — Program Mitra Afiliasi
        </div>
      </div>`

    if (affiliate.user.phone && cfg.enableAffiliateCommission) {
      const wavioVars = {
        "1": affiliate.user.name || "Mitra",
        "2": tenantName,
        "3": formatCurrency(commissionAmount),
        "4": formatCurrency(affiliate.balance),
        "5": formatCurrency(affiliate.totalEarnings)
      }
      await sendWhatsApp(affiliate.user.phone, waMessage, undefined, { name: cfg.wavioTplAffiliateCommission, variables: wavioVars }).catch(() => {})
    }
    if (affiliate.user.email && cfg.emailEnableAffiliateCommission) {
      await sendEmail(affiliate.user.email, `Komisi Masuk - Rp ${formatCurrency(commissionAmount)}`, emailHtml).catch(() => {})
    }

    logger.info("Billing notification: affiliate commission sent", { affiliateId, commissionAmount })
  } catch (err) {
    logger.error("Billing notification: affiliate commission failed", err, { affiliateId })
  }
}

// ============================================================
// 5. NOTIFIKASI INVOICE EXPIRED → TENANT
// ============================================================
export async function notifyInvoiceExpired(paymentIds: string[]): Promise<void> {
  try {
    const payments = await db.payment.findMany({
      where: { id: { in: paymentIds } },
      include: { tenant: true }
    })

    for (const payment of payments) {
      const waMessage = `*Invoice Kedaluwarsa ⏰*

Halo,

Invoice ${payment.reference} untuk ${payment.tenant.name} sebesar Rp ${formatCurrency(payment.amount)} telah kedaluwarsa karena tidak ada pembayaran dalam batas waktu yang ditentukan.

Silakan buat invoice baru jika Anda masih ingin melakukan upgrade.

Terima kasih.`

      await notifyTenantAdmins(payment.tenantId, {
        title: "Invoice Kedaluwarsa ⏰",
        message: `Invoice ${payment.reference} telah expired. Silakan buat invoice baru untuk melanjutkan upgrade.`,
        type: "warning",
        channels: ["inapp"]
      })

      const owners = await db.tenantUser.findMany({
        where: { tenantId: payment.tenantId, role: { in: ["owner", "admin"] } },
        include: { user: { select: { phone: true } } }
      })

      for (const owner of owners) {
        if (owner.user.phone) {
          const cfg = await getBillingSettings()
          const wavioVars = {
            "1": payment.reference,
            "2": payment.tenant.name,
            "3": formatCurrency(payment.amount)
          }
          sendWhatsApp(owner.user.phone, waMessage, undefined, { name: cfg.wavioTplInvoiceExpiredSuperAdmin, variables: wavioVars }).catch(() => {})
        }
      }
    }

    logger.info("Billing notification: invoice expired sent", { count: paymentIds.length })
  } catch (err) {
    logger.error("Billing notification: invoice expired failed", err, { paymentIds })
  }
}

// ============================================================
// 6. NOTIFIKASI SUBSCRIPTION HAMPIR HABIS → TENANT
// ============================================================
export async function notifySubscriptionExpiring(): Promise<SubscriptionReminderResultDTO> {
  try {
    const now = new Date()
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const oneDay = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000)

    // Cari tenant berbayar (pro/lite) yang akan expired dalam 30, 7, atau 1 hari
    const expiringTenants = await db.tenant.findMany({
      where: {
        plan: { not: "free" },
        isActive: true,
        expiresAt: {
          gte: now,
          lte: thirtyDays
        }
      },
      select: { id: true, name: true, plan: true, expiresAt: true, slug: true }
    })

    let sentCount = 0
    const cfg = await getBillingSettings()

    for (const tenant of expiringTenants) {
      if (!tenant.expiresAt) continue

      const diffMs = tenant.expiresAt.getTime() - now.getTime()
      const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000))

      // Hanya kirim di hari-hari kritis: H-30, H-7, H-3, H-1
      if (![30, 7, 3, 1].includes(diffDays)) continue

      const urgency = diffDays <= 1 ? "🔴" : diffDays <= 7 ? "🟡" : "🟢"

      const templateVars = {
        urgency,
        tenantName: tenant.name,
        daysRemaining: String(diffDays),
        expiresAt: formatDate(tenant.expiresAt),
      }

      const waMessage = cfg.tplSubscriptionReminder
        ? renderTemplate(cfg.tplSubscriptionReminder, templateVars)
        : `*${urgency} Pengingat Langganan - SchoolPro*

Halo,

Langganan ${tenant.plan?.toUpperCase() || "Premium"} untuk ${tenant.name} akan berakhir dalam *${diffDays} hari* (${formatDate(tenant.expiresAt)}).

Segera perpanjang langganan Anda agar tidak kehilangan akses ke fitur premium.

Kunjungi: Menu Langganan di Dashboard Admin.`

      await notifyTenantAdmins(tenant.id, {
        title: `Langganan Berakhir ${diffDays} Hari Lagi`,
        message: `Langganan ${tenant.plan?.toUpperCase() || "Premium"} ${tenant.name} akan berakhir pada ${formatDate(tenant.expiresAt)}. Segera perpanjang untuk menjaga akses fitur premium.`,
        type: diffDays <= 3 ? "warning" : "info",
        channels: ["inapp"]
      })

      const owners = await db.tenantUser.findMany({
        where: { tenantId: tenant.id, role: { in: ["owner", "admin"] } },
        include: { user: { select: { phone: true, email: true } } }
      })

      for (const owner of owners) {
        if (owner.user.phone && cfg.enableSubscriptionReminder) {
          const wavioVars = {
            "1": urgency,
            "2": tenant.plan?.toUpperCase() || "Premium",
            "3": tenant.name,
            "4": String(diffDays),
            "5": formatDate(tenant.expiresAt)
          }
          sendWhatsApp(owner.user.phone, waMessage, undefined, { name: cfg.wavioTplSubscriptionReminder, variables: wavioVars }).catch(() => {})
        }
      }

      sentCount++
    }

    return { success: true, processed: expiringTenants.length, sent: sentCount }
  } catch (err: any) {
    logger.error("Billing notification: subscription expiring failed", err)
    return { success: false, processed: 0, sent: 0, error: err.message || "Failed to process subscription reminder" }
  }
}

// ============================================================
// 7. NOTIFIKASI PEMBAYARAN BERHASIL → SUPER ADMIN
// ============================================================
export async function notifySuperAdminPaymentSuccess(paymentId: string): Promise<void> {
  try {
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: { tenant: true }
    })
    if (!payment) return

    const cfg = await getBillingSettings()
    if (!cfg.enablePaymentSuccessSuperAdmin && !cfg.emailEnablePaymentSuccessSuperAdmin) return

    const meta = payment.metadata as any
    const type = meta?.type === "ADDON_QUOTA" ? "Addon Kuota"
              : meta?.type === "AI_QUOTA" ? "Top-Up AI"
              : `Upgrade ${payment.plan?.toUpperCase() || "PAKET"}`

    const templateVars = {
      tenantName: payment.tenant.name,
      amount: formatCurrency(payment.amount),
      invoiceType: type,
      reference: payment.reference,
    }

    const waMessage = cfg.tplPaymentSuccessSuperAdmin
      ? renderTemplate(cfg.tplPaymentSuccessSuperAdmin, templateVars)
      : `*PEMBAYARAN BERHASIL! 💰*\n\nHore! Pembayaran sebesar Rp ${templateVars.amount} dari sekolah ${templateVars.tenantName} telah berhasil.\n\nTipe: ${templateVars.invoiceType}\nReference: ${templateVars.reference}\n\nSilakan cek dashboard untuk detail lebih lanjut.`

    const emailHtml = `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 24px; border-radius: 12px 12px 0 0; color: white;">
          <h2 style="margin: 0;">💰 Pembayaran Berhasil!</h2>
        </div>
        <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; line-height: 1.6;">
          <p>${waMessage.replace(/\n/g, "<br>")}</p>
        </div>
      </div>`

    const superAdmins = await db.user.findMany({
      where: { isSuperAdmin: true, isActive: true },
      select: { phone: true, email: true }
    })

    for (const admin of superAdmins) {
      if (admin.phone && cfg.enablePaymentSuccessSuperAdmin) {
        const wavioVars = {
          "1": templateVars.amount,
          "2": templateVars.tenantName,
          "3": templateVars.invoiceType,
          "4": templateVars.reference
        }
        sendWhatsApp(admin.phone, waMessage, undefined, { name: cfg.wavioTplPaymentSuccessSuperAdmin, variables: wavioVars }).catch(() => {})
      }
      if (admin.email && cfg.emailEnablePaymentSuccessSuperAdmin) {
        sendEmail(admin.email, `💰 Pembayaran Berhasil - ${payment.reference}`, emailHtml).catch(() => {})
      }
    }
  } catch (err) {
    logger.error("Billing notification: notifySuperAdminPaymentSuccess failed", err, { paymentId })
  }
}

// ============================================================
// 8. NOTIFIKASI WITHDRAWAL REQUEST → SUPER ADMIN
// ============================================================
export async function notifySuperAdminWithdrawalRequest(withdrawalId: string): Promise<void> {
  try {
    const withdrawal = await db.affiliateWithdrawal.findUnique({
      where: { id: withdrawalId },
      include: { affiliate: { include: { user: true } } }
    })
    if (!withdrawal) return

    const cfg = await getBillingSettings()
    if (!cfg.enableWithdrawalRequestSuperAdmin && !cfg.emailEnableWithdrawalRequestSuperAdmin) return

    const templateVars = {
      affiliateName: withdrawal.affiliate.user.name || "Afiliasi",
      amount: formatCurrency(withdrawal.amount),
      bankName: withdrawal.bankName || "-",
      bankAccount: withdrawal.bankAccount || "-",
      accountName: withdrawal.accountName || "-",
    }

    const waMessage = cfg.tplWithdrawalRequestSuperAdmin
      ? renderTemplate(cfg.tplWithdrawalRequestSuperAdmin, templateVars)
      : `*🚨 PERMINTAAN PENARIKAN DANA BARU*\n\nAfiliasi: ${templateVars.affiliateName}\nJumlah: Rp ${templateVars.amount}\nBank: ${templateVars.bankName} - ${templateVars.bankAccount}\na.n: ${templateVars.accountName}\n\nSilakan proses pembayaran dan update status di Dashboard Super Admin.`

    const emailHtml = `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 24px; border-radius: 12px 12px 0 0; color: white;">
          <h2 style="margin: 0;">🚨 Permintaan Penarikan Dana Baru</h2>
        </div>
        <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; line-height: 1.6;">
          <p>${waMessage.replace(/\n/g, "<br>")}</p>
        </div>
      </div>`

    const superAdmins = await db.user.findMany({
      where: { isSuperAdmin: true, isActive: true },
      select: { phone: true, email: true }
    })

    for (const admin of superAdmins) {
      if (admin.phone && cfg.enableWithdrawalRequestSuperAdmin) {
        const wavioVars = {
          "1": templateVars.affiliateName,
          "2": templateVars.amount,
          "3": templateVars.bankName,
          "4": templateVars.bankAccount,
          "5": templateVars.accountName
        }
        sendWhatsApp(admin.phone, waMessage, undefined, { name: cfg.wavioTplWithdrawalRequestSuperAdmin, variables: wavioVars }).catch(() => {})
      }
      if (admin.email && cfg.emailEnableWithdrawalRequestSuperAdmin) {
        sendEmail(admin.email, `🚨 Permintaan Penarikan Dana Baru - Rp ${templateVars.amount}`, emailHtml).catch(() => {})
      }
    }
  } catch (err) {
    logger.error("Billing notification: notifySuperAdminWithdrawalRequest failed", err, { withdrawalId })
  }
}

// ============================================================
// 9. NOTIFIKASI INVOICE EXPIRED → SUPER ADMIN
// ============================================================
export async function notifySuperAdminInvoiceExpired(paymentId: string): Promise<void> {
  try {
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: { tenant: true }
    })
    if (!payment) return

    const cfg = await getBillingSettings()
    if (!cfg.enableInvoiceExpiredSuperAdmin && !cfg.emailEnableInvoiceExpiredSuperAdmin) return

    const templateVars = {
      tenantName: payment.tenant.name,
      amount: formatCurrency(payment.amount),
      reference: payment.reference,
    }

    const waMessage = cfg.tplInvoiceExpiredSuperAdmin
      ? renderTemplate(cfg.tplInvoiceExpiredSuperAdmin, templateVars)
      : `*⚠️ INVOICE KEDALUWARSA*\n\nInvoice dari tenant ${templateVars.tenantName} telah kedaluwarsa dan gagal dibayar.\n\nReference: ${templateVars.reference}\nNominal: Rp ${templateVars.amount}\n\nMohon tim sales mem-follow up sekolah ini.`

    const emailHtml = `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #e11d48, #be123c); padding: 24px; border-radius: 12px 12px 0 0; color: white;">
          <h2 style="margin: 0;">⚠️ Invoice Kedaluwarsa</h2>
        </div>
        <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; line-height: 1.6;">
          <p>${waMessage.replace(/\n/g, "<br>")}</p>
        </div>
      </div>`

    const superAdmins = await db.user.findMany({
      where: { isSuperAdmin: true, isActive: true },
      select: { phone: true, email: true }
    })

    for (const admin of superAdmins) {
      if (admin.phone && cfg.enableInvoiceExpiredSuperAdmin) {
        const wavioVars = {
          "1": templateVars.tenantName,
          "2": templateVars.reference,
          "3": templateVars.amount
        }
        sendWhatsApp(admin.phone, waMessage, undefined, { name: cfg.wavioTplInvoiceExpiredSuperAdmin, variables: wavioVars }).catch(() => {})
      }
      if (admin.email && cfg.emailEnableInvoiceExpiredSuperAdmin) {
        sendEmail(admin.email, `⚠️ Invoice Kedaluwarsa - ${payment.reference}`, emailHtml).catch(() => {})
      }
    }
  } catch (err) {
    logger.error("Billing notification: notifySuperAdminInvoiceExpired failed", err, { paymentId })
  }
}
