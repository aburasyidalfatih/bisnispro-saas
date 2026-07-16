import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { sendWhatsApp, sendEmail } from "@/features/notification/services/notification.service"
import { getBillingSettings, renderTemplate, formatCurrency } from "./settings"

// ============================================================
// 1. NOTIFIKASI INVOICE BARU → SUPER ADMIN
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
// 2. NOTIFIKASI PEMBAYARAN BERHASIL → SUPER ADMIN
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
// 3. NOTIFIKASI WITHDRAWAL REQUEST → SUPER ADMIN
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
// 4. NOTIFIKASI INVOICE EXPIRED → SUPER ADMIN
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
