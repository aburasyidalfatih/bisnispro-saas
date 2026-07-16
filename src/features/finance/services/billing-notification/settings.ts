import { db } from "@/lib/db"

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

  tplWithdrawalApprovedAffiliate: string
  enableWithdrawalApprovedAffiliate: boolean
  emailEnableWithdrawalApprovedAffiliate: boolean

  tplWithdrawalRejectedAffiliate: string
  enableWithdrawalRejectedAffiliate: boolean
  emailEnableWithdrawalRejectedAffiliate: boolean

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
  wavioTplWithdrawalApprovedAffiliate: string
  wavioTplWithdrawalRejectedAffiliate: string
}

export type SubscriptionReminderResultDTO = {
  success: boolean
  processed: number
  sent: number
  error?: string
}

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
    "WA_TEMPLATE_WITHDRAWAL_APPROVED_AFFILIATE", "WA_ENABLE_WITHDRAWAL_APPROVED_AFFILIATE", "EMAIL_ENABLE_WITHDRAWAL_APPROVED_AFFILIATE",
    "WA_TEMPLATE_WITHDRAWAL_REJECTED_AFFILIATE", "WA_ENABLE_WITHDRAWAL_REJECTED_AFFILIATE", "EMAIL_ENABLE_WITHDRAWAL_REJECTED_AFFILIATE",
    "WA_TEMPLATE_PAYMENT_SUCCESS_SUPERADMIN", "WA_ENABLE_PAYMENT_SUCCESS_SUPERADMIN", "EMAIL_ENABLE_PAYMENT_SUCCESS_SUPERADMIN",
    "WA_TEMPLATE_WITHDRAWAL_REQUEST_SUPERADMIN", "WA_ENABLE_WITHDRAWAL_REQUEST_SUPERADMIN", "EMAIL_ENABLE_WITHDRAWAL_REQUEST_SUPERADMIN",
    "WA_TEMPLATE_INVOICE_EXPIRED_SUPERADMIN", "WA_ENABLE_INVOICE_EXPIRED_SUPERADMIN", "EMAIL_ENABLE_INVOICE_EXPIRED_SUPERADMIN",
    "WAVIO_TEMPLATE_INVOICE_CREATED", "WAVIO_TEMPLATE_PAYMENT_CONFIRMED", "WAVIO_TEMPLATE_AFFILIATE_COMMISSION", "WAVIO_TEMPLATE_SUBSCRIPTION_REMINDER",
    "WAVIO_TEMPLATE_PAYMENT_SUCCESS_SUPERADMIN", "WAVIO_TEMPLATE_WITHDRAWAL_REQUEST_SUPERADMIN", "WAVIO_TEMPLATE_INVOICE_EXPIRED_SUPERADMIN",
    "WAVIO_TEMPLATE_WITHDRAWAL_APPROVED_AFFILIATE", "WAVIO_TEMPLATE_WITHDRAWAL_REJECTED_AFFILIATE"
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

    tplWithdrawalApprovedAffiliate: map.WA_TEMPLATE_WITHDRAWAL_APPROVED_AFFILIATE || "",
    enableWithdrawalApprovedAffiliate: map.WA_ENABLE_WITHDRAWAL_APPROVED_AFFILIATE !== "false",
    emailEnableWithdrawalApprovedAffiliate: map.EMAIL_ENABLE_WITHDRAWAL_APPROVED_AFFILIATE !== "false",

    tplWithdrawalRejectedAffiliate: map.WA_TEMPLATE_WITHDRAWAL_REJECTED_AFFILIATE || "",
    enableWithdrawalRejectedAffiliate: map.WA_ENABLE_WITHDRAWAL_REJECTED_AFFILIATE !== "false",
    emailEnableWithdrawalRejectedAffiliate: map.EMAIL_ENABLE_WITHDRAWAL_REJECTED_AFFILIATE !== "false",

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
    wavioTplPaymentSuccessSuperAdmin: map.WAVIO_TEMPLATE_PAYMENT_SUCCESS_SUPERADMIN || "",
    wavioTplWithdrawalRequestSuperAdmin: map.WAVIO_TEMPLATE_WITHDRAWAL_REQUEST_SUPERADMIN || "",
    wavioTplInvoiceExpiredSuperAdmin: map.WAVIO_TEMPLATE_INVOICE_EXPIRED_SUPERADMIN || "",
    wavioTplWithdrawalApprovedAffiliate: map.WAVIO_TEMPLATE_WITHDRAWAL_APPROVED_AFFILIATE || "",
    wavioTplWithdrawalRejectedAffiliate: map.WAVIO_TEMPLATE_WITHDRAWAL_REJECTED_AFFILIATE || "",
  }
}

export function renderTemplate(template: string, vars: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), value)
  }
  return result
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID").format(amount)
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
  })
}
