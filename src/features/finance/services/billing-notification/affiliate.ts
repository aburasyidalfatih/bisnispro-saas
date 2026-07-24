import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { sendWhatsApp, sendEmail } from "@/features/notification/services/notification.service"
import { getBillingSettings, renderTemplate, formatCurrency } from "./settings"

// ============================================================
// 1. NOTIFIKASI KOMISI → AFILIASI
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

🏫 Perusahaan: ${tenantName}
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
          <p>Selamat! Anda mendapat komisi dari referral perusahaan.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px 0; color: #64748b;">Perusahaan</td><td style="padding: 8px 0; font-weight: 600;">${tenantName}</td></tr>
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
// 2. NOTIFIKASI WITHDRAWAL AFILIASI DISETUJUI → AFILIASI
// ============================================================
export async function notifyAffiliateWithdrawalApproved(withdrawalId: string): Promise<void> {
  try {
    const withdrawal = await db.affiliateWithdrawal.findUnique({
      where: { id: withdrawalId },
      include: { affiliate: { include: { user: true } } }
    })
    if (!withdrawal) return

    const cfg = await getBillingSettings()
    
    const templateVars = {
      affiliateName: withdrawal.affiliate.user.name || "Mitra",
      amount: formatCurrency(withdrawal.amount),
      bankName: withdrawal.bankName || "-",
      bankAccount: withdrawal.bankAccount || "-",
      accountName: withdrawal.accountName || "-"
    }

    const waMessage = cfg.tplWithdrawalApprovedAffiliate
      ? renderTemplate(cfg.tplWithdrawalApprovedAffiliate, templateVars)
      : `*✅ Pencairan Dana Berhasil! - ${cfg.platformName}*

Halo ${withdrawal.affiliate.user.name},

Permintaan pencairan dana afiliasi Anda telah **disetujui** dan dana telah ditransfer ke rekening Anda.

💰 *Nominal:* Rp ${formatCurrency(withdrawal.amount)}
🏦 *Bank:* ${withdrawal.bankName || "-"}
🔢 *No. Rek:* ${withdrawal.bankAccount || "-"}
👤 *A.N:* ${withdrawal.accountName || "-"}

Terima kasih atas kerja sama Anda bersama ${cfg.platformName}! 🤝`

    const emailHtml = `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 24px; border-radius: 12px 12px 0 0; color: white;">
          <h2 style="margin: 0;">✅ Pencairan Dana Berhasil!</h2>
        </div>
        <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; line-height: 1.6;">
          <p>Halo <strong>${withdrawal.affiliate.user.name}</strong>,</p>
          <p>Kabar baik! Permintaan pencairan dana afiliasi Anda telah diproses dan dana telah dikirimkan ke rekening Anda.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px 0; color: #64748b;">Nominal</td><td style="padding: 8px 0; font-weight: 600; color: #059669;">Rp ${formatCurrency(withdrawal.amount)}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;">Bank</td><td style="padding: 8px 0; font-weight: 600;">${withdrawal.bankName || "-"}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;">No. Rekening</td><td style="padding: 8px 0; font-weight: 600;">${withdrawal.bankAccount || "-"}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;">Atas Nama</td><td style="padding: 8px 0; font-weight: 600;">${withdrawal.accountName || "-"}</td></tr>
          </table>
        </div>
      </div>`

    if (withdrawal.affiliate.user.phone && cfg.enableWithdrawalApprovedAffiliate) {
      const wavioVars = {
        "1": templateVars.affiliateName,
        "2": templateVars.amount,
        "3": templateVars.bankName,
        "4": templateVars.bankAccount,
        "5": templateVars.accountName
      }
      sendWhatsApp(withdrawal.affiliate.user.phone, waMessage, undefined, { name: cfg.wavioTplWithdrawalApprovedAffiliate, variables: wavioVars }).catch(() => {})
    }
    if (withdrawal.affiliate.user.email && cfg.emailEnableWithdrawalApprovedAffiliate) {
      sendEmail(withdrawal.affiliate.user.email, `✅ Pencairan Dana Berhasil - Rp ${formatCurrency(withdrawal.amount)}`, emailHtml).catch(() => {})
    }

    logger.info("Billing notification: notifyAffiliateWithdrawalApproved sent", { withdrawalId })
  } catch (err) {
    logger.error("Billing notification: notifyAffiliateWithdrawalApproved failed", err, { withdrawalId })
  }
}

// ============================================================
// 3. NOTIFIKASI WITHDRAWAL AFILIASI DITOLAK → AFILIASI
// ============================================================
export async function notifyAffiliateWithdrawalRejected(withdrawalId: string): Promise<void> {
  try {
    const withdrawal = await db.affiliateWithdrawal.findUnique({
      where: { id: withdrawalId },
      include: { affiliate: { include: { user: true } } }
    })
    if (!withdrawal) return

    const cfg = await getBillingSettings()

    const templateVars = {
      affiliateName: withdrawal.affiliate.user.name || "Mitra",
      amount: formatCurrency(withdrawal.amount),
      notes: withdrawal.notes || "Silakan hubungi admin untuk informasi lebih lanjut."
    }
    
    const waMessage = cfg.tplWithdrawalRejectedAffiliate
      ? renderTemplate(cfg.tplWithdrawalRejectedAffiliate, templateVars)
      : `*❌ Pencairan Dana Ditolak - ${cfg.platformName}*

Halo ${withdrawal.affiliate.user.name},

Mohon maaf, permintaan pencairan dana afiliasi Anda sebesar Rp ${formatCurrency(withdrawal.amount)} **ditolak** oleh admin.

*Catatan:* ${withdrawal.notes || "Silakan hubungi admin untuk informasi lebih lanjut."}

Dana telah **dikembalikan** ke saldo afiliasi Anda. Anda dapat mengajukan penarikan kembali dengan informasi rekening yang valid.

Terima kasih.`

    const emailHtml = `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 24px; border-radius: 12px 12px 0 0; color: white;">
          <h2 style="margin: 0;">❌ Pencairan Dana Ditolak</h2>
        </div>
        <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; line-height: 1.6;">
          <p>Halo <strong>${withdrawal.affiliate.user.name}</strong>,</p>
          <p>Mohon maaf, permintaan pencairan dana afiliasi Anda sebesar <strong>Rp ${formatCurrency(withdrawal.amount)}</strong> ditolak oleh admin.</p>
          <p style="background: #fee2e2; padding: 12px; border-radius: 8px; color: #991b1b; font-size: 14px; font-weight: 500;">Catatan Admin: ${withdrawal.notes || "Silakan hubungi admin untuk informasi lebih lanjut."}</p>
          <p>Dana tersebut telah <strong>dikembalikan</strong> utuh ke saldo afiliasi Anda.</p>
        </div>
      </div>`

    if (withdrawal.affiliate.user.phone && cfg.enableWithdrawalRejectedAffiliate) {
      const wavioVars = {
        "1": templateVars.affiliateName,
        "2": templateVars.amount,
        "3": templateVars.notes
      }
      sendWhatsApp(withdrawal.affiliate.user.phone, waMessage, undefined, { name: cfg.wavioTplWithdrawalRejectedAffiliate, variables: wavioVars }).catch(() => {})
    }
    if (withdrawal.affiliate.user.email && cfg.emailEnableWithdrawalRejectedAffiliate) {
      sendEmail(withdrawal.affiliate.user.email, `❌ Pencairan Dana Ditolak - Rp ${formatCurrency(withdrawal.amount)}`, emailHtml).catch(() => {})
    }

    logger.info("Billing notification: notifyAffiliateWithdrawalRejected sent", { withdrawalId })
  } catch (err) {
    logger.error("Billing notification: notifyAffiliateWithdrawalRejected failed", err, { withdrawalId })
  }
}
