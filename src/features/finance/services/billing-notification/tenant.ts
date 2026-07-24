import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { sendWhatsApp, sendEmail, notifyTenantAdmins } from "@/features/notification/services/notification.service"
import { getBillingSettings, renderTemplate, formatCurrency, formatDate, SubscriptionReminderResultDTO } from "./settings"

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

    await notifyTenantAdmins(payment.tenantId, {
      title: `Invoice ${type} Dibuat`,
      message: `Invoice ${payment.reference} sebesar Rp ${formatCurrency(payment.amount)} telah dibuat. Silakan lakukan pembayaran sebelum ${payment.expiredAt ? formatDate(payment.expiredAt) : "-"}.`,
      type: "info",
      channels: ["inapp"]
    })

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
// 2. NOTIFIKASI PEMBAYARAN DIKONFIRMASI → TENANT
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
      studentQuota: String((tenant as any).studentQuota || 0),
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
👥 Kuota Klien: ${(tenant as any).studentQuota || 0}` : `
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
              ? `<tr><td style="padding: 8px 0; color: #64748b;">Kuota Klien</td><td style="padding: 8px 0; font-weight: 600;">${(tenant as any).studentQuota || 0}</td></tr>`
              : `<tr><td style="padding: 8px 0; color: #64748b;">Token AI</td><td style="padding: 8px 0; font-weight: 600;">+\${formatCurrency(meta?.aiTokens || 0)}</td></tr>`
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

    await notifyTenantAdmins(payment.tenantId, {
      title: "Pembayaran Dikonfirmasi ✅",
      message: `Pembayaran ${payment.reference} sebesar Rp ${formatCurrency(payment.amount)} telah dikonfirmasi. ${type} telah aktif.`,
      type: "success",
      channels: ["inapp"]
    })

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
          "5": String((tenant as any).studentQuota || 0),
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
// 3. NOTIFIKASI INVOICE EXPIRED → TENANT
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
// 4. NOTIFIKASI SUBSCRIPTION HAMPIR HABIS → TENANT
// ============================================================
export async function notifySubscriptionExpiring(): Promise<SubscriptionReminderResultDTO> {
  try {
    const now = new Date()
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

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
        : `*${urgency} Pengingat Langganan - BisnisPro*

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
